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
        // Implicit flow (token in the URL hash) so a magic link opened in a
        // *different* browser than the one that requested it still logs in —
        // PKCE would need the code verifier from the original browser's storage.
        // The primary path is the 6-digit OTP code though (see AuthGate), which
        // needs no redirect at all — the right fit for an installed PWA.
        detectSessionInUrl: true,
        flowType: "implicit",
      },
    })
  : null;
