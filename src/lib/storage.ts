/**
 * Async key/value storage backed by IndexedDB (via idb-keyval).
 *
 * Same shape as the React Native AsyncStorage API the store used to call, so
 * store.tsx keeps its existing async hydration flow unchanged. IndexedDB has
 * effectively no size ceiling and runs off the main thread, unlike localStorage.
 *
 * `getItem` also does a one-time read-through from localStorage: if a value was
 * ever written there under the same key (e.g. by an earlier web build on this
 * origin) it is migrated into IndexedDB on first read.
 */
import { get, set, del } from "idb-keyval";

export async function getItem(key: string): Promise<string | null> {
  const stored = await get<string>(key);
  if (stored != null) return stored;

  try {
    const legacy = localStorage.getItem(key);
    if (legacy != null) {
      await set(key, legacy);
      return legacy;
    }
  } catch {
    // localStorage may be unavailable (private mode, disabled) — ignore.
  }
  return null;
}

export async function setItem(key: string, value: string): Promise<void> {
  await set(key, value);
}

export async function removeItem(key: string): Promise<void> {
  await del(key);
}

/**
 * Ask the browser to keep our storage bucket from being evicted under pressure.
 * Best-effort: iOS grants this reliably only once the app is installed to the
 * Home Screen. Safe to call on every startup.
 */
export function requestPersistentStorage(): void {
  void navigator.storage?.persist?.().catch(() => {});
}
