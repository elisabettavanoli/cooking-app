/**
 * The deterministic term → category dictionary. Data lives in `data/<lang>.json`
 * as plain `{ "human readable term": "category" }` maps; this module normalises
 * every key with `normalizeName()` at load so the JSON never has to match the
 * runtime normalisation exactly (the build script just emits readable terms).
 *
 * Regenerate / extend the data with `npm run build:lexicon` — see
 * `scripts/build-category-lexicon.mjs` and `src/lib/category/README.md`.
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

interface Lexicon {
  perLang: Map<LangCode, Map<string, Category>>;
  anyExact: Map<string, Category>;
  /** single-token key → the set of categories that token maps to across langs */
  token: Map<string, Set<Category>>;
  /** same, split per language — consulted first so a cross-language homograph
   *  (English "passata" = pantry vs Italian "pomodoro" = vegetables) does not tie */
  tokenByLang: Map<LangCode, Map<string, Set<Category>>>;
  keywords: Array<{ lang: LangCode; kw: string; category: Category }>;
}

let built: Lexicon | null = null;

function build(): Lexicon {
  if (built) return built;

  const perLang = new Map<LangCode, Map<string, Category>>();
  const anyExact = new Map<string, Category>();
  const token = new Map<string, Set<Category>>();
  const tokenByLang = new Map<LangCode, Map<string, Set<Category>>>();

  for (const lang of SUPPORTED_LANGS) {
    const map = new Map<string, Category>();
    const langTokens = new Map<string, Set<Category>>();
    for (const [term, category] of Object.entries(RAW[lang] ?? {})) {
      const { key, tokens } = normalizeName(term, lang);
      if (!key) continue;
      map.set(key, category);
      if (!anyExact.has(key)) anyExact.set(key, category);
      if (tokens.length === 1) {
        (token.get(key) ?? token.set(key, new Set()).get(key))!.add(category);
        (langTokens.get(key) ?? langTokens.set(key, new Set()).get(key))!.add(category);
      }
    }
    perLang.set(lang, map);
    tokenByLang.set(lang, langTokens);
  }

  const keywords: Lexicon["keywords"] = [];
  for (const [lang, entries] of Object.entries(KEYWORDS)) {
    if (!SUPPORTED_LANGS.includes(lang as LangCode)) continue;
    for (const [kw, category] of Object.entries(entries)) {
      keywords.push({ lang: lang as LangCode, kw: deburr(kw).toLowerCase(), category });
    }
  }

  built = { perLang, anyExact, token, tokenByLang, keywords };
  return built;
}

/** Test hook — forces the lexicon to rebuild (e.g. after mocking data). */
export function __rebuildLexicon(): void {
  built = null;
}

export function lookupExact(n: Normalized): LexiconHit | null {
  if (!n.key) return null;
  const lex = build();
  const own = lex.perLang.get(n.lang)?.get(n.key);
  if (own) return { category: own, confidence: 0.9, source: "lexicon-exact" };
  const any = lex.anyExact.get(n.key);
  if (any) return { category: any, confidence: 0.82, source: "lexicon-exact" };
  return null;
}

function voteFrom(
  tokens: string[],
  map: Map<string, Set<Category>>,
): Category | null {
  const votes = new Map<Category, number>();
  for (const t of tokens) {
    const cats = map.get(t);
    if (!cats || cats.size !== 1) continue;
    const [cat] = cats;
    votes.set(cat, (votes.get(cat) ?? 0) + 1);
  }
  if (votes.size === 0) return null;
  const ranked = [...votes].sort((a, b) => b[1] - a[1]);
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return null; // ambiguous
  return ranked[0][0];
}

export function lookupTokens(n: Normalized): LexiconHit | null {
  if (n.tokens.length < 2) return null; // single tokens are covered by lookupExact
  const lex = build();
  const own = lex.tokenByLang.get(n.lang);
  const cat = (own && voteFrom(n.tokens, own)) || voteFrom(n.tokens, lex.token);
  return cat ? { category: cat, confidence: 0.6, source: "lexicon-token" } : null;
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
