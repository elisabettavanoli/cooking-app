/**
 * Gates the app behind a passwordless email login — but only when a backend is
 * configured. With no Supabase env vars it renders children straight through,
 * so local/offline use is unchanged.
 *
 * Flow: enter email → we send a 6-digit code (+ a magic link) → type the code
 * here. The code path needs no redirect, so it works inside an installed PWA
 * and across devices. Clicking the link still works for in-browser use.
 */
import { useState, type ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { Button, Field } from "./ui";
import styles from "./AuthGate.module.css";

export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, configured, session, sendCode, verifyCode } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured) return <>{children}</>;
  if (!ready) return null;
  if (session) return <>{children}</>;

  async function send() {
    setBusy(true);
    setError(null);
    const res = await sendCode(email);
    setBusy(false);
    if (res.error) setError(res.error);
    else setSent(true);
  }

  async function verify() {
    setBusy(true);
    setError(null);
    const res = await verifyCode(email, code);
    setBusy(false);
    if (res.error) setError(res.error);
    // on success onAuthStateChange sets the session and this component swaps
    // to <children>.
  }

  function reset() {
    setSent(false);
    setCode("");
    setError(null);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Co-oking</h1>

        {sent ? (
          <>
            <p className={styles.hint}>
              Abbiamo mandato un codice a <strong>{email}</strong>. Inseriscilo
              qui sotto (oppure apri il link nella mail da questo browser).
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim().length >= 6 && !busy) void verify();
              }}
            >
              <Field
                label="Codice a 6 cifre"
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                autoCapitalize="none"
              />
              {error ? <p className={styles.error}>{error}</p> : null}
              <Button
                type="submit"
                label={busy ? "Verifica…" : "Entra"}
                disabled={busy || code.trim().length < 6}
                style={{ width: "100%", marginTop: 8 }}
              />
            </form>
            <button type="button" className={styles.link} onClick={reset}>
              Cambia indirizzo / rimanda il codice
            </button>
          </>
        ) : (
          <>
            <p className={styles.hint}>
              Entra con la tua email: ricevi un codice, nessuna password.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim() && !busy) void send();
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
                label={busy ? "Invio…" : "Inviami il codice"}
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
