-- Co-oking: expose request availability in community search results.

drop function if exists public.co_search_shared_item(text);

create function public.co_search_shared_item(p_query text)
returns table (
  owner_id uuid,
  owner_name text,
  community_id uuid,
  community_name text,
  concept_id text,
  display_name text,
  category text,
  quantity numeric,
  unit text,
  requests_enabled boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select distinct on (pi.owner_id, c.id, pi.concept_id)
         pi.owner_id,
         pr.display_name,
         c.id,
         c.name,
         pi.concept_id,
         pi.display_name,
         pi.category,
         pi.quantity,
         pi.unit,
         pr.requests_enabled
  from public.community_members me
  join public.community_members them
    on them.community_id = me.community_id
  join public.communities c
    on c.id = me.community_id
  join public.profiles pr
    on pr.id = them.user_id
  join public.pantry_items pi
    on pi.owner_id = them.user_id
  where me.user_id = auth.uid()
    and them.user_id <> auth.uid()
    and pi.status = 'active'
    and pr.share_with_communities
    and (
      pi.display_name ilike '%' || pg_catalog.btrim(p_query) || '%'
      or pi.concept_id ilike '%' || pg_catalog.btrim(p_query) || '%'
    );
$$;

revoke all on function public.co_search_shared_item(text) from public, anon;
grant execute on function public.co_search_shared_item(text) to authenticated;
