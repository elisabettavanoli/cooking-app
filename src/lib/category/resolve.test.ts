import { beforeEach, describe, expect, it } from "vitest";
import { normalizeName } from "./normalize";
import { resolveCategory } from "./resolve";
import { __rebuildLexicon } from "./lexicon";
import { findConceptByNameExact, findConceptByToken } from "../data";

beforeEach(() => {
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

  it("classifies eggs as pantry in English and Italian", () => {
    expect(resolveCategory("eggs", { lang: "en" }).category).toBe("pantry");
    expect(resolveCategory("egg", { lang: "en" }).category).toBe("pantry");
    expect(resolveCategory("uova", { lang: "it" }).category).toBe("pantry");
    expect(resolveCategory("uovo", { lang: "it" }).category).toBe("pantry");
  });

  it("does not resolve an ambiguous concept alias", () => {
    expect(findConceptByNameExact("pepper")).toBeUndefined();
    expect(findConceptByToken(["pepper"])).toBeUndefined();
  });

  it("resolves unambiguous pepper variants", () => {
    expect(resolveCategory("black pepper", { lang: "en" }).category).toBe("spices-herbs");
    expect(resolveCategory("bell pepper", { lang: "en" }).category).toBe("vegetables");
  });

  it("resolves paprika according to the selected language", () => {
    expect(resolveCategory("paprika", { lang: "en" }).category).toBe("spices-herbs");
    expect(resolveCategory("paprika", { lang: "it" }).category).toBe("spices-herbs");
    expect(resolveCategory("paprika", { lang: "de" }).category).toBe("vegetables");
    expect(resolveCategory("paprika", { lang: "fr" }).category).toBe("spices-herbs");
  });

  it("resolves raisins according to the selected language", () => {
    expect(resolveCategory("raisins", { lang: "en" }).category).toBe("pantry");
    expect(resolveCategory("raisins", { lang: "fr" }).category).toBe("fruit");
  });

  it("preserves the curated concept when the exact categories agree", () => {
    const result = resolveCategory("tomato", { lang: "en" });

    expect(result.category).toBe("vegetables");
    expect(result.source).toBe("concept");
  });
});
