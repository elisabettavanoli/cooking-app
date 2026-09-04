/**
 * Build / extend the deterministic term → category lexicon in
 * src/lib/category/data/<lang>.json from public grocery datasets.
 *
 * The runtime re-normalises every key (see src/lib/category/normalize.ts), so
 * this script only needs to emit readable lowercase terms.
 *
 * Usage:
 *   node scripts/build-category-lexicon.mjs \
 *     --instacart scripts/sources/instacart \
 *     --openfoodfacts scripts/sources/openfoodfacts.csv \
 *     --min-count 3 --max-per-lang 4000
 *
 * Both sources are optional. Hand-curated entries already in the JSON files are
 * always kept and win over dataset-derived ones. See scripts/sources/README.md.
 */
import { readFileSync, writeFileSync, existsSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../", import.meta.url)));
const DATA_DIR = join(ROOT, "src/lib/category/data");

const CATEGORIES = new Set([
  "fruit",
  "vegetables",
  "dairy",
  "meat-fish",
  "pantry",
  "sauces-condiments",
  "spices-herbs",
  "baking",
  "drinks",
  "breakfast-snacks",
  "snacks",
  "other",
]);

// ---------------------------------------------------------------------------
// Mapping tables — edit these to tune coverage.
// ---------------------------------------------------------------------------

/**
 * Instacart `departments.csv` name → Category (null = too broad, rely on aisle).
 * `produce`, `frozen` and `snacks` are deliberately null: they straddle several
 * v2 categories, so only their aisles carry usable signal.
 */
const INSTACART_DEPARTMENT_MAP = {
  "dairy eggs": "dairy",
  "meat seafood": "meat-fish",
  "dry goods pasta": "pantry",
  "canned goods": "pantry",
  bakery: "pantry",
  beverages: "drinks",
  alcohol: "drinks",
  "pantry": "pantry",
  breakfast: "breakfast-snacks",
  deli: "meat-fish",
  // null here just means "no reliable department-wide guess" — every real
  // aisle in these three departments has its own entry above, so this is a
  // safety net for an aisle that isn't; it resolves to "other" via the
  // fallback below, same as the rest.
  produce: null,
  frozen: null,
  snacks: null,
  // Non-food departments (cosmetics, cleaning, pet, baby, paper goods, …) map
  // to "other" via the fallback below — every product row is kept and
  // categorised, none silently dropped.
  household: null,
  "personal care": null,
  pets: null,
  babies: null,
  international: null,
  bulk: null,
  other: null,
  missing: null,
};

/**
 * Instacart `aisles.csv` name → Category. Applied before the department map.
 * Covers all 134 aisles; null = ambiguous at the aisle level, fall through to
 * the department map, then to "other" — see ingestInstacart(). Nothing is
 * dropped.
 */
const INSTACART_AISLE_MAP = {
  // fruit / vegetables
  "fresh fruits": "fruit",
  "fresh vegetables": "vegetables",
  "packaged vegetables fruits": "vegetables",
  "packaged produce": "vegetables",
  "frozen produce": "vegetables",
  "fresh herbs": "spices-herbs",
  // meat & fish
  "packaged meat": "meat-fish",
  "packaged seafood": "meat-fish",
  "packaged poultry": "meat-fish",
  "poultry counter": "meat-fish",
  "seafood counter": "meat-fish",
  "meat counter": "meat-fish",
  "hot dogs bacon sausage": "meat-fish",
  "lunch meat": "meat-fish",
  "canned meat seafood": "meat-fish",
  "frozen meat seafood": "meat-fish",
  "tofu meat alternatives": "meat-fish",
  // "frozen vegan vegetarian" is frozen ready-meals (veggie burgers, tacos,
  // burritos, pizza) more than meat substitutes — pantry, like the app's other
  // frozen-meal aisles, not meat-fish.
  "frozen vegan vegetarian": "pantry",
  // dairy
  milk: "dairy",
  yogurt: "dairy",
  cream: "dairy",
  butter: "dairy",
  eggs: "dairy",
  "packaged cheese": "dairy",
  "specialty cheeses": "dairy",
  "other creams cheeses": "dairy",
  "soy lactosefree": "dairy",
  // drinks
  coffee: "drinks",
  tea: "drinks",
  "juice nectars": "drinks",
  "frozen juice": "drinks",
  "soft drinks": "drinks",
  "water seltzer sparkling water": "drinks",
  "energy sports drinks": "drinks",
  "cocoa drink mixes": "drinks",
  "beers coolers": "drinks",
  "red wines": "drinks",
  "white wines": "drinks",
  "specialty wines champagnes": "drinks",
  spirits: "drinks",
  // spices & baking
  "spices seasonings": "spices-herbs",
  "baking ingredients": "baking",
  "baking supplies decor": "baking",
  "doughs gelatins bake mixes": "baking",
  // sauces & condiments
  "oils vinegars": "sauces-condiments",
  condiments: "sauces-condiments",
  "salad dressing toppings": "sauces-condiments",
  "marinades meat preparation": "sauces-condiments",
  "honeys syrups nectars": "sauces-condiments",
  "preserved dips spreads": "sauces-condiments",
  "fresh dips tapenades": "sauces-condiments",
  spreads: "sauces-condiments",
  "pasta sauce": "sauces-condiments",
  // breakfast & treats
  "ice cream ice": "breakfast-snacks",
  "frozen dessert": "breakfast-snacks",
  "ice cream toppings": "breakfast-snacks",
  "candy chocolate": "breakfast-snacks",
  "cookies cakes": "breakfast-snacks",
  cereal: "breakfast-snacks",
  "hot cereal pancake mixes": "breakfast-snacks",
  "breakfast bars pastries": "breakfast-snacks",
  "energy granola bars": "breakfast-snacks",
  granola: "breakfast-snacks",
  "breakfast bakery": "breakfast-snacks",
  "frozen breakfast": "breakfast-snacks",
  "bakery desserts": "breakfast-snacks",
  "refrigerated pudding desserts": "breakfast-snacks",
  // savoury snacks
  "chips pretzels": "snacks",
  crackers: "snacks",
  "popcorn jerky": "snacks",
  "trail mix snack mix": "snacks",
  "fruit vegetable snacks": "snacks",
  // pantry
  "instant foods": "pantry",
  "fresh pasta": "pantry",
  "dry pasta": "pantry",
  "prepared meals": "pantry",
  "prepared soups salads": "pantry",
  "canned meals beans": "pantry",
  "canned jarred vegetables": "pantry",
  "canned fruit applesauce": "pantry",
  "grains rice dried goods": "pantry",
  "bulk grains rice dried goods": "pantry",
  "soup broth bouillon": "pantry",
  "asian foods": "pantry",
  "indian foods": "pantry",
  "latino foods": "pantry",
  "kosher foods": "pantry",
  "buns rolls": "pantry",
  bread: "pantry",
  "tortillas flat bread": "pantry",
  "frozen breads doughs": "pantry",
  "frozen appetizers sides": "pantry",
  "frozen meals": "pantry",
  "frozen pizza": "pantry",
  "nuts seeds dried fruit": "pantry",
  "bulk dried fruits vegetables": "pantry",
  "pickled goods olives": "pantry",
  // Sampled the real product names before deciding these — see the aisle
  // names/samples in scripts/sources/README.md.
  "mint gum": "breakfast-snacks", // gum/mints — candy, like "candy chocolate"
  refrigerated: "drinks", // sampled: almost entirely juices/kombucha/lemonade
  // Genuinely mixed or not food in the cooking sense — "other" (below) via the
  // fallback, not dropped: vitamins/supplements, protein shakes vs. bars with
  // no clear majority.
  "protein meal replacements": null,
  "vitamins supplements": null,
};

/**
 * Open Food Facts `categories_tags` → Category. First rule whose `test`
 * substring appears in any tag wins; order matters (specific before generic).
 * The flat OFF export is noisy for the fresh fruit/veg split — it is currently
 * not used to build the shipped data; see scripts/sources/README.md.
 */
const OFF_TAG_RULES = [
  { test: "ice-cream", category: "breakfast-snacks" },
  { test: "frozen-desserts", category: "breakfast-snacks" },
  { test: "biscuits-and-cakes", category: "breakfast-snacks" },
  { test: "breakfast-cereals", category: "breakfast-snacks" },
  { test: "chocolate-candies", category: "breakfast-snacks" },
  { test: "candies", category: "breakfast-snacks" },
  { test: "chips-and-fries", category: "snacks" },
  { test: "crackers", category: "snacks" },
  { test: "salty-snacks", category: "snacks" },
  { test: "spices", category: "spices-herbs" },
  { test: "condiments", category: "sauces-condiments" },
  { test: "sauces", category: "sauces-condiments" },
  { test: "vinegars", category: "sauces-condiments" },
  { test: "olive-oils", category: "sauces-condiments" },
  { test: "vegetable-oils", category: "sauces-condiments" },
  { test: "honeys", category: "sauces-condiments" },
  { test: "jams", category: "sauces-condiments" },
  { test: "flours", category: "baking" },
  { test: "baking", category: "baking" },
  { test: "sugars", category: "baking" },
  { test: "cheeses", category: "dairy" },
  { test: "yogurts", category: "dairy" },
  { test: "milks", category: "dairy" },
  { test: "dairies", category: "dairy" },
  { test: "eggs", category: "dairy" },
  { test: "meats", category: "meat-fish" },
  { test: "poultry", category: "meat-fish" },
  { test: "seafood", category: "meat-fish" },
  { test: "fishes", category: "meat-fish" },
  { test: "charcuterie", category: "meat-fish" },
  { test: "fresh-vegetables", category: "vegetables" },
  { test: "fresh-fruits", category: "fruit" },
  { test: "vegetables", category: "vegetables" },
  { test: "fruits", category: "fruit" },
  { test: "waters", category: "drinks" },
  { test: "juices", category: "drinks" },
  { test: "teas", category: "drinks" },
  { test: "coffees", category: "drinks" },
  { test: "alcoholic-beverages", category: "drinks" },
  { test: "beverages", category: "drinks" },
  { test: "pastas", category: "pantry" },
  { test: "rice", category: "pantry" },
  { test: "legumes", category: "pantry" },
  { test: "canned-foods", category: "pantry" },
  { test: "breads", category: "pantry" },
];

// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

/** Minimal RFC-4180-ish CSV parser. Returns array of string arrays. */
function parseCsv(text, delimiter = ",") {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function readCsvObjects(path, delimiter = ",") {
  const rows = parseCsv(readFileSync(path, "utf8"), delimiter);
  const header = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx]])));
}

/** Rough term cleanup — the runtime does the authoritative normalisation. */
function cleanTerm(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/["'’`.,;:()\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const UNIT_NOISE_RE =
  /\b\d+([.,]\d+)?\s*(ml|cl|dl|l|lt|g|gr|kg|mg|oz|lb|lbs|ct|pk|pack|x|pcs?|pieces?|litre|liter|litri)\b/;

/** votes: Map<lang, Map<term, Map<category, count>>> */
function addVote(votes, lang, term, category, weight = 1) {
  const cleaned = cleanTerm(term);
  if (!cleaned || cleaned.length < 3 || cleaned.length > 34) return;
  if (!CATEGORIES.has(category)) return;
  if (/\d{3,}/.test(cleaned)) return; // looks like a code / weight
  if (/^\d/.test(cleaned)) return; // starts with a quantity ("1 liter", "2 burgers")
  if (UNIT_NOISE_RE.test(cleaned)) return; // embedded pack size
  if (!/[a-zà-ÿ]{3}/i.test(cleaned)) return; // needs a real word
  if (cleaned.split(" ").length > 4) return; // too long to be a product term
  if (/®|™/.test(cleaned)) return;
  if (!votes.has(lang)) votes.set(lang, new Map());
  const perTerm = votes.get(lang);
  if (!perTerm.has(cleaned)) perTerm.set(cleaned, new Map());
  const perCat = perTerm.get(cleaned);
  perCat.set(category, (perCat.get(category) || 0) + weight);
}

function ingestInstacart(dir, votes) {
  const products = join(dir, "products.csv");
  const aisles = join(dir, "aisles.csv");
  const departments = join(dir, "departments.csv");
  for (const p of [products, aisles, departments]) {
    if (!existsSync(p)) {
      console.warn(`instacart: missing ${p} — skipping Instacart`);
      return;
    }
  }
  const aisleById = new Map(
    readCsvObjects(aisles).map((a) => [a.aisle_id, cleanTerm(a.aisle)]),
  );
  const deptById = new Map(
    readCsvObjects(departments).map((d) => [d.department_id, cleanTerm(d.department)]),
  );
  let kept = 0;
  for (const row of readCsvObjects(products)) {
    const aisle = aisleById.get(row.aisle_id);
    const dept = deptById.get(row.department_id);
    // Every row gets a category — aisle, then department, then "other". Nothing
    // is dropped, so a non-food product (cosmetics, pet food, …) is learned as
    // "other" rather than silently missing from the lexicon.
    const category =
      INSTACART_AISLE_MAP[aisle] ?? INSTACART_DEPARTMENT_MAP[dept] ?? "other";
    addVote(votes, "en", row.product_name, category, 1);
    kept += 1;
  }
  console.log(`instacart: ${kept} product rows mapped`);
}

function offCategory(tagsField) {
  const tags = String(tagsField || "").toLowerCase();
  for (const rule of OFF_TAG_RULES) {
    if (tags.includes(rule.test)) return rule.category;
  }
  return null;
}

/**
 * The flat OFF CSV export has a single `product_name` with no language column,
 * so language is inferred from `countries_tags`. A row is only used when its
 * countries point to exactly one target language (unambiguous).
 */
const OFF_COUNTRY_LANG = [
  { lang: "it", tests: ["italy", "italie", "italia"] },
  { lang: "de", tests: ["germany", "deutschland", "austria", "osterreich"] },
  { lang: "fr", tests: ["france"] },
  { lang: "es", tests: ["spain", "espana", "espagne"] },
  { lang: "en", tests: ["united-kingdom", "united-states", "ireland", "australia", "canada"] },
];

function offLang(countriesField) {
  const c = String(countriesField || "").toLowerCase();
  const hits = OFF_COUNTRY_LANG.filter((entry) => entry.tests.some((t) => c.includes(t)));
  return hits.length === 1 ? hits[0].lang : null;
}

/**
 * The Open Food Facts export is far too big to read into a single string
 * (Node caps strings at ~512 MB), so it is streamed line by line. Fields are
 * split on the delimiter with no quote handling — the OFF TSV export does not
 * quote fields. If you have a comma CSV with quoted fields, convert it to `.tsv`
 * or pre-filter it (see scripts/sources/README.md). `.gz` is handled.
 *
 * The flat export carries one `product_name` and no language column, so the
 * language is taken from `countries_tags` (see `offLang`). A Parquet-derived
 * subset with `product_name_<lang>` columns is used too when present.
 */
async function ingestOpenFoodFacts(path, votes, minCount) {
  if (!existsSync(path)) {
    console.warn(`openfoodfacts: missing ${path} — skipping`);
    return;
  }
  const langCols = ["en", "it", "de", "fr", "es"];

  let stream = createReadStream(path);
  if (path.endsWith(".gz")) stream = stream.pipe(createGunzip());
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let delimiter = "\t";
  let header = null;
  let colIndex = {};
  let seen = 0;
  let kept = 0;

  for await (const line of rl) {
    if (!line) continue;
    if (!header) {
      delimiter = (line.match(/\t/g)?.length ?? 0) >= (line.match(/,/g)?.length ?? 0) ? "\t" : ",";
      header = line.split(delimiter).map((h) => h.trim());
      colIndex = Object.fromEntries(header.map((h, i) => [h, i]));
      continue;
    }
    const cells = line.split(delimiter);
    seen += 1;
    if (seen % 500000 === 0) console.log(`openfoodfacts: ${seen} rows scanned…`);

    const get = (name) => {
      const i = colIndex[name];
      return i === undefined ? "" : cells[i] || "";
    };

    const category = offCategory(get("categories_tags") || get("categories"));
    if (!category) continue;
    const popularity = Number(get("unique_scans_n") || get("scans_n") || 1);
    if (popularity < minCount) continue;

    // Preferred: explicit per-language name columns (Parquet-derived subsets).
    let usedPerLang = false;
    for (const lang of langCols) {
      const name = get(`product_name_${lang}`);
      if (!name) continue;
      usedPerLang = true;
      addVote(votes, lang, name, category, Math.min(popularity, 50));
      kept += 1;
    }
    if (usedPerLang) continue;

    // Fallback: single product_name, language inferred from countries_tags.
    const lang = get("lang") || offLang(get("countries_tags") || get("countries_en"));
    if (!lang || !langCols.includes(lang)) continue;
    const name = get("product_name") || get("generic_name");
    if (!name) continue;
    addVote(votes, lang, name, category, Math.min(popularity, 50));
    kept += 1;
  }
  console.log(`openfoodfacts: ${seen} rows scanned, ${kept} localized names mapped`);
}

/** Collapse votes into a single category per term (majority, with a margin). */
function resolveVotes(perTerm) {
  const out = {};
  for (const [term, perCat] of perTerm) {
    const ranked = [...perCat].sort((a, b) => b[1] - a[1]);
    const total = ranked.reduce((s, [, n]) => s + n, 0);
    const [topCat, topN] = ranked[0];
    if (ranked.length > 1 && ranked[1][1] === topN) continue; // tie
    if (topN / total < 0.6) continue; // not decisive
    out[term] = topCat;
  }
  return out;
}

function loadExisting(lang) {
  const path = join(DATA_DIR, `${lang}.json`);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

function writeSorted(lang, obj) {
  const sorted = Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
  );
  const path = join(DATA_DIR, `${lang}.json`);
  writeFileSync(path, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`wrote ${path} (${Object.keys(sorted).length} entries)`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const minCount = Number(args["min-count"] || 3);
  const maxPerLang = Number(args["max-per-lang"] || 3000);
  const onlyLang = typeof args.lang === "string" ? args.lang : null;

  if (!args.instacart && !args.openfoodfacts) {
    console.error(
      "Nothing to do. Pass --instacart <dir> and/or --openfoodfacts <file>.\n" +
        "See scripts/sources/README.md.",
    );
    process.exit(1);
  }

  const votes = new Map();
  if (args.instacart) ingestInstacart(resolve(args.instacart), votes);
  if (args.openfoodfacts) await ingestOpenFoodFacts(resolve(args.openfoodfacts), votes, minCount);

  for (const [lang, perTerm] of votes) {
    if (onlyLang && lang !== onlyLang) continue;
    const derived = resolveVotes(perTerm);
    const existing = loadExisting(lang);

    // Hand-curated entries always win.
    const merged = { ...derived, ...existing };

    // Cap dataset-derived additions (keep all hand-curated).
    const derivedKeys = Object.keys(derived).filter((k) => !(k in existing));
    if (derivedKeys.length > maxPerLang) {
      for (const k of derivedKeys.slice(maxPerLang)) delete merged[k];
    }

    writeSorted(lang, merged);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
