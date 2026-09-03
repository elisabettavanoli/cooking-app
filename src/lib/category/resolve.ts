/**
 * Deterministic, offline category resolution. Order, cheapest first:
 *
 *   1. concept catalog   (src/lib/data.ts — curated, has an icon)
 *   2. learned cache      (previous AI answers, peeked synchronously)
 *   3. lexicon exact      (data/<lang>.json, normalized term match)
 *   4. lexicon token vote (multi-word names, e.g. "organic basmati rice")
 *   5. keyword rules      (stems like "surgelat", "juice", "tiefkuhl")
 *
 * Returns `category: null` when nothing matched — that is the caller's signal to
 * fall back to an AI call (see `categorizeIngredientAsync` in ../ai.ts).
 */
import type { Category } from "../types";
import { findConceptByName, findConceptByNameExact } from "../data";
import { normalizeName } from "./normalize";
import { getAppLang, type LangCode } from "./locales";
import { lookupExact, lookupKeywords, lookupTokens } from "./lexicon";
import { cacheKey, peekCachedCategory } from "./cache";

export type ResolutionSource =
  | "concept"
  | "cache"
  | "lexicon-exact"
  | "lexicon-token"
  | "keyword"
  | "none";

export interface CategoryResolution {
  /** Resolved category, or null if every deterministic step missed. */
  category: Category | null;
  confidence: number;
  source: ResolutionSource;
  /** Language whose rules were applied (detected or supplied). */
  lang: LangCode;
  /** Normalized lookup key — reuse it to cache an AI answer under the same key. */
  key: string;
}

export function resolveCategory(
  name: string,
  opts: { lang?: LangCode } = {},
): CategoryResolution {
  const n = normalizeName(name, opts.lang ?? undefined);
  const base = { lang: n.lang, key: n.key };

  const hit = (c: { category: Category } | undefined) =>
    c ? { ...base, category: c.category, confidence: 0.95, source: "concept" as const } : null;

  // 1. Concept catalog, EXACT name/alias only — safe in any language.
  const exactConcept = hit(findConceptByNameExact(name));
  if (exactConcept) return exactConcept;

  // 2. Learned cache.
  if (n.key) {
    const cached = peekCachedCategory(cacheKey(n.lang, n.key));
    if (cached) return { ...base, category: cached, confidence: 0.9, source: "cache" };
  }

  // 3. Lexicon exact.
  const exact = lookupExact(n);
  if (exact) {
    return { ...base, category: exact.category, confidence: exact.confidence, source: "lexicon-exact" };
  }

  // 4. Keyword stems — run before the token vote so a category-bearing stem
  //    ("succo", "cookie", "olio") beats a stray fruit/veg noun in the phrase.
  const keyword = lookupKeywords(n);
  if (keyword) {
    return { ...base, category: keyword.category, confidence: keyword.confidence, source: "keyword" };
  }

  // 5. Lexicon token vote.
  const tokens = lookupTokens(n);
  if (tokens) {
    return { ...base, category: tokens.category, confidence: tokens.confidence, source: "lexicon-token" };
  }

  // 6. Concept catalog, FUZZY substring — English only (it false-positives
  //    across languages, e.g. "jus d'orange" → the orange concept).
  if (n.lang === "en") {
    const fuzzy = hit(findConceptByName(name));
    if (fuzzy) return fuzzy;
  }

  return { ...base, category: null, confidence: 0, source: "none" };
}

export { getAppLang };
