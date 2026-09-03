/**
 * Deterministic product → category mapping with a learned cache. Use this before
 * spending an AI call. See ./README.md.
 */
export { resolveCategory, getAppLang } from "./resolve";
export type { CategoryResolution, ResolutionSource } from "./resolve";
export { normalizeName, deburr } from "./normalize";
export type { Normalized } from "./normalize";
export {
  primeCache,
  peekCachedCategory,
  getCachedCategory,
  rememberCategory,
  cacheKey,
} from "./cache";
export { SUPPORTED_LANGS, DEFAULT_LANG, isSupportedLang } from "./locales";
export type { LangCode } from "./locales";
