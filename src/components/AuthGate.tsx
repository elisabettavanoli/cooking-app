/**
 * Gates the app behind an email + password login — but only when a backend is
 * configured. With no Supabase env vars it renders children straight through,
 * so local/offline use is unchanged.
 */
import { useState, type ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { Button, Field } from "./ui";
import styles from "./AuthGate.module.css";

type Mode = "signin" | "signup";

export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, configured, session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured) return <>{children}</>;
  if (!ready) return null;
  if (session) return <>{children}</>;

  const canSubmit =
    email.trim().length > 3 &&
    password.length >= 6 &&
    (mode === "signin" || name.trim().length > 0);

  async function submit() {
    setBusy(true);
    setError(null);
    const res =
      mode === "signup"
        ? await signUp(email, password, name)
        : await signIn(email, password);
    setBusy(false);
    if (res.error) setError(res.error);
    // on success onAuthStateChange sets the session → this swaps to <children>.
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Co-oking</h1>
        <p className={styles.hint}>
          {mode === "signin"
            ? "Accedi con email e password."
            : "Crea un account per condividere la dispensa."}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit && !busy) void submit();
          }}
        >
          {mode === "signup" ? (
            <Field
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Come ti chiamano"
              autoCapitalize="words"
            />
          ) : null}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@esempio.it"
            inputMode="email"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="almeno 6 caratteri"
            type="password"
            autoCapitalize="none"
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <Button
            type="submit"
            label={
              busy
                ? "Attendi…"
                : mode === "signin"
                  ? "Entra"
                  : "Crea account"
            }
            disabled={busy || !canSubmit}
            style={{ width: "100%", marginTop: 8 }}
          />
        </form>

        <button
          type="button"
          className={styles.link}
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
        >
          {mode === "signin"
            ? "Non hai un account? Registrati"
            : "Hai già un account? Accedi"}
        </button>
      </div>
    </div>
  );
}
