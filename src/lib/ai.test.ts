import { describe, expect, it } from "vitest";
import { categorizeIngredient, categorizeIngredientAsync, generateRecipe } from "./ai";
import { recipeCatalog, findConceptByName } from "./data";
import { __resetCache } from "./category/cache";

describe("categorizeIngredient", () => {
  it("resolves a known ingredient to its concept with high confidence", () => {
    const known = findConceptByName("tomato");
    expect(known).toBeTruthy();
    const res = categorizeIngredient("tomato");
    expect(res.conceptId).toBe(known!.id);
    expect(res.category).toBe(known!.category);
    expect(res.confidence).toBeGreaterThan(0.5);
  });

  it("falls back to a slug + 'other' for an unknown ingredient", () => {
    const res = categorizeIngredient("Zibblewump Snarf");
    expect(res.conceptId).toBe("zibblewump-snarf");
    expect(res.category).toBe("other");
    expect(res.confidence).toBeLessThan(0.5);
  });

  it("does not crash on empty input", () => {
    const res = categorizeIngredient("   ");
    expect(res.displayName).toBeTruthy();
  });

  it("resolves an unlisted product deterministically via the lexicon", () => {
    const res = categorizeIngredient("succo di mela", { lang: "it" });
    expect(res.category).toBe("drinks");
    expect(res.confidence).toBeGreaterThan(0.5);
  });
});

describe("categorizeIngredientAsync", () => {
  it("keeps the deterministic result when no backend answers", async () => {
    __resetCache();
    const res = await categorizeIngredientAsync("piselli surgelati", { lang: "it" });
    expect(res.category).toBe("vegetables");
  });

  it("returns 'other' for a genuinely unknown item (AI stub returns null)", async () => {
    __resetCache();
    const res = await categorizeIngredientAsync("Zibblewump Snarf");
    expect(res.category).toBe("other");
  });
});

describe("generateRecipe", () => {
  it("returns a catalog recipe", () => {
    const r = generateRecipe(["pasta", "tomato"]);
    expect(recipeCatalog.some((c) => c.id === r.id)).toBe(true);
  });

  it("prefers the recipe overlapping the given concepts the most", () => {
    const r = generateRecipe(["pasta", "tomato", "basil"]);
    const overlap = new Set(r.ingredients.map((i) => i.conceptId));
    const score = ["pasta", "tomato", "basil"].filter((c) => overlap.has(c)).length;
    expect(score).toBeGreaterThan(0);
  });
});
