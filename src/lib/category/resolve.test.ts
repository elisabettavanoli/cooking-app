import { beforeEach, describe, expect, it } from "vitest";
import { normalizeName } from "./normalize";
import { resolveCategory } from "./resolve";
import { rememberCategory, cacheKey, primeCache, __resetCache } from "./cache";
import { __rebuildLexicon } from "./lexicon";

beforeEach(() => {
  __resetCache();
  __rebuildLexicon();
});

describe("normalizeName", () => {
  it("strips quantities, units, packaging and accents", () => {
    expect(normalizeName("2x Latte Intero 1,5 L", "it").key).toBe("latte intero");
    expect(normalizeName("Crème Fraîche 200g", "fr").key).toBe("creme fraiche");
    expect(normalizeName("500 g Basmati Rice", "en").key).toBe("basmati rice");
  });

  it("removes leading articles per language", () => {
    expect(normalizeName("il pane", "it").key).toBe("pane");
    expect(normalizeName("les pâtes", "fr").tokens).toContain("pate");
  });
});

describe("resolveCategory", () => {
  it("resolves via the curated concept catalog", () => {
    const r = resolveCategory("tomato");
    expect(r.category).toBe("vegetables");
    expect(r.source).toBe("concept");
  });

  it("resolves an Italian term from the lexicon", () => {
    const r = resolveCategory("lenticchie", { lang: "it" });
    expect(r.category).toBe("pantry");
    expect(r.source).toBe("lexicon-exact");
  });

  it("resolves a German term from the lexicon", () => {
    const r = resolveCategory("Griechischer Joghurt", { lang: "de" });
    expect(r.category).toBe("dairy");
    expect(r.source).toBe("lexicon-exact");
  });

  it("matches across languages when the lang hint is wrong", () => {
    const r = resolveCategory("quark", { lang: "en" });
    expect(r.category).toBe("dairy");
    expect(r.source).toBe("lexicon-exact");
  });

  it("uses a keyword stem rule for unlisted products", () => {
    const r = resolveCategory("patatine in busta gusto paprika", { lang: "it" });
    expect(r.category).toBe("snacks");
    expect(r.source).toBe("keyword");
  });

  it("falls back to a token vote for multi-word names", () => {
    const r = resolveCategory("homemade quinoa bowl", { lang: "en" });
    expect(r.category).toBe("pantry");
    expect(r.source).toBe("lexicon-token");
  });

  it("returns null for a genuinely unknown item", () => {
    const r = resolveCategory("Zibblewump Snarf");
    expect(r.category).toBeNull();
    expect(r.source).toBe("none");
  });

  it("prefers a learned cache entry over the lexicon", async () => {
    const { lang, key } = normalizeName("acqua tonica", "it");
    await rememberCategory(cacheKey(lang, key), "other");
    await primeCache();
    const r = resolveCategory("acqua tonica", { lang: "it" });
    expect(r.category).toBe("other");
    expect(r.source).toBe("cache");
  });
});
