import { recipeCatalog } from "./data";
import type { InventoryItem, Recipe, RecipeIngredient, RecipeMatch } from "./types";

export function matchRecipe(recipe: Recipe, available: InventoryItem[]): RecipeMatch {
  const have: RecipeIngredient[] = [];
  const missing: RecipeIngredient[] = [];
  const optionalHave: RecipeIngredient[] = [];

  for (const ing of recipe.ingredients) {
    const inv = available.find((i) => i.conceptId === ing.conceptId && i.quantity >= ing.quantity);
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

  return matches.sort((a, b) => {
    if (b.coverage !== a.coverage) return b.coverage - a.coverage;
    if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
    return a.recipe.name.localeCompare(b.recipe.name);
  });
}
