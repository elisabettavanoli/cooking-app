/**
 * Learned term → category map. Every time the AI fallback answers, we persist
 * the result here so the same product never costs a second API call. Stored in
 * IndexedDB via the shared storage layer, keyed `"<lang>:<normalized term>"`.
 */
import type { Category } from "../types";
import { getItem, setItem } from "../storage";
import type { LangCode } from "./locales";

const STORAGE_KEY = "cooking-category-cache-v1";

type CacheShape = Record<string, Category>;

let mem: CacheShape | null = null;
let loading: Promise<CacheShape> | null = null;

export function cacheKey(lang: LangCode, normalizedKey: string): string {
  return `${lang}:${normalizedKey}`;
}

function safeParse(raw: string): CacheShape | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as CacheShape) : null;
  } catch {
    return null;
  }
}

function load(): Promise<CacheShape> {
  if (mem) return Promise.resolve(mem);
  if (!loading) {
    loading = getItem(STORAGE_KEY)
      .then((raw) => {
        mem = (raw && safeParse(raw)) || {};
        return mem;
      })
      .catch(() => {
        mem = {};
        return mem;
      });
  }
  return loading;
}

/** Load the cache into memory so `peekCachedCategory` works. Call once at startup. */
export async function primeCache(): Promise<void> {
  await load();
}

/** Synchronous read — only returns a hit once `primeCache()` has resolved. */
export function peekCachedCategory(key: string): Category | undefined {
  return mem?.[key];
}

export async function getCachedCategory(key: string): Promise<Category | undefined> {
  return (await load())[key];
}

export async function rememberCategory(key: string, category: Category): Promise<void> {
  const cache = await load();
  if (cache[key] === category) return;
  cache[key] = category;
  await setItem(STORAGE_KEY, JSON.stringify(cache));
}

/** Test hook. */
export function __resetCache(): void {
  mem = null;
  loading = null;
}
