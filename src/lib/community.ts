/**
 * Supabase data layer for community discovery (authenticated users only).
 * Mirrors `remote.ts`: pure functions, snake_case ⇄ camelCase mapping lives
 * here, every call throws on error so the caller can surface a message.
 *
 * Reads/writes go through the schema's RLS + `security definer` RPCs
 * (`join_community_by_code`, `co_create_community`, `co_search_shared_item`,
 * `co_nearby_public_kitchens`). See `supabase/schema.sql`.
 */
import { supabase } from "./supabase";
import type { Community, CommunityItemHit, NearbyKitchen } from "./types";

function db() {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

interface CommunityRow {
  id: string;
  name: string;
  code: string;
  created_by?: string | null;
}

const toCommunity = (r: CommunityRow, memberCount?: number): Community => ({
  id: r.id,
  name: r.name,
  code: r.code,
  createdBy: r.created_by ?? null,
  memberCount,
});

/** Communities the user belongs to, each with its member count. */
export async function fetchMyCommunities(userId: string): Promise<Community[]> {
  const mine = await db()
    .from("community_members")
    .select("community_id, communities(id, name, code, created_by)")
    .eq("user_id", userId);
  if (mine.error) throw mine.error;

  const rows = (mine.data ?? []) as unknown as {
    community_id: string;
    communities: CommunityRow | null;
  }[];
  const communities = rows
    .map((r) => r.communities)
    .filter((c): c is CommunityRow => c != null);
  if (communities.length === 0) return [];

  const counts = await db()
    .from("community_members")
    .select("community_id")
    .in(
      "community_id",
      communities.map((c) => c.id),
    );
  if (counts.error) throw counts.error;

  const tally = new Map<string, number>();
  for (const row of (counts.data ?? []) as { community_id: string }[]) {
    tally.set(row.community_id, (tally.get(row.community_id) ?? 0) + 1);
  }

  return communities
    .map((c) => toCommunity(c, tally.get(c.id) ?? 1))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Create a community (atomic: also adds the caller as owner). Returns it. */
export async function createCommunity(name: string): Promise<Community> {
  const { data, error } = await db().rpc("co_create_community", {
    p_name: name.trim(),
  });
  if (error) throw error;
  return toCommunity(data as CommunityRow, 1);
}

/** Join by invite code. Returns the community id. Throws on a bad code. */
export async function joinByCode(code: string): Promise<string> {
  const { data, error } = await db().rpc("join_community_by_code", {
    p_code: code.trim(),
  });
  if (error) throw error;
  return data as string;
}

export async function leaveCommunity(communityId: string, userId: string): Promise<void> {
  const { error } = await db()
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId);
  if (error) throw error;
}

interface ItemHitRow {
  owner_id: string;
  owner_name: string;
  community_id: string;
  community_name: string;
  concept_id: string;
  display_name: string;
  category: CommunityItemHit["category"];
  quantity: number | string | null;
  unit: CommunityItemHit["unit"];
}

/** Search an ingredient across every community you're in. */
export async function searchSharedItem(query: string): Promise<CommunityItemHit[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await db().rpc("co_search_shared_item", { p_query: q });
  if (error) throw error;
  return ((data ?? []) as ItemHitRow[]).map((r) => ({
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    communityId: r.community_id,
    communityName: r.community_name,
    conceptId: r.concept_id,
    displayName: r.display_name,
    category: r.category,
    quantity: r.quantity == null ? null : Number(r.quantity),
    unit: r.unit,
  }));
}

interface NearbyKitchenRow {
  owner_id: string;
  owner_name: string;
  latitude: number;
  longitude: number;
  item_count: number | string;
}

/** Public kitchens within `radiusKm` of a point, for the map. */
export async function fetchNearbyKitchens(
  lat: number,
  lng: number,
  radiusKm = 5,
): Promise<NearbyKitchen[]> {
  const { data, error } = await db().rpc("co_nearby_public_kitchens", {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm,
  });
  if (error) throw error;
  return ((data ?? []) as NearbyKitchenRow[]).map((r) => ({
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    latitude: r.latitude,
    longitude: r.longitude,
    itemCount: Number(r.item_count),
  }));
}
