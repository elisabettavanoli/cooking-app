/**
 * Supabase client — the backend entry point for auth, sync and the (upcoming)
 * community features. See AGENTS.md: this replaces the local-only stand-ins as
 * the app grows a real server.
 *
 * Both env vars come from `.env.local` (see `.env.example`). When either is
 * missing `supabase` is null and the app stays fully local — `AuthGate` then
 * renders the app straight through with no login, exactly as before.
 *
 * Auth session persistence:
 *  - `persistSession` + an explicit `storage` keep you logged in across reloads
 *    and app restarts. `safeStorage()` never throws, so a locked-down
 *    localStorage (Safari private mode, storage disabled) degrades to an
 *    in-memory session for that tab instead of crashing client init.
 *  - The client is memoised on `globalThis` so Vite HMR / double module
 *    evaluation can't spin up a second GoTrue instance that fights the first
 *    one over the stored token (a classic "logged out on every reload" in dev).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

/** localStorage key the auth session is stored under. Stable — do not rename. */
export const AUTH_STORAGE_KEY = "cooking-auth";

type MinimalStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function safeStorage(): MinimalStorage {
  try {
    const probe = "__cooking_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => {
        mem.set(k, v);
      },
      removeItem: (k) => {
        mem.delete(k);
      },
    };
  }
}

type GlobalWithSb = typeof globalThis & { __cookingSupabase__?: SupabaseClient | null };
const g = globalThis as GlobalWithSb;

function makeClient(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  return createClient(url as string, anonKey as string, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Email + password only — no redirect/magic-link flow to parse.
      detectSessionInUrl: false,
      storage: safeStorage(),
      storageKey: AUTH_STORAGE_KEY,
    },
  });
}

export const supabase: SupabaseClient | null =
  g.__cookingSupabase__ !== undefined
    ? g.__cookingSupabase__
    : (g.__cookingSupabase__ = makeClient());
