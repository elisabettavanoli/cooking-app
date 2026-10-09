-- Community sharing automatically enables incoming requests.
-- Keep all existing validation and duplicate-request protection.

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

  -- Sharing with communities also enables incoming requests.
  if not exists (
    select 1
    from public.profiles p
    where p.id = p_owner_id
      and p.share_with_communities
  ) then
    raise exception 'This user is not sharing pantry items with communities'
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

revoke all on function public.co_create_share_request(uuid, uuid, text, text)
    from public, anon;

grant execute on function public.co_create_share_request(uuid, uuid, text, text)
  to authenticated;