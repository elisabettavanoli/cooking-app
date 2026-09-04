/**
 * Local-only stand-ins for the web app's server functions. These run the
 * deterministic fallback paths on-device so the simulator build needs no
 * backend. When a real API is wired up later, swap these implementations for
 * fetch() calls and keep the same signatures.
 */
import { findConceptByName, findConceptByNameExact, findConceptByToken, findConceptById, recipeCatalog } from "./data";
import type { AICategorizationResult, Category, Recipe } from "./types";
import {
  resolveCategory,
  normalizeName,
  cacheKey,
  getCachedCategory,
  rememberCategory,
  type LangCode,
} from "./category";

/** Deterministic resolutions at/above this confidence never trigger an AI call. */
const AI_SKIP_CONFIDENCE = 0.5;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Synchronous, fully offline categorisation: the deterministic resolver (concept
 * catalog + per-language lexicon, see ./category) with no network and no learned
 * cache — use `categorizeIngredientAsync` for those.
 */
export function categorizeIngredient(
  name: string,
  opts: { lang?: LangCode } = {},
): AICategorizationResult {
  const trimmed = name.trim();
  const resolution = resolveCategory(trimmed, opts);

  // Exact whole-name/alias match — trusted outright. A single-token exact
  // match (e.g. "pesce" inside "bastoncini di pesce" or "pesce fritto") is
  // only trusted when it agrees with the resolver's own category: the token
  // is still just one word out of the phrase, and another word can change
  // what the product actually is ("succo di mela" contains "mela"/apple but
  // is a juice, not the fruit — the resolver's keyword-stem step already
  // knows "succo" means drinks, so the mismatch vetoes the token guess).
  const tokenConcept = findConceptByToken(
    normalizeName(trimmed, opts.lang ?? resolution.lang).tokens,
  );
  const safeConcept =
    findConceptByNameExact(trimmed) ??
    (tokenConcept && (resolution.category === null || tokenConcept.category === resolution.category)
      ? tokenConcept
      : undefined);
  if (safeConcept) {
    return {
      conceptId: safeConcept.id,
      displayName: safeConcept.displayName,
      category: safeConcept.category,
      iconKey: safeConcept.iconKey,
      confidence: 0.95,
    };
  }

  // English-only fuzzy substring fallback: the catalog matches loosely by
  // substring, so "jus d'orange" would otherwise borrow the orange concept
  // the moment the token vote also guessed produce. Only trusted when it
  // agrees with the resolver's own category call.
  const fuzzyConcept = resolution.lang === "en" ? findConceptByName(trimmed) : undefined;
  if (fuzzyConcept && fuzzyConcept.category === resolution.category) {
    return {
      conceptId: fuzzyConcept.id,
      displayName: fuzzyConcept.displayName,
      category: fuzzyConcept.category,
      iconKey: fuzzyConcept.iconKey,
      confidence: 0.95,
    };
  }

  const slug = slugify(trimmed);
  return {
    conceptId: slug || "item",
    displayName: trimmed || "Item",
    category: resolution.category ?? ("other" as Category),
    iconKey: slug || "other",
    confidence: resolution.category ? resolution.confidence : 0.3,
  };
}

/**
 * Categorisation with the learned cache and the AI fallback layered on top of
 * the deterministic result. The AI call only fires when every offline step has
 * missed, and its answer is cached so the same product is free next time.
 */
export async function categorizeIngredientAsync(
  name: string,
  opts: { lang?: LangCode } = {},
): Promise<AICategorizationResult> {
  const trimmed = name.trim();
  const sync = categorizeIngredient(trimmed, opts);
  const resolution = resolveCategory(trimmed, opts);

  // Curated concept hit that the resolver trusts — nothing for the cache or AI to add.
  if (sync.confidence >= 0.95 && resolution.source === "concept") return sync;
  const key = resolution.key ? cacheKey(resolution.lang, resolution.key) : null;

  if (key) {
    const cached = await getCachedCategory(key);
    if (cached) return { ...sync, category: cached, confidence: 0.9 };
  }

  if (resolution.category && resolution.confidence >= AI_SKIP_CONFIDENCE) {
    return sync;
  }

  // Deterministic paths exhausted — this is the only branch that may hit the network.
  const ai = await aiCategorize(trimmed, resolution.lang);
  if (ai) {
    if (key) void rememberCategory(key, ai.category);
    return { ...sync, category: ai.category, confidence: ai.confidence };
  }

  return sync;
}

/**
 * Server categorisation call — the paid path, reached only when every
 * deterministic step in `resolveCategory` has missed. Returns null for now so
 * callers keep the deterministic result; wire it to a Supabase edge function (or
 * direct provider call) that runs an LLM classifier constrained to the
 * `Category` union, and keep the signature. Answers are cached by the caller, so
 * each distinct product is billed at most once.
 */
export async function aiCategorize(
  _name: string,
  _lang: LangCode,
): Promise<{ category: Category; confidence: number } | null> {
  return null;
}

export function generateRecipe(conceptIds: string[]): Recipe {
  let best: Recipe = recipeCatalog[0];
  let bestScore = -1;
  for (const recipe of recipeCatalog) {
    const recipeConceptIds = new Set(recipe.ingredients.map((i) => i.conceptId));
    const score = conceptIds.filter((id) => recipeConceptIds.has(id)).length;
    if (score > bestScore) {
      bestScore = score;
      best = recipe;
    }
  }
  return best;
}

export { findConceptById };
