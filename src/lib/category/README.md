# Product → category resolution

Deterministic, offline-first mapping from a free-text product name to one of the
12 `Category` values (`src/lib/types.ts`), so an AI/API call is only needed for
genuinely unknown items. Multilingual by design.

## Pipeline (cheapest first)

| Step | Source | Confidence | Notes |
|---|---|---|---|
| 1. concept catalog — **exact** name/alias | `src/lib/data.ts` | 0.95 | curated, also yields an icon; safe in any language |
| 2. learned cache | IndexedDB `cooking-category-cache-v1` | 0.90 | past AI answers, peeked sync |
| 3. lexicon exact | `data/<lang>.json` | 0.82–0.90 | normalized term match |
| 4. keyword stems | `data/keywords.json` | 0.45–0.50 | `cookie`, `succo`, `olio`, `pesce`, … — before the token vote |
| 5. lexicon token vote | `data/<lang>.json` | 0.60 | multi-word names, own-language votes first |
| 6. concept catalog — **fuzzy** substring | `src/lib/data.ts` | 0.95 | English only; catches "roma tomatoes", loanwords |
| 7. AI fallback | `aiCategorize()` in `../ai.ts` | from API | **only** if 1–6 miss; result cached |

`resolveCategory(name, { lang? })` runs the synchronous steps and returns
`{ category, confidence, source, lang, key }` (or `category: null`).
`categorizeIngredientAsync()` in `../ai.ts` adds the cache and AI steps.

Two things learned the hard way:
- The concept catalog matches by loose substring (`"chocolate chip cookies"` →
  the `chocolate` concept, `"jus d'orange"` → `orange`). So only its **exact**
  match is trusted early; the fuzzy pass is last and English-only.
- **`frozen` is not a category.** A frozen product resolves to its underlying
  food type (frozen peas → `vegetables`, fish fingers → `meat-fish`, ice cream →
  `breakfast-snacks`). There are no `frozen` keyword stems.

## Normalisation

`normalizeName()` lowercases, strips accents, quantities/units, packaging words
and per-language stopwords, then applies light singularisation. It normalises
**both** the query and the lexicon keys at load, so `data/*.json` just holds
readable terms like `"succo d'arancia"`.

Language is taken from `opts.lang`, else a short-text heuristic, else
`getAppLang()` — the language the user picked in the app (persisted under
`LANG_STORAGE_KEY` by `src/lib/i18n.tsx`), falling back to `navigator.language`.
Lookup falls back across every language's lexicon anyway, so a wrong guess mostly
just affects stopword stripping.

## Editing the data

- **By hand:** edit `data/<lang>.json` (`"term": "category"`). Values must be a
  valid `Category`. Hand entries always win over generated ones.
- **From datasets:** `npm run build:lexicon` — see `scripts/sources/README.md`.
  `en.json` carries a ~1650-term slice derived from the Instacart grocery dataset
  (aisle → category, all 134 aisles mapped in the build script) on top of the
  hand seed. it/de/fr/es stay hand-curated — the Open Food Facts flat export was
  too noisy for the fruit/vegetables split and its broad
  `plant-based-foods-and-beverages` tag mislabels ~1/3 of rows.

## Adding a category

Touches, in order: `Category` in `src/lib/types.ts`; `categoryMeta` (label +
color) and the `concepts` in `src/lib/data.ts`; every `data/<lang>.json` and
`data/keywords.json`; the icon fallbacks in `src/components/FoodIcon.tsx`; the
`CATEGORIES` set and Instacart/OFF maps in `scripts/build-category-lexicon.mjs`;
the tests. If a Supabase schema pins the category list, migrate it too.

## Adding a language

1. Extend `LangCode` + `LOCALE_RULES` in `locales.ts`.
2. Add `data/<lang>.json` and import it in `lexicon.ts` (`RAW`).
3. Add a `data/keywords.json` section.
4. Update `SUPPORTED_LANGS` is automatic (derived from `LOCALE_RULES`).

## Wiring the real AI call

Replace the body of `aiCategorize()` in `../ai.ts` with a call to a classifier
constrained to the `Category` union (a Supabase edge function is the natural home
given `src/lib/supabase.ts`). Keep the signature; the caching and fallback logic
around it stays as-is. Every answer is written to the learned cache, so a given
product costs at most one call ever.

Once a backend exists, consider also persisting the learned cache server-side
(per household) instead of only in local IndexedDB, so the deterministic hit rate
is shared across devices and users.
