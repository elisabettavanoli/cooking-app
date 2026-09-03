/**
 * Auth context — thin wrapper over Supabase Auth (email + password).
 *
 * With "Confirm email" turned OFF in the Supabase dashboard, `signUp` returns a
 * session immediately — no email round-trip, no redirect, works inside an
 * installed PWA.
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
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
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
      async signUp(email, password, displayName) {
        if (!supabase) return { error: "Backend non configurato." };
        const clean = email.trim();
        const { error } = await supabase.auth.signUp({
          email: clean,
          password,
          options: {
            data: { display_name: displayName.trim() || clean.split("@")[0] },
          },
        });
        return { error: error?.message ?? null };
      },
      async signIn(email, password) {
        if (!supabase) return { error: "Backend non configurato." };
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
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
