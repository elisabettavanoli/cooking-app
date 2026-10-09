import { findConceptByName, findConceptByNameExact, findConceptByToken } from "./data";
import type { AICategorizationResult, Category } from "./types";
import { resolveCategory, normalizeName, type LangCode } from "./category";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Deterministic, fully offline ingredient categorization.
 */
export function categorizeIngredient(
  name: string,
  opts: { lang?: LangCode } = {},
): AICategorizationResult {
  const trimmed = name.trim();
  const resolution = resolveCategory(trimmed, opts);

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
 * Async-compatible API for existing callers.
 * Categorization is entirely local: no AI service and no learned cache.
 */
export async function categorizeIngredientAsync(
  name: string,
  opts: { lang?: LangCode } = {},
): Promise<AICategorizationResult> {
  return categorizeIngredient(name, opts);
}
