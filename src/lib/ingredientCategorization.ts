import { findConceptByNameExact, findConceptByToken } from "./data";
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

  // 1. Prefer an exact, unambiguous concept match.
  const exactConcept = findConceptByNameExact(trimmed);

  if (exactConcept) {
    return {
      conceptId: exactConcept.id,
      displayName: exactConcept.displayName,
      category: exactConcept.category,
      iconKey: exactConcept.iconKey,
      confidence: 0.95,
    };
  }

  // 2. A token-based concept is safe only when its category agrees
  // with the category independently resolved from the full ingredient.
  const tokenConcept = findConceptByToken(
    normalizeName(trimmed, opts.lang ?? resolution.lang).tokens,
  );

  if (tokenConcept && resolution.category === tokenConcept.category) {
    return {
      conceptId: tokenConcept.id,
      displayName: tokenConcept.displayName,
      category: tokenConcept.category,
      iconKey: tokenConcept.iconKey,
      confidence: 0.95,
    };
  }

  // 3. Preserve the original ingredient when no safe concept is available.
  const slug = slugify(trimmed);

  return {
    conceptId: slug || "item",
    displayName: trimmed || "Item",
    category: resolution.category ?? ("other" as Category),
    iconKey: slug || "other",
    confidence: resolution.category !== null ? resolution.confidence : 0.3,
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
