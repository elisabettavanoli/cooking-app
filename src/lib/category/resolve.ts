/**
 * Deterministic, offline category resolution.
 *
 * Resolution order:
 *   1. Curated concept catalog, unless a conflicting exact match exists
 *      in the explicitly selected language
 *   2. Multilingual lexicon exact match
 *   3. Keyword rules
 *   4. Lexicon token vote
 *
 * Ambiguous exact matches are never resolved by an arbitrary fallback.
 */
import type { Category } from "../types";
import { findConceptByNameExact } from "../data";
import { normalizeName } from "./normalize";
import { getAppLang, type LangCode } from "./locales";
import { lookupExact, lookupKeywords, lookupTokens } from "./lexicon";

export type ResolutionSource = "concept" | "lexicon-exact" | "lexicon-token" | "keyword" | "none";

export interface CategoryResolution {
  category: Category | null;
  confidence: number;
  source: ResolutionSource;
  lang: LangCode;
  key: string;
}

export function resolveCategory(name: string, opts: { lang?: LangCode } = {}): CategoryResolution {
  const n = normalizeName(name, opts.lang ?? undefined);
  const base = { lang: n.lang, key: n.key };

  const none = (): CategoryResolution => ({
    ...base,
    category: null,
    confidence: 0,
    source: "none",
  });

  const concept = findConceptByNameExact(name);
  const exact = lookupExact(n);

  // Preserve curated concepts unless a unique exact match in the selected
  // language explicitly disagrees with the concept's category.
  if (concept) {
    if (
      exact?.status === "match" &&
      exact.languageSpecific &&
      exact.hit.category !== concept.category
    ) {
      return {
        ...base,
        category: exact.hit.category,
        confidence: exact.hit.confidence,
        source: "lexicon-exact",
      };
    }

    return {
      ...base,
      category: concept.category,
      confidence: 0.95,
      source: "concept",
    };
  }

  // Without a curated concept, an ambiguous exact match must stop resolution.
  if (exact?.status === "ambiguous") {
    return none();
  }

  if (exact?.status === "match") {
    return {
      ...base,
      category: exact.hit.category,
      confidence: exact.hit.confidence,
      source: "lexicon-exact",
    };
  }

  const keyword = lookupKeywords(n);

  if (keyword) {
    return {
      ...base,
      category: keyword.category,
      confidence: keyword.confidence,
      source: "keyword",
    };
  }

  const tokens = lookupTokens(n);

  if (tokens) {
    return {
      ...base,
      category: tokens.category,
      confidence: tokens.confidence,
      source: "lexicon-token",
    };
  }

  return none();
}

export { getAppLang };
