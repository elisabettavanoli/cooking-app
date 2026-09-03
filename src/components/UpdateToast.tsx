import { useRegisterSW } from "virtual:pwa-register/react";
import { X } from "lucide-react";
import { isNative } from "../platform";
import { useI18n } from "../lib/i18n";
import styles from "./UpdateToast.module.css";

/**
 * Service-worker lifecycle UI. Renders nothing until the SW reports either
 * "offline ready" (first install) or "update available" (a new build is
 * waiting). Not rendered inside a Capacitor shell — see App.tsx.
 */
export function UpdateToast() {
  const { t } = useI18n();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error("SW registration failed", error);
    },
  });

  if (isNative()) return null;
  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.msg}>
        {needRefresh ? t("update.available") : t("update.offlineReady")}
      </span>
      {needRefresh && (
        <button
          type="button"
          className={styles.action}
          onClick={() => void updateServiceWorker(true)}
        >
          {t("update.reload")}
        </button>
      )}
      <button type="button" className={styles.dismiss} onClick={close} aria-label={t("update.dismiss")}>
        <X size={16} />
      </button>
    </div>
  );
}
