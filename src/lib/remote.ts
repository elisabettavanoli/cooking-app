/**
 * Supabase data layer for the store's "remote" mode (authenticated user).
 * Pure functions: fetch the user's rows, write single rows. All row ⇄ app-type
 * mapping (snake_case ⇄ camelCase) lives here so store.tsx stays about state.
 *
 * Every write throws on error; the caller (RemoteCookingProvider) does an
 * optimistic local update first and re-syncs from the server if a write fails.
 */
import { supabase } from "./supabase";
import type { InventoryItem, ShoppingItem, UserProfile } from "./types";

interface PantryRow {
  id: string;
  concept_id: string;
  display_name: string;
  quantity: number | string;
  unit: InventoryItem["unit"];
  category: InventoryItem["category"];
  expiry: string | null;
  notes: string | null;
  status: InventoryItem["status"];
  added_at: string;
}

interface ShoppingRow {
  id: string;
  concept_id: string;
  display_name: string;
  quantity: number | string;
  unit: ShoppingItem["unit"];
  category: ShoppingItem["category"];
  purchased: boolean;
  source: ShoppingItem["source"];
  created_at: string;
}

interface ProfileRow {
  id: string;
  display_name: string;
  sharing_enabled: boolean;
  requests_enabled: boolean;
  inventory_visible: boolean;
}

// ── row → app ──────────────────────────────────────────────
const toInventory = (r: PantryRow): InventoryItem => ({
  id: r.id,
  conceptId: r.concept_id,
  displayName: r.display_name,
  quantity: Number(r.quantity),
  unit: r.unit,
  category: r.category,
  expiry: r.expiry ?? undefined,
  notes: r.notes ?? undefined,
  status: r.status,
  addedAt: r.added_at,
});

const toShopping = (r: ShoppingRow): ShoppingItem => ({
  id: r.id,
  conceptId: r.concept_id,
  displayName: r.display_name,
  quantity: Number(r.quantity),
  unit: r.unit,
  category: r.category,
  purchased: r.purchased,
  source: r.source,
  createdAt: r.created_at,
});

const toProfile = (r: ProfileRow): UserProfile => ({
  id: r.id,
  displayName: r.display_name,
  sharingEnabled: r.sharing_enabled,
  requestsEnabled: r.requests_enabled,
  inventoryVisible: r.inventory_visible,
});

const defaultProfile = (userId: string): UserProfile => ({
  id: userId,
  displayName: "You",
  sharingEnabled: false,
  requestsEnabled: false,
  inventoryVisible: false,
});

// ── app → row (partial patch) ─────────────────────────────
function inventoryPatch(p: Partial<InventoryItem>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.conceptId !== undefined) out.concept_id = p.conceptId;
  if (p.displayName !== undefined) out.display_name = p.displayName;
  if (p.quantity !== undefined) out.quantity = p.quantity;
  if (p.unit !== undefined) out.unit = p.unit;
  if (p.category !== undefined) out.category = p.category;
  if (p.expiry !== undefined) out.expiry = p.expiry ?? null;
  if (p.notes !== undefined) out.notes = p.notes ?? null;
  if (p.status !== undefined) out.status = p.status;
  return out;
}

function shoppingPatch(p: Partial<ShoppingItem>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.conceptId !== undefined) out.concept_id = p.conceptId;
  if (p.displayName !== undefined) out.display_name = p.displayName;
  if (p.quantity !== undefined) out.quantity = p.quantity;
  if (p.unit !== undefined) out.unit = p.unit;
  if (p.category !== undefined) out.category = p.category;
  if (p.purchased !== undefined) out.purchased = p.purchased;
  if (p.source !== undefined) out.source = p.source;
  return out;
}

function profilePatch(p: Partial<UserProfile>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.displayName !== undefined) out.display_name = p.displayName;
  if (p.sharingEnabled !== undefined) out.sharing_enabled = p.sharingEnabled;
  if (p.requestsEnabled !== undefined) out.requests_enabled = p.requestsEnabled;
  if (p.inventoryVisible !== undefined) out.inventory_visible = p.inventoryVisible;
  return out;
}

function db() {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

// ── reads ─────────────────────────────────────────────────
export async function fetchAll(userId: string): Promise<{
  inventory: InventoryItem[];
  shoppingList: ShoppingItem[];
  profile: UserProfile;
}> {
  const [pantry, shopping, profile] = await Promise.all([
    db()
      .from("pantry_items")
      .select("*")
      .eq("owner_id", userId)
      .order("added_at", { ascending: false }),
    db()
      .from("shopping_items")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false }),
    db().from("profiles").select("*").eq("id", userId).maybeSingle(),
  ]);
  if (pantry.error) throw pantry.error;
  if (shopping.error) throw shopping.error;
  if (profile.error) throw profile.error;

  return {
    inventory: (pantry.data as PantryRow[]).map(toInventory),
    shoppingList: (shopping.data as ShoppingRow[]).map(toShopping),
    profile: profile.data
      ? toProfile(profile.data as ProfileRow)
      : defaultProfile(userId),
  };
}

// ── writes ────────────────────────────────────────────────
export async function insertInventory(userId: string, item: InventoryItem) {
  const { error } = await db()
    .from("pantry_items")
    .insert({
      id: item.id,
      owner_id: userId,
      added_at: item.addedAt,
      ...inventoryPatch(item),
    });
  if (error) throw error;
}

export async function patchInventory(id: string, updates: Partial<InventoryItem>) {
  const { error } = await db()
    .from("pantry_items")
    .update(inventoryPatch(updates))
    .eq("id", id);
  if (error) throw error;
}

export async function deleteInventory(id: string) {
  const { error } = await db().from("pantry_items").delete().eq("id", id);
  if (error) throw error;
}

export async function insertShopping(userId: string, item: ShoppingItem) {
  const { error } = await db()
    .from("shopping_items")
    .insert({
      id: item.id,
      owner_id: userId,
      created_at: item.createdAt,
      ...shoppingPatch(item),
    });
  if (error) throw error;
}

export async function patchShopping(id: string, updates: Partial<ShoppingItem>) {
  const { error } = await db()
    .from("shopping_items")
    .update(shoppingPatch(updates))
    .eq("id", id);
  if (error) throw error;
}

export async function deleteShopping(id: string) {
  const { error } = await db().from("shopping_items").delete().eq("id", id);
  if (error) throw error;
}

export async function patchProfile(userId: string, updates: Partial<UserProfile>) {
  const { error } = await db()
    .from("profiles")
    .update(profilePatch(updates))
    .eq("id", userId);
  if (error) throw error;
}

export async function clearAll(userId: string) {
  const pantry = await db().from("pantry_items").delete().eq("owner_id", userId);
  if (pantry.error) throw pantry.error;
  const shopping = await db()
    .from("shopping_items")
    .delete()
    .eq("owner_id", userId);
  if (shopping.error) throw shopping.error;
}
