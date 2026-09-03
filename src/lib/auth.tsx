/**
 * Auth context — thin wrapper over Supabase Auth (passwordless email).
 *
 * `sendCode` emails a 6-digit code (and a magic link); `verifyCode` exchanges
 * the code for a session in *this* browser — no redirect, so it works inside an
 * installed PWA. The magic link still works too, for in-browser use.
 *
 * When Supabase isn't configured this still mounts and reports
 * `configured: false`; `AuthGate` uses that to skip the login screen so the
 * app keeps working offline / local-only.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";

interface AuthValue {
  /** Initial session lookup finished (always true when not configured). */
  ready: boolean;
  /** Supabase env vars are present. */
  configured: boolean;
  session: Session | null;
  user: User | null;
  /** Email a 6-digit code + magic link. Resolves with a message on failure. */
  sendCode: (email: string) => Promise<{ error: string | null }>;
  /** Verify the 6-digit code and open a session here. */
  verifyCode: (email: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      configured: supabaseConfigured,
      session,
      user: session?.user ?? null,
      async sendCode(email) {
        if (!supabase) return { error: "Backend non configurato." };
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: window.location.origin,
            shouldCreateUser: true,
          },
        });
        return { error: error?.message ?? null };
      },
      async verifyCode(email, token) {
        if (!supabase) return { error: "Backend non configurato." };
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token.trim(),
          type: "email",
        });
        return { error: error?.message ?? null };
      },
      async signOut() {
        await supabase?.auth.signOut();
      },
    }),
    [ready, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
