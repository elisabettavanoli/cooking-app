/**
 * Deterministic, offline product → category mapping.
 * See ./README.md.
 */
export { resolveCategory, getAppLang } from "./resolve";
export type { CategoryResolution, ResolutionSource } from "./resolve";

export { normalizeName, deburr } from "./normalize";
export type { Normalized } from "./normalize";

export { SUPPORTED_LANGS, DEFAULT_LANG, isSupportedLang } from "./locales";
export type { LangCode } from "./locales";
