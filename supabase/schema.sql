-- Co-oking — Postgres schema for the community phase.
-- Paste into the Supabase SQL Editor (or use `supabase db` / migrations later).
-- Safe to re-run: drops and recreates policies; tables use IF NOT EXISTS.
--
-- Model: every user owns their own pantry_items / shopping_items. Users join
-- one or more `communities` by invite code. Inside a community, a member whose
-- profile has share_with_communities exposes their ACTIVE pantry items
-- (read-only) to co-members, who can raise a share_request to borrow one.
-- Separately, share_on_map puts a coarse-located kitchen on the public map,
-- readable by any signed-in user.

-- ─────────────────────────── extensions ───────────────────────────
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ─────────────────────────── reference lists ───────────────────────────
-- category / unit are stored as text + CHECK (not enum) so the app's TS union
-- stays the single source of truth and the list is easy to widen.
-- Keep in sync with src/lib/types.ts (Category, Unit).
create or replace function public.co_categories() returns text[]
  language sql immutable as $$ select array[
    'fruit','vegetables','dairy','meat-fish','pantry','sauces-condiments',
    'spices-herbs','baking','drinks','breakfast-snacks','snacks','other'
  ] $$;

create or replace function public.co_units() returns text[]
  language sql immutable as $$ select array[
    'piece','g','kg','ml','l','cup','tbsp','tsp','pack','bunch','can','bottle'
  ] $$;

-- ─────────────────────────── tables ───────────────────────────
create table if not exists public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  display_name           text not null default 'You',
  share_with_communities boolean not null default false,
  share_on_map           boolean not null default false,
  requests_enabled       boolean not null default false,
  latitude               double precision,
  longitude              double precision,
  created_at             timestamptz not null default now()
);

-- Migration for projects created before the community/map sharing split:
-- add the new columns, copy the old sharing flag over, drop the retired ones.
alter table public.profiles add column if not exists share_with_communities boolean not null default false;
alter table public.profiles add column if not exists share_on_map           boolean not null default false;
alter table public.profiles add column if not exists latitude               double precision;
alter table public.profiles add column if not exists longitude              double precision;
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles'
               and column_name = 'sharing_enabled') then
    update public.profiles set share_with_communities = sharing_enabled;
    -- policies that reference the retired column block the drop; they are
    -- recreated against the new columns further down (RLS section).
    drop policy if exists pantry_community on public.pantry_items;
    alter table public.profiles drop column sharing_enabled;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles'
               and column_name = 'inventory_visible') then
    alter table public.profiles drop column inventory_visible;
  end if;
end $$;

create index if not exists profiles_map_idx on public.profiles (latitude, longitude) where share_on_map;

create table if not exists public.communities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text not null unique default upper(substr(md5(random()::text), 1, 6)),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member',
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table if not exists public.pantry_items (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  concept_id   text not null,
  display_name text not null,
  quantity     numeric not null default 1,
  unit         text not null default 'piece'  check (unit = any (public.co_units())),
  category     text not null default 'other'  check (category = any (public.co_categories())),
  expiry       date,
  notes        text,
  status       text not null default 'active' check (status in ('active','consumed')),
  added_at     timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists pantry_items_owner_status_idx on public.pantry_items (owner_id, status);

create table if not exists public.shopping_items (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  concept_id   text not null,
  display_name text not null,
  quantity     numeric not null default 1,
  unit         text not null default 'piece' check (unit = any (public.co_units())),
  category     text not null default 'other' check (category = any (public.co_categories())),
  purchased    boolean not null default false,
  source       text not null default 'manual' check (source in ('manual','from-inventory','from-recipe')),
  created_at   timestamptz not null default now()
);
create index if not exists shopping_items_owner_idx on public.shopping_items (owner_id);

create table if not exists public.share_requests (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  concept_id   text not null,
  display_name text not null,
  status       text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  message      text,
  created_at   timestamptz not null default now()
);
create index if not exists share_requests_owner_idx     on public.share_requests (owner_id, status);
create index if not exists share_requests_requester_idx on public.share_requests (requester_id, status);

-- ─────────────────────────── new-user trigger ───────────────────────────
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name',
                           split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- backfill any users that already exist
insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data ->> 'display_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

-- ─────────────────────────── helper functions (bypass RLS, no recursion) ───────────────────────────
create or replace function public.is_community_member(cid uuid) returns boolean
  language sql security definer set search_path = '' stable as $$
  select exists (
    select 1 from public.community_members
    where community_id = cid and user_id = auth.uid()
  );
$$;

create or replace function public.shares_community_with(other uuid) returns boolean
  language sql security definer set search_path = '' stable as $$
  select exists (
    select 1
    from public.community_members m1
    join public.community_members m2 on m1.community_id = m2.community_id
    where m1.user_id = auth.uid() and m2.user_id = other
  );
$$;

-- join by invite code (client can't SELECT a community it isn't in yet)
create or replace function public.join_community_by_code(p_code text) returns uuid
  language plpgsql security definer set search_path = '' as $$
declare cid uuid;
begin
  select id into cid from public.communities where code = upper(trim(p_code));
  if cid is null then raise exception 'Codice comunità non valido'; end if;
  insert into public.community_members (community_id, user_id)
  values (cid, auth.uid())
  on conflict do nothing;
  return cid;
end $$;

-- ─────────────────────────── RLS ───────────────────────────
alter table public.profiles          enable row level security;
alter table public.communities       enable row level security;
alter table public.community_members enable row level security;
alter table public.pantry_items      enable row level security;
alter table public.shopping_items    enable row level security;
alter table public.share_requests    enable row level security;

-- profiles
drop policy if exists profiles_own       on public.profiles;
drop policy if exists profiles_community  on public.profiles;
create policy profiles_own on public.profiles
  for all  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_community on public.profiles
  for select using (public.shares_community_with(id));

-- communities
drop policy if exists communities_read   on public.communities;
drop policy if exists communities_insert on public.communities;
drop policy if exists communities_update on public.communities;
create policy communities_read on public.communities
  for select using (public.is_community_member(id) or created_by = auth.uid());
create policy communities_insert on public.communities
  for insert with check (created_by = auth.uid());
create policy communities_update on public.communities
  for update using (created_by = auth.uid());

-- community_members
drop policy if exists members_read   on public.community_members;
drop policy if exists members_join   on public.community_members;
drop policy if exists members_leave  on public.community_members;
create policy members_read on public.community_members
  for select using (user_id = auth.uid() or public.is_community_member(community_id));
create policy members_join on public.community_members
  for insert with check (user_id = auth.uid());
create policy members_leave on public.community_members
  for delete using (user_id = auth.uid());

-- pantry_items
drop policy if exists pantry_own        on public.pantry_items;
drop policy if exists pantry_community   on public.pantry_items;
create policy pantry_own on public.pantry_items
  for all  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy pantry_community on public.pantry_items
  for select using (
    status = 'active'
    and public.shares_community_with(owner_id)
    and exists (select 1 from public.profiles p
                where p.id = owner_id and p.share_with_communities)
  );

-- shopping_items — strictly private
drop policy if exists shopping_own on public.shopping_items;
create policy shopping_own on public.shopping_items
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- share_requests
drop policy if exists requests_read   on public.share_requests;
drop policy if exists requests_insert on public.share_requests;
drop policy if exists requests_update on public.share_requests;
create policy requests_read on public.share_requests
  for select using (requester_id = auth.uid() or owner_id = auth.uid());
create policy requests_insert on public.share_requests
  for insert with check (requester_id = auth.uid()
                         and public.shares_community_with(owner_id));
create policy requests_update on public.share_requests
  for update using (requester_id = auth.uid() or owner_id = auth.uid());

-- ─────────────────────────── map: public kitchens ───────────────────────────
-- `share_on_map` opts a profile into the open map. Its ACTIVE pantry items and
-- its coarse-located profile row then become readable by any signed-in user.
-- These sub-selects hit a different table / a plain column — no policy recursion.
drop policy if exists pantry_map_public   on public.pantry_items;
drop policy if exists profiles_map_public  on public.profiles;
create policy pantry_map_public on public.pantry_items
  for select using (
    status = 'active'
    and auth.uid() is not null
    and exists (select 1 from public.profiles p
                where p.id = owner_id and p.share_on_map)
  );
create policy profiles_map_public on public.profiles
  for select using (auth.uid() is not null and share_on_map);

-- ─────────────────────────── community RPCs ───────────────────────────
-- Create a community and add the caller as owner in one shot (avoids a
-- half-created community if the membership insert trips RLS).
create or replace function public.co_create_community(p_name text)
  returns public.communities
  language plpgsql security definer set search_path = '' as $$
declare c public.communities;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  insert into public.communities (name, created_by)
  values (nullif(trim(p_name), ''), auth.uid())
  returning * into c;
  insert into public.community_members (community_id, user_id, role)
  values (c.id, auth.uid(), 'owner');
  return c;
end $$;

-- Search an ingredient across every community the caller belongs to. The
-- `where me.user_id = auth.uid()` + join chain is the sole guard (shared
-- community AND the owner opted in). Never returns `notes`.
create or replace function public.co_search_shared_item(p_query text)
  returns table (
    owner_id uuid, owner_name text,
    community_id uuid, community_name text,
    concept_id text, display_name text, category text,
    quantity numeric, unit text
  )
  language sql security definer set search_path = '' stable as $$
  select distinct on (pi.owner_id, c.id, pi.concept_id)
         pi.owner_id, pr.display_name, c.id, c.name,
         pi.concept_id, pi.display_name, pi.category, pi.quantity, pi.unit
  from public.community_members me
  join public.community_members them on them.community_id = me.community_id
  join public.communities c   on c.id = me.community_id
  join public.profiles pr     on pr.id = them.user_id
  join public.pantry_items pi on pi.owner_id = them.user_id
  where me.user_id = auth.uid()
    and them.user_id <> auth.uid()
    and pi.status = 'active'
    and pr.share_with_communities
    and (pi.display_name ilike '%' || trim(p_query) || '%'
      or pi.concept_id  ilike '%' || trim(p_query) || '%');
$$;

-- Public kitchens within a bounding box (~p_radius_km). Coords are already
-- coarse (rounded client-side before storage); no PostGIS needed.
create or replace function public.co_nearby_public_kitchens(
    p_lat double precision, p_lng double precision, p_radius_km double precision default 5
  )
  returns table (
    owner_id uuid, owner_name text,
    latitude double precision, longitude double precision,
    item_count bigint
  )
  language sql security definer set search_path = '' stable as $$
  select p.id, p.display_name, p.latitude, p.longitude, count(pi.id)
  from public.profiles p
  left join public.pantry_items pi
    on pi.owner_id = p.id and pi.status = 'active'
  where auth.uid() is not null
    and p.share_on_map
    and p.latitude is not null and p.longitude is not null
    and p.id <> auth.uid()
    and p.latitude  between p_lat - (p_radius_km / 111.0)
                        and p_lat + (p_radius_km / 111.0)
    and p.longitude between p_lng - (p_radius_km / (111.0 * greatest(cos(radians(p_lat)), 0.01)))
                        and p_lng + (p_radius_km / (111.0 * greatest(cos(radians(p_lat)), 0.01)))
  group by p.id, p.display_name, p.latitude, p.longitude;
$$;

revoke all on function public.co_create_community(text)        from public, anon;
revoke all on function public.co_search_shared_item(text)      from public, anon;
revoke all on function public.co_nearby_public_kitchens(double precision, double precision, double precision)
                                                              from public, anon;
grant execute on function public.co_create_community(text)     to authenticated;
grant execute on function public.co_search_shared_item(text)   to authenticated;
grant execute on function public.co_nearby_public_kitchens(double precision, double precision, double precision)
                                                              to authenticated;

-- ─────────────────────────── realtime ───────────────────────────
do $$
declare t text;
begin
  foreach t in array array['pantry_items','shopping_items','share_requests','community_members','communities']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;  -- already in the publication
    end;
  end loop;
end $$;
