/**
 * Gates the app behind an email magic-link login — but only when a backend is
 * configured. With no Supabase env vars it renders children straight through,
 * so local/offline use is unchanged.
 */
import { useState, type ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { Button, Field } from "./ui";
import styles from "./AuthGate.module.css";

export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, configured, session, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured) return <>{children}</>;
  if (!ready) return null;
  if (session) return <>{children}</>;

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await signInWithEmail(email);
    setBusy(false);
    if (res.error) setError(res.error);
    else setSent(true);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Co-oking</h1>
        {sent ? (
          <p className={styles.hint}>
            Ti abbiamo mandato un link di accesso a <strong>{email}</strong>.
            Aprilo su questo dispositivo per entrare.
          </p>
        ) : (
          <>
            <p className={styles.hint}>
              Entra con la tua email: ricevi un link, nessuna password.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim() && !busy) void submit();
              }}
            >
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@esempio.it"
                inputMode="email"
                autoCapitalize="none"
              />
              {error ? <p className={styles.error}>{error}</p> : null}
              <Button
                type="submit"
                label={busy ? "Invio…" : "Inviami il link"}
                disabled={busy || !email.trim()}
                style={{ width: "100%", marginTop: 8 }}
              />
            </form>
          </>
        )}
      </div>
    </div>
  );
}
