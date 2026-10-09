-- Co-oking: secure community sharing requests.
-- Requests are created and transitioned through RPCs, not direct client writes.

-- ─────────────────────────── indexes ───────────────────────────

create index if not exists share_requests_pending_lookup_idx
  on public.share_requests (community_id, requester_id, owner_id, concept_id)
  where status = 'pending';

-- ─────────────────────────── permissions ───────────────────────

-- Clients may read requests involving themselves, but all writes must go
-- through the validated RPCs below.
drop policy if exists requests_insert on public.share_requests;
drop policy if exists requests_update on public.share_requests;

-- ─────────────────────────── create request ────────────────────

create or replace function public.co_create_share_request(
  p_community_id uuid,
  p_owner_id uuid,
  p_concept_id text,
  p_message text default null
)
returns public.share_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requester_id uuid := auth.uid();
  v_item public.pantry_items%rowtype;
  v_request public.share_requests%rowtype;
  v_message text;
begin
  if v_requester_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_owner_id is null or p_community_id is null
     or nullif(pg_catalog.btrim(p_concept_id), '') is null then
    raise exception 'Missing request details' using errcode = '22023';
  end if;

  if p_owner_id = v_requester_id then
    raise exception 'Cannot request your own ingredient' using errcode = '22023';
  end if;

  v_message := nullif(pg_catalog.btrim(p_message), '');

  if v_message is not null and pg_catalog.char_length(v_message) > 500 then
    raise exception 'Message must be at most 500 characters'
      using errcode = '22023';
  end if;

  -- Both users must currently belong to the specified community.
  if not exists (
    select 1
    from public.community_members m
    where m.community_id = p_community_id
      and m.user_id = v_requester_id
  ) or not exists (
    select 1
    from public.community_members m
    where m.community_id = p_community_id
      and m.user_id = p_owner_id
  ) then
    raise exception 'Both users must belong to the community'
      using errcode = '42501';
  end if;

  -- The owner must have opted into community sharing and incoming requests.
  if not exists (
    select 1
    from public.profiles p
    where p.id = p_owner_id
      and p.share_with_communities
      and p.requests_enabled
  ) then
    raise exception 'This user is not accepting sharing requests'
      using errcode = '42501';
  end if;

  -- The requested concept must still exist in the owner's active pantry.
  select pi.*
  into v_item
  from public.pantry_items pi
  where pi.owner_id = p_owner_id
    and pi.concept_id = pg_catalog.btrim(p_concept_id)
    and pi.status = 'active'
  order by pi.added_at desc
  limit 1
  for update;

  if not found then
    raise exception 'Ingredient is no longer available'
      using errcode = 'P0002';
  end if;

  -- Serialize concurrent requests for the same community, users and concept.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_community_id::text || ':' ||
      v_requester_id::text || ':' ||
      p_owner_id::text || ':' ||
      pg_catalog.btrim(p_concept_id),
      0
    )
  );

  -- Reuse an existing pending request instead of creating a duplicate.
  select sr.*
  into v_request
  from public.share_requests sr
  where sr.community_id = p_community_id
    and sr.requester_id = v_requester_id
    and sr.owner_id = p_owner_id
    and sr.concept_id = v_item.concept_id
    and sr.status = 'pending'
  limit 1;

  if found then
    return v_request;
  end if;

  insert into public.share_requests (
    community_id,
    requester_id,
    owner_id,
    concept_id,
    display_name,
    status,
    message
  )
  values (
    p_community_id,
    v_requester_id,
    p_owner_id,
    v_item.concept_id,
    v_item.display_name,
    'pending',
    v_message
  )
  returning * into v_request;

  return v_request;
end;
$$;

-- ─────────────────────────── transition request ────────────────

create or replace function public.co_update_share_request(
  p_request_id uuid,
  p_action text
)
returns public.share_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.share_requests%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_action is null or p_action not in ('accept', 'decline', 'cancel') then
    raise exception 'Invalid request action' using errcode = '22023';
  end if;

  select sr.*
  into v_request
  from public.share_requests sr
  where sr.id = p_request_id
  for update;

  if not found then
    raise exception 'Share request not found' using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Only pending requests can be changed'
      using errcode = '22023';
  end if;

  if p_action = 'cancel' then
    if v_request.requester_id <> v_user_id then
      raise exception 'Only the requester can cancel this request'
        using errcode = '42501';
    end if;

    update public.share_requests
    set status = 'cancelled'
    where id = v_request.id
    returning * into v_request;

  elsif p_action = 'decline' then
    if v_request.owner_id <> v_user_id then
      raise exception 'Only the owner can decline this request'
        using errcode = '42501';
    end if;

    update public.share_requests
    set status = 'declined'
    where id = v_request.id
    returning * into v_request;

  elsif p_action = 'accept' then
    if v_request.owner_id <> v_user_id then
      raise exception 'Only the owner can accept this request'
        using errcode = '42501';
    end if;

    -- Acceptance is allowed only while both users remain in the community,
    -- the owner still shares with communities, and the ingredient is active.
    if not exists (
      select 1
      from public.community_members m1
      join public.community_members m2
        on m2.community_id = m1.community_id
      where m1.community_id = v_request.community_id
        and m1.user_id = v_request.requester_id
        and m2.user_id = v_request.owner_id
    ) then
      raise exception 'Both users must remain community members'
        using errcode = '42501';
    end if;

    if not exists (
      select 1
      from public.profiles p
      where p.id = v_request.owner_id
        and p.share_with_communities
    ) then
      raise exception 'The owner is no longer sharing pantry items'
        using errcode = '42501';
    end if;

    perform 1
    from public.pantry_items pi
    where pi.owner_id = v_request.owner_id
      and pi.concept_id = v_request.concept_id
      and pi.status = 'active'
    limit 1
    for update;

    if not found then
      raise exception 'Ingredient is no longer available'
        using errcode = 'P0002';
    end if;

    update public.share_requests
    set status = 'accepted'
    where id = v_request.id
    returning * into v_request;
  end if;

  return v_request;
end;
$$;

-- ─────────────────────────── RPC grants ────────────────────────

revoke all on function public.co_create_share_request(uuid, uuid, text, text)
  from public, anon;
revoke all on function public.co_update_share_request(uuid, text)
  from public, anon;

grant execute on function public.co_create_share_request(uuid, uuid, text, text)
  to authenticated;
grant execute on function public.co_update_share_request(uuid, text)
  to authenticated;
