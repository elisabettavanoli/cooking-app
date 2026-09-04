import { recipeCatalog } from "./data";
import type { InventoryItem, Recipe, RecipeIngredient, RecipeMatch } from "./types";

export function matchRecipe(recipe: Recipe, available: InventoryItem[]): RecipeMatch {
  const have: RecipeIngredient[] = [];
  const missing: RecipeIngredient[] = [];
  const optionalHave: RecipeIngredient[] = [];

  for (const ing of recipe.ingredients) {
    // Untracked quantity (null) counts as "enough" — the user told us they
    // have it, just didn't say how much.
    const inv = available.find(
      (i) => i.conceptId === ing.conceptId && (i.quantity == null || i.quantity >= ing.quantity),
    );
    if (inv) {
      have.push(ing);
    } else if (ing.optional) {
      optionalHave.push(ing);
    } else {
      missing.push(ing);
    }
  }

  const required = recipe.ingredients.filter((i) => !i.optional);
  const coverage = required.length === 0 ? 1 : have.length / required.length;

  return {
    recipe,
    haveCount: have.length,
    missingCount: missing.length,
    optionalCount: optionalHave.length,
    coverage,
    have,
    missing,
  };
}

export function recipeMatches(
  selectedConceptIds: string[] | undefined,
  available: InventoryItem[],
): RecipeMatch[] {
  const base =
    selectedConceptIds && selectedConceptIds.length > 0
      ? available.filter((i) => selectedConceptIds.includes(i.conceptId))
      : available;

  const matches = recipeCatalog.map((recipe) => matchRecipe(recipe, base));

  // Fewest missing ingredients first (what you can almost cook), then best
  // coverage, then name for a stable order.
  return matches.sort((a, b) => {
    if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
    if (b.coverage !== a.coverage) return b.coverage - a.coverage;
    return a.recipe.name.localeCompare(b.recipe.name);
  });
}
