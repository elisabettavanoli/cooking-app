/**
 * Deterministic, offline category resolution.
 *
 * Resolution order:
 *   1. Concept catalog — exact name/alias match
 *   2. Multilingual lexicon — exact normalized term match
 *   3. Keyword rules — category-bearing stems and keywords
 *   4. Lexicon token vote — category inference from recognized tokens
 *   5. Concept catalog — fuzzy substring match (English only)
 *
 * Returns `category: null` when no deterministic rule matches.
 */
import type { Category } from "../types";
import { findConceptByName, findConceptByNameExact } from "../data";
import { normalizeName } from "./normalize";
import { getAppLang, type LangCode } from "./locales";
import { lookupExact, lookupKeywords, lookupTokens } from "./lexicon";

export type ResolutionSource = "concept" | "lexicon-exact" | "lexicon-token" | "keyword" | "none";

export interface CategoryResolution {
  /** Resolved category, or null if every deterministic step missed. */
  category: Category | null;
  confidence: number;
  source: ResolutionSource;
  /** Language whose rules were applied (detected or supplied). */
  lang: LangCode;
  /** Normalized lookup key. */
  key: string;
}

export function resolveCategory(name: string, opts: { lang?: LangCode } = {}): CategoryResolution {
  const n = normalizeName(name, opts.lang ?? undefined);
  const base = { lang: n.lang, key: n.key };

  const hit = (c: { category: Category } | undefined) =>
    c
      ? {
          ...base,
          category: c.category,
          confidence: 0.95,
          source: "concept" as const,
        }
      : null;

  // 1. Concept catalog: exact name or alias match.
  const exactConcept = hit(findConceptByNameExact(name));
  if (exactConcept) return exactConcept;

  // 2. Exact match in the multilingual lexicon.
  const exact = lookupExact(n);
  if (exact) {
    return {
      ...base,
      category: exact.category,
      confidence: exact.confidence,
      source: "lexicon-exact",
    };
  }

  // 3. Keyword rules run before token voting so a category-bearing keyword
  // takes precedence over an incidental ingredient name.
  const keyword = lookupKeywords(n);
  if (keyword) {
    return {
      ...base,
      category: keyword.category,
      confidence: keyword.confidence,
      source: "keyword",
    };
  }

  // 4. Infer a category from recognized tokens.
  const tokens = lookupTokens(n);
  if (tokens) {
    return {
      ...base,
      category: tokens.category,
      confidence: tokens.confidence,
      source: "lexicon-token",
    };
  }

  // 5. Fuzzy concept matching is restricted to English to reduce
  // false positives across languages.
  if (n.lang === "en") {
    const fuzzy = hit(findConceptByName(name));
    if (fuzzy) return fuzzy;
  }

  return { ...base, category: null, confidence: 0, source: "none" };
}

export { getAppLang };
