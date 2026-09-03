/**
 * Supabase client — the backend entry point for auth, sync and the (upcoming)
 * community features. See AGENTS.md: this replaces the local-only stand-ins as
 * the app grows a real server.
 *
 * Both env vars come from `.env.local` (see `.env.example`). When either is
 * missing `supabase` is null and the app stays fully local — `AuthGate` then
 * renders the app straight through with no login, exactly as before.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Handle the magic-link callback (?code=…) on load, then clean the URL.
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;
