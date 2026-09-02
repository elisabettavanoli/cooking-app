/**
 * Runtime environment helpers.
 *
 * `isNative()` is true when the app runs inside a Capacitor WebView shell
 * (added in a later phase). It's written to work without the @capacitor/core
 * dependency installed — it only reads the global Capacitor injects.
 */
export function isNative(): boolean {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  return typeof cap?.isNativePlatform === "function" ? cap.isNativePlatform() : false;
}

/** True when the page is running as an installed / standalone PWA. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.("(display-mode: standalone)").matches === true;
}
