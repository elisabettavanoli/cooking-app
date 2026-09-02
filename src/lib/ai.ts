/**
 * Local-only stand-ins for the web app's server functions. These run the
 * deterministic fallback paths on-device so the simulator build needs no
 * backend. When a real API is wired up later, swap these implementations for
 * fetch() calls and keep the same signatures.
 */
import { findConceptByName, findConceptById, recipeCatalog } from "./data";
import type { AICategorizationResult, Category, Recipe } from "./types";

export function categorizeIngredient(name: string): AICategorizationResult {
  const trimmed = name.trim();
  const match = findConceptByName(trimmed);
  if (match) {
    return {
      conceptId: match.id,
      displayName: match.displayName,
      category: match.category,
      iconKey: match.iconKey,
      confidence: 0.95,
    };
  }

  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return {
    conceptId: slug || "item",
    displayName: trimmed || "Item",
    category: "other" as Category,
    iconKey: slug || "other",
    confidence: 0.3,
  };
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
