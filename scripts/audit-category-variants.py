#!/usr/bin/env python3
"""Read-only audit for category differences between ingredient-name variants.

Run from the repository root:
    python3 scripts/audit-category-variants.py

Writes:
    reports/category-variant-audit.md

This is a candidate finder, not an auto-corrector. It compares dictionary
entries with shorter names found in the curated catalog or dictionary.
"""
from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "lib" / "category" / "data"
CATALOG_PATH = ROOT / "src" / "lib" / "data.ts"
REPORT_PATH = ROOT / "reports" / "category-variant-audit.md"

CATEGORIES = {
    "fruit", "vegetables", "dairy", "meat-fish", "pantry",
    "sauces-condiments", "spices-herbs", "baking", "drinks",
    "breakfast-snacks", "snacks", "other",
}

# Modifiers that often describe packaging, merchandising, or simple preparation.
# Their presence alone should not normally change the ingredient category.
CORE_MODIFIERS = {
    "organic", "nonorganic", "fresh", "frozen", "sliced", "chopped",
    "diced", "minced", "whole", "baby", "large", "small", "medium",
    "jumbo", "mini", "premium", "natural", "raw",
}

# These can indicate a meaningful transformation or a context-dependent
# descriptor. They are considered only for a separate lower-confidence list.
REVIEW_MODIFIERS = {
    "dried", "dehydrated", "canned", "jarred", "pickled", "ground",
    "powder", "powdered", "smoked", "roasted", "toasted", "sweet",
    "red", "green", "white", "black", "yellow", "brown", "blue",
    "unsweetened", "sweetened", "salted", "unsalted", "reduced",
    "low", "fat", "free", "seedless", "boneless", "skinless",
}

def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", value).strip()

def load_dictionary(language: str) -> dict[str, str]:
    path = DATA_DIR / f"{language}.json"
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object in {path}")
    for name, category in data.items():
        if not isinstance(name, str) or category not in CATEGORIES:
            raise ValueError(f"Invalid entry in {path}: {name!r}: {category!r}")
    return data

def quoted_strings(fragment: str) -> list[str]:
    return re.findall(r'"((?:\\.|[^"\\])*)"', fragment)

def load_catalog(path: Path) -> dict[str, list[tuple[str, str]]]:
    source = path.read_text(encoding="utf-8")
    catalog: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for match in re.finditer(r'\bc\((.*?)\)', source, flags=re.DOTALL):
        strings = quoted_strings(match.group(1))
        if len(strings) < 4:
            continue
        concept_id, display_name, category, primary_alias = strings[:4]
        if category not in CATEGORIES:
            continue
        names = [display_name, primary_alias, *strings[4:]]
        for name in names:
            key = normalize(name)
            if key:
                record = (concept_id, category)
                if record not in catalog[key]:
                    catalog[key].append(record)
    return catalog

def remove_modifiers(tokens: list[str], modifiers: set[str]) -> list[str]:
    return [token for token in tokens if token not in modifiers]

def get_candidates(name: str, modifiers: set[str]) -> list[str]:
    tokens = normalize(name).split()
    if len(tokens) < 2:
        return []
    base = remove_modifiers(tokens, modifiers)
    if not base or base == tokens:
        return []
    # Generate a base after removing modifier tokens. Require at least one
    # content token to remain, so e.g. "organic" cannot become an ingredient.
    return [" ".join(base)]

def md(value: str) -> str:
    return value.replace("|", r"\|")

def main() -> None:
    dictionaries = {lang: load_dictionary(lang) for lang in ("en", "it")}
    catalog = load_catalog(CATALOG_PATH)

    lines = [
        "# Ingredient category variant audit",
        "",
        "Read-only heuristic report based on the current repository. No categories "
        "are changed automatically. Each candidate requires review.",
        "",
        "## How to interpret this report",
        "",
        "- **Catalog reference**: the shortened name exactly matches a curated concept or alias.",
        "- **Dictionary reference**: the shortened name matches another dictionary entry but not a curated concept.",
        "- Core-modifier candidates are more likely to be metadata/preparation differences; still review before changing.",
        "- Review-modifier candidates include transformations or context-dependent descriptors and are lower confidence.",
        "",
    ]

    summary = []
    for language, dictionary in dictionaries.items():
        normalized_dictionary: dict[str, list[tuple[str, str]]] = defaultdict(list)
        for name, category in dictionary.items():
            normalized_dictionary[normalize(name)].append((name, category))

        for title, modifiers in (
            ("Core modifiers — higher-priority review", CORE_MODIFIERS),
            ("Review modifiers — lower confidence", REVIEW_MODIFIERS),
        ):
            findings = []
            for name, category in dictionary.items():
                for base in get_candidates(name, modifiers):
                    catalog_matches = catalog.get(base, [])
                    if catalog_matches:
                        categories = sorted({cat for _, cat in catalog_matches})
                        reference = "Catalog reference"
                        reference_detail = "; ".join(
                            f"{concept_id} → {cat}" for concept_id, cat in catalog_matches
                        )
                        if category not in categories:
                            findings.append((
                                name, category, base, reference, reference_detail,
                                ", ".join(categories)
                            ))
                        continue

                    dictionary_matches = normalized_dictionary.get(base, [])
                    if not dictionary_matches:
                        continue
                    categories = sorted({cat for _, cat in dictionary_matches})
                    if category not in categories:
                        reference_detail = "; ".join(
                            f"{base_name} → {cat}" for base_name, cat in dictionary_matches
                        )
                        findings.append((
                            name, category, base, "Dictionary reference",
                            reference_detail, ", ".join(categories)
                        ))

            # Deduplicate a repeated finding while preserving deterministic order.
            findings = sorted(set(findings), key=lambda row: (row[2], row[0], row[1]))
            lines += [
                f"## {language.upper()} — {title}",
                "",
                f"Candidate findings: **{len(findings)}**",
                "",
                "| Variant entry | Current category | Shortened candidate | Reference source | Reference entry/concept | Reference category/categories |",
                "|---|---|---|---|---|---|",
            ]
            for name, category, base, source, detail, ref_category in findings:
                lines.append(
                    f"| {md(name)} | {category} | {md(base)} | {source} | "
                    f"{md(detail)} | {md(ref_category)} |"
                )
            if not findings:
                lines.append("| — | — | No candidates found | — | — | — |")
            lines.append("")
            summary.append((language.upper(), title, len(findings)))

    lines += [
        "## Summary",
        "",
        "| Language | Candidate group | Findings |",
        "|---|---|---:|",
    ]
    for language, title, count in summary:
        lines.append(f"| {language} | {title} | {count} |")
    lines += [
        "",
        "This audit intentionally does not modify dictionary entries. A shortened "
        "name is a heuristic reference, not proof that two products must share a category.",
        "",
    ]

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Variant audit complete: {REPORT_PATH.relative_to(ROOT)}")
    for language, title, count in summary:
        print(f"{language} — {title}: {count}")
    print("No application data was modified.")

if __name__ == "__main__":
    main()
