/**
 * Deterministic multilingual term-to-category dictionary.
 *
 * Exact matches preserve language-specific categories.
 * Cross-language fallback is allowed only when all matching languages agree.
 * Ambiguous matches are never resolved by choosing the first dictionary entry.
 */
import type { Category } from "../types";
import { deburr, normalizeName, type Normalized } from "./normalize";
import { SUPPORTED_LANGS, type LangCode } from "./locales";

import en from "./data/en.json";
import it from "./data/it.json";
import de from "./data/de.json";
import fr from "./data/fr.json";
import es from "./data/es.json";
import keywordData from "./data/keywords.json";

const RAW = { en, it, de, fr, es } as unknown as Record<LangCode, Record<string, Category>>;

const KEYWORDS = keywordData as unknown as Record<string, Record<string, Category>>;

export interface LexiconHit {
  category: Category;
  confidence: number;
  source: "lexicon-exact" | "lexicon-token" | "keyword";
}

interface ExactMatch {
  status: "match";
  hit: LexiconHit;
  languageSpecific: boolean;
}

interface AmbiguousMatch {
  status: "ambiguous";
}

export type ExactLookup = ExactMatch | AmbiguousMatch | null;

interface Lexicon {
  perLang: Map<LangCode, Map<string, Set<Category>>>;
  anyExact: Map<string, Set<Category>>;
  token: Map<string, Set<Category>>;
  tokenByLang: Map<LangCode, Map<string, Set<Category>>>;
  keywords: Array<{ lang: LangCode; kw: string; category: Category }>;
}

let built: Lexicon | null = null;

function addCategory(map: Map<string, Set<Category>>, key: string, category: Category): void {
  const categories = map.get(key) ?? new Set<Category>();
  categories.add(category);
  map.set(key, categories);
}

function build(): Lexicon {
  if (built) return built;

  const perLang = new Map<LangCode, Map<string, Set<Category>>>();
  const anyExact = new Map<string, Set<Category>>();
  const token = new Map<string, Set<Category>>();
  const tokenByLang = new Map<LangCode, Map<string, Set<Category>>>();

  for (const lang of SUPPORTED_LANGS) {
    const map = new Map<string, Set<Category>>();
    const langTokens = new Map<string, Set<Category>>();

    for (const [term, category] of Object.entries(RAW[lang] ?? {})) {
      const { key, tokens } = normalizeName(term, lang);
      if (!key) continue;

      addCategory(map, key, category);
      addCategory(anyExact, key, category);

      if (tokens.length === 1) {
        addCategory(token, key, category);
        addCategory(langTokens, key, category);
      }
    }

    perLang.set(lang, map);
    tokenByLang.set(lang, langTokens);
  }

  const keywords: Lexicon["keywords"] = [];

  for (const [lang, entries] of Object.entries(KEYWORDS)) {
    if (!SUPPORTED_LANGS.includes(lang as LangCode)) continue;

    for (const [kw, category] of Object.entries(entries)) {
      keywords.push({
        lang: lang as LangCode,
        kw: deburr(kw).toLowerCase(),
        category,
      });
    }
  }

  built = { perLang, anyExact, token, tokenByLang, keywords };
  return built;
}

/** Test hook — forces the lexicon to rebuild. */
export function __rebuildLexicon(): void {
  built = null;
}

/**
 * Exact match strategy:
 * 1. Trust a unique match in the selected language.
 * 2. Otherwise allow cross-language fallback only if all languages agree.
 * 3. Report ambiguity instead of silently choosing a category.
 */
export function lookupExact(n: Normalized): ExactLookup {
  if (!n.key) return null;

  const lex = build();
  const own = lex.perLang.get(n.lang);
  const ownCategories = own?.get(n.key);

  if (ownCategories) {
    if (ownCategories.size !== 1) {
      return { status: "ambiguous" };
    }

    const [category] = ownCategories;

    return {
      status: "match",
      languageSpecific: true,
      hit: {
        category,
        confidence: 0.9,
        source: "lexicon-exact",
      },
    };
  }

  const allCategories = lex.anyExact.get(n.key);

  if (!allCategories) return null;
  if (allCategories.size !== 1) return { status: "ambiguous" };

  const [category] = allCategories;

  return {
    status: "match",
    languageSpecific: false,
    hit: {
      category,
      confidence: 0.82,
      source: "lexicon-exact",
    },
  };
}

interface TokenVote {
  category: Category | null;
  recognized: boolean;
}

function voteFrom(tokens: string[], map: Map<string, Set<Category>>): TokenVote {
  const votes = new Map<Category, number>();
  let recognized = false;

  for (const token of tokens) {
    const categories = map.get(token);
    if (!categories) continue;

    recognized = true;

    // An ambiguous token cannot contribute a category vote.
    if (categories.size !== 1) continue;

    const [category] = categories;
    votes.set(category, (votes.get(category) ?? 0) + 1);
  }

  if (votes.size === 0) {
    return { category: null, recognized };
  }

  const ranked = [...votes].sort((a, b) => b[1] - a[1]);

  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) {
    return { category: null, recognized: true };
  }

  return { category: ranked[0][0], recognized: true };
}

export function lookupTokens(n: Normalized): LexiconHit | null {
  if (n.tokens.length < 2) return null;

  const lex = build();
  const own = lex.tokenByLang.get(n.lang);

  if (own) {
    const localVote = voteFrom(n.tokens, own);

    // Do not override a local ambiguity with a global vote.
    if (localVote.recognized) {
      return localVote.category
        ? {
            category: localVote.category,
            confidence: 0.6,
            source: "lexicon-token",
          }
        : null;
    }
  }

  const globalVote = voteFrom(n.tokens, lex.token);

  return globalVote.category
    ? {
        category: globalVote.category,
        confidence: 0.6,
        source: "lexicon-token",
      }
    : null;
}

export function lookupKeywords(n: Normalized): LexiconHit | null {
  const lex = build();
  const haystack = n.key;

  if (!haystack) return null;

  const tokenSet = new Set(n.tokens);
  const ordered = [...lex.keywords].sort(
    (a, b) => Number(b.lang === n.lang) - Number(a.lang === n.lang),
  );

  for (const rule of ordered) {
    if (tokenSet.has(rule.kw) || haystack.includes(rule.kw)) {
      return {
        category: rule.category,
        confidence: rule.lang === n.lang ? 0.5 : 0.45,
        source: "keyword",
      };
    }
  }

  return null;
}
