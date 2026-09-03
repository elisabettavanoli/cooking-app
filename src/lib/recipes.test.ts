import { describe, expect, it } from "vitest";
import { matchRecipe, recipeMatches } from "./recipes";
import { recipeCatalog } from "./data";
import type { InventoryItem, Recipe } from "./types";

function inv(conceptId: string, quantity = 99): InventoryItem {
  return {
    id: `t-${conceptId}`,
    conceptId,
    displayName: conceptId,
    quantity,
    unit: "piece",
    category: "other",
    status: "active",
    addedAt: new Date().toISOString(),
  };
}

const recipe: Recipe = {
  id: "r-test",
  name: "Test Dish",
  description: "",
  timeMinutes: 10,
  servings: 2,
  tags: [],
  instructions: ["Cook"],
  ingredients: [
    { conceptId: "pasta", displayName: "Pasta", quantity: 1, unit: "pack" },
    { conceptId: "tomato", displayName: "Tomato", quantity: 3, unit: "piece" },
    { conceptId: "basil", displayName: "Basil", quantity: 1, unit: "bunch", optional: true },
  ],
};

describe("matchRecipe", () => {
  it("reports everything missing when the pantry is empty", () => {
    const m = matchRecipe(recipe, []);
    expect(m.have).toHaveLength(0);
    expect(m.missing.map((i) => i.conceptId)).toEqual(["pasta", "tomato"]);
    expect(m.missingCount).toBe(2);
    expect(m.coverage).toBe(0);
  });

  it("counts an item as had only when quantity is sufficient", () => {
    const m = matchRecipe(recipe, [inv("pasta"), inv("tomato", 2)]);
    expect(m.have.map((i) => i.conceptId)).toEqual(["pasta"]);
    expect(m.missing.map((i) => i.conceptId)).toEqual(["tomato"]);
  });

  it("does not mark an absent optional ingredient as missing", () => {
    const m = matchRecipe(recipe, [inv("pasta"), inv("tomato")]);
    expect(m.missingCount).toBe(0);
    expect(m.optionalCount).toBe(1);
    expect(m.coverage).toBe(1);
  });
});

describe("recipeMatches", () => {
  it("returns one match per catalog recipe, fewest missing first", () => {
    const pantry = [inv("pasta"), inv("tomato"), inv("basil"), inv("onion"), inv("garlic")];
    const res = recipeMatches(undefined, pantry);
    expect(res).toHaveLength(recipeCatalog.length);
    for (let i = 1; i < res.length; i++) {
      expect(res[i - 1].missingCount).toBeLessThanOrEqual(res[i].missingCount);
    }
  });

  it("restricts matching to the selected concepts", () => {
    const pantry = [inv("pasta"), inv("tomato"), inv("chicken")];
    const haveByRecipe = new Map(
      recipeMatches(undefined, pantry).map((m) => [m.recipe.id, m.haveCount]),
    );
    // Narrowing to a subset of concepts can only lower a recipe's have count.
    for (const m of recipeMatches(["pasta"], pantry)) {
      expect(m.haveCount).toBeLessThanOrEqual(haveByRecipe.get(m.recipe.id) ?? 0);
    }
  });
});
