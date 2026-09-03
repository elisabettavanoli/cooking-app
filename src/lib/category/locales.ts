/**
 * Per-language rules for normalising free-text product names before we look
 * them up in the lexicon. Adding a language is: add an entry here + a
 * `data/<lang>.json` file + (optionally) a `data/keywords.json` section.
 *
 * Keep every list lowercase and without diacritics — `deburr()` in
 * `normalize.ts` strips accents before these are applied.
 */

export type LangCode = "en" | "it" | "de" | "fr" | "es";

export interface LocaleRule {
  /**
   * Very language-specific words used only for best-effort language detection
   * of a short product name. Never put a word here that also occurs in another
   * supported language.
   */
  detectHints: string[];
  /** Articles / prepositions / filler removed entirely from the term. */
  stopwords: string[];
  /** Unit and packaging words removed from the term (quantities are stripped generically). */
  noise: string[];
  /** Light, conservative singularisation. Return the input unchanged if unsure. */
  singularize: (word: string) => string;
}

const SHARED_NOISE = [
  // metric / imperial units and pack words that show up in typed names
  "kg", "kgs", "g", "gr", "grs", "mg", "l", "lt", "ml", "cl", "dl",
  "oz", "lb", "lbs", "pc", "pcs", "pack", "packs", "pkg", "ct", "count",
  "x", "approx", "ca", "circa", "about",
];

/**
 * Conservative plural → singular. Correctness matters less than *consistency*
 * (query and lexicon key run through the same function), but a rule that maps a
 * singular noun onto an unrelated word is harmful — e.g. Italian `-e → -a` turns
 * "pesce" (fish) into "pesca" (peach). So romance languages only trim a trailing
 * plural "-s"/"-es"/"-x", and German/Italian are left untouched (both forms are
 * listed in the lexicon instead).
 */
const identity = (w: string): string => w;

function trimRomancePlural(word: string): string {
  if (word.length > 5 && word.endsWith("es") && !word.endsWith("ses")) {
    return word.slice(0, -2);
  }
  if (word.length > 4 && /[^s]s$/.test(word)) return word.slice(0, -1);
  if (word.length > 4 && word.endsWith("x")) return word.slice(0, -1);
  return word;
}

export const LOCALE_RULES: Record<LangCode, LocaleRule> = {
  en: {
    detectHints: ["the", "with", "fresh", "frozen", "sliced", "whole"],
    stopwords: ["the", "a", "an", "of", "with", "and", "in", "for"],
    noise: [...SHARED_NOISE, "bottle", "can", "jar", "tin", "box", "bag", "tub", "carton", "punnet"],
    singularize: (w) => {
      if (w.length <= 3) return w;
      if (w.endsWith("ies")) return `${w.slice(0, -3)}y`;
      if (/(?:ches|shes|sses|xes|oes)$/.test(w)) return w.slice(0, -2);
      if (w.endsWith("s") && !/(?:ss|us|is)$/.test(w)) return w.slice(0, -1);
      return w;
    },
  },
  it: {
    detectHints: ["di", "con", "della", "allo", "alla", "confezione", "fresco", "surgelati"],
    stopwords: ["il", "lo", "la", "i", "gli", "le", "di", "del", "della", "dello", "con", "e", "al", "alla", "allo", "in", "per", "da"],
    noise: [...SHARED_NOISE, "bottiglia", "lattina", "barattolo", "vasetto", "confezione", "conf", "busta", "sacchetto", "scatola", "cartone"],
    singularize: identity,
  },
  de: {
    detectHints: ["mit", "und", "frische", "geschnitten", "tiefkuhl", "der", "die", "das"],
    stopwords: ["der", "die", "das", "mit", "und", "im", "in", "fur", "aus", "von"],
    noise: [...SHARED_NOISE, "flasche", "dose", "glas", "packung", "beutel", "schachtel", "karton", "stuck", "stk"],
    singularize: identity,
  },
  fr: {
    detectHints: ["avec", "frais", "surgele", "tranche", "entier", "le", "la", "les", "du"],
    stopwords: ["le", "la", "les", "un", "une", "de", "des", "du", "au", "aux", "avec", "et", "en", "pour", "a"],
    noise: [...SHARED_NOISE, "bouteille", "boite", "bocal", "pot", "sachet", "paquet", "carton", "brique"],
    singularize: trimRomancePlural,
  },
  es: {
    detectHints: ["con", "fresco", "congelado", "rebanado", "entero", "el", "la", "los", "las"],
    stopwords: ["el", "la", "los", "las", "un", "una", "de", "del", "con", "y", "en", "para", "al"],
    noise: [...SHARED_NOISE, "botella", "lata", "bote", "tarro", "bolsa", "paquete", "caja", "brik"],
    singularize: trimRomancePlural,
  },
};

export const SUPPORTED_LANGS = Object.keys(LOCALE_RULES) as LangCode[];
export const DEFAULT_LANG: LangCode = "en";

/** localStorage key the i18n layer (src/lib/i18n.tsx) writes the chosen UI language to. */
export const LANG_STORAGE_KEY = "cooking-lang";

export function isSupportedLang(code: string): code is LangCode {
  return (SUPPORTED_LANGS as string[]).includes(code);
}

/**
 * The active language: the one the user picked in the app (persisted by the
 * i18n layer), falling back to the browser locale, then English.
 */
export function getAppLang(): LangCode {
  try {
    const picked = typeof localStorage !== "undefined" ? localStorage.getItem(LANG_STORAGE_KEY) : null;
    if (picked && isSupportedLang(picked)) return picked;
  } catch {
    // localStorage unavailable — fall through to the browser locale
  }
  const nav = typeof navigator !== "undefined" ? navigator.language : "";
  const base = (nav || "").slice(0, 2).toLowerCase();
  return isSupportedLang(base) ? base : DEFAULT_LANG;
}

/**
 * Best-effort language guess for a single short product name. Detection on 1–3
 * words is unreliable, so this only affects which stopword list is used; lookup
 * always falls back to every language's lexicon anyway.
 */
export function detectLang(deburredLower: string, fallback: LangCode = getAppLang()): LangCode {
  const padded = ` ${deburredLower} `;
  for (const lang of SUPPORTED_LANGS) {
    if (LOCALE_RULES[lang].detectHints.some((h) => padded.includes(` ${h} `))) {
      return lang;
    }
  }
  return fallback;
}
