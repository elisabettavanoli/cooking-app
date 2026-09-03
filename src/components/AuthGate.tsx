/**
 * Gates the app behind an email + password login — but only when a backend is
 * configured. With no Supabase env vars it renders children straight through,
 * so local/offline use is unchanged.
 */
import { useState, type ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { Button, Field } from "./ui";
import styles from "./AuthGate.module.css";

type Mode = "signin" | "signup";

export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, configured, session, signIn, signUp } = useAuth();
  const { t } = useI18n();
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
          {mode === "signin" ? t("auth.signinHint") : t("auth.signupHint")}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit && !busy) void submit();
          }}
        >
          {mode === "signup" ? (
            <Field
              label={t("auth.name")}
              value={name}
              onChangeText={setName}
              placeholder={t("auth.namePlaceholder")}
              autoCapitalize="words"
            />
          ) : null}
          <Field
            label={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            placeholder={t("auth.emailPlaceholder")}
            inputMode="email"
            autoCapitalize="none"
          />
          <Field
            label={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth.passwordPlaceholder")}
            type="password"
            autoCapitalize="none"
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <Button
            type="submit"
            label={
              busy
                ? t("auth.wait")
                : mode === "signin"
                  ? t("auth.signin")
                  : t("auth.signup")
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
          {mode === "signin" ? t("auth.toSignup") : t("auth.toSignin")}
        </button>
      </div>
    </div>
  );
}
