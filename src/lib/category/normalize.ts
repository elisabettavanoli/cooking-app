/**
 * Turn a free-text product name ("2x Barilla Spaghetti n.5 500g") into a stable
 * lookup key ("spaghetti") plus its tokens. The same function normalises both
 * the user's query and the lexicon entries at load time, so the build script
 * only has to emit human-readable terms — it never has to match this logic.
 */
import { LOCALE_RULES, detectLang, type LangCode } from "./locales";

export interface Normalized {
  /** Canonical single-string key, e.g. "orange juice". */
  key: string;
  /** Individual meaningful tokens, e.g. ["orange", "juice"]. */
  tokens: string[];
  /** Language used for stopword/plural rules (detected or supplied). */
  lang: LangCode;
}

/** Strip accents/diacritics: "Crème Brûlée" -> "creme brulee". */
export function deburr(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[øØ]/g, "o")
    .replace(/[æÆ]/g, "ae")
    .replace(/[œŒ]/g, "oe")
    .replace(/ł/g, "l");
}

const QUANTITY_RE =
  /\b\d+(?:[.,]\d+)?\s*(?:kg|kgs|gr?|mg|lt?|ml|cl|dl|oz|lbs?|p(?:c|cs|z|zs)|stk|x)?\b|\bn[.°]?\s*\d+\b|[×x]\s*\d+|\d+\s*[×x]/gi;
const PERCENT_RE = /\b\d+(?:[.,]\d+)?\s*%/g;
const SYMBOL_RE = /[^\p{L}\p{N}\s-]/gu;

/**
 * @param name  raw user text
 * @param lang  optional language hint; when omitted it is detected, falling
 *              back to the app locale.
 */
export function normalizeName(name: string, lang?: LangCode): Normalized {
  const lower = deburr(name).toLowerCase();
  const resolvedLang = lang ?? detectLang(lower);
  const rule = LOCALE_RULES[resolvedLang];

  const cleaned = lower
    .replace(PERCENT_RE, " ")
    .replace(QUANTITY_RE, " ")
    .replace(SYMBOL_RE, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stop = new Set(rule.stopwords);
  const noise = new Set(rule.noise);

  const tokens = cleaned
    .split(" ")
    .filter((t) => t.length > 1 && !stop.has(t) && !noise.has(t) && !/^\d+$/.test(t))
    .map((t) => rule.singularize(t));

  return { key: tokens.join(" "), tokens, lang: resolvedLang };
}
