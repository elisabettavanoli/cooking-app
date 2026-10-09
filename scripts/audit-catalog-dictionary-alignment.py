#!/usr/bin/env python3
"""Read-only comparison of EN/IT category dictionaries against data.ts concepts.

Run from the repository root:
    python3 scripts/audit-catalog-dictionary-alignment.py

Writes:
    reports/catalog-dictionary-alignment.md

This script reports exact normalized name/alias disagreements only. It does not
modify dictionaries or attempt to infer categories for commercial product names.
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
REPORT_PATH = ROOT / "reports" / "catalog-dictionary-alignment.md"

VALID_CATEGORIES = {
    "fruit", "vegetables", "dairy", "meat-fish", "pantry",
    "sauces-condiments", "spices-herbs", "baking", "drinks",
    "breakfast-snacks", "snacks", "other",
}

def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", value).strip()

def load_json(path: Path) -> dict[str, str]:
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object in {path}")
    for key, value in data.items():
        if not isinstance(key, str) or value not in VALID_CATEGORIES:
            raise ValueError(f"Unexpected entry in {path}: {key!r}: {value!r}")
    return data

def quoted_strings(fragment: str) -> list[str]:
    # The catalog's c(...) data uses ordinary double-quoted strings.
    return re.findall(r'"((?:\\.|[^"\\])*)"', fragment)

def parse_catalog(path: Path) -> list[dict[str, object]]:
    source = path.read_text(encoding="utf-8")
    concepts: list[dict[str, object]] = []

    # In this file c(...) calls are data records; arguments contain no nested
    # function calls. Non-greedy matching allows aliases arrays across lines.
    for match in re.finditer(r'\bc\((.*?)\)', source, flags=re.DOTALL):
        fragment = match.group(1)
        strings = quoted_strings(fragment)
        if len(strings) < 4:
            continue

        concept_id, display_name, category, primary_alias = strings[:4]
        if category not in VALID_CATEGORIES:
            continue

        aliases = strings[4:]
        names = [display_name, primary_alias, *aliases]
        normalized_names = {normalize(name) for name in names if normalize(name)}
        concepts.append({
            "id": concept_id,
            "display": display_name,
            "category": category,
            "names": normalized_names,
        })

    if not concepts:
        raise ValueError(f"No concepts parsed from {path}; inspect c(...) format.")
    return concepts

def md_escape(value: str) -> str:
    return value.replace("|", r"\|")

def main() -> None:
    dictionaries = {
        "EN": load_json(DATA_DIR / "en.json"),
        "IT": load_json(DATA_DIR / "it.json"),
    }
    concepts = parse_catalog(CATALOG_PATH)

    # One normalized name can map to several concepts; retain all matches so
    # ambiguous catalog aliases are visible instead of silently choosing one.
    catalog_names: dict[str, list[dict[str, object]]] = defaultdict(list)
    for concept in concepts:
        for name in concept["names"]:
            catalog_names[name].append(concept)

    lines = [
        "# Catalog ↔ dictionary alignment audit",
        "",
        "Generated from the current repository. This is a read-only report of "
        "exact normalized matches between dictionary entries and curated "
        "concept display names/aliases. It does not change any files.",
        "",
        f"- Concepts parsed from `src/lib/data.ts`: **{len(concepts)}**",
        "",
        "## Category disagreements",
        "",
        "Only entries whose normalized dictionary key exactly matches a "
        "catalog display name or alias are included. Product labels with extra "
        "words are intentionally excluded from this report.",
        "",
        "| Language | Dictionary entry | Dictionary category | Catalog concept | Catalog category |",
        "|---|---|---|---|---|",
    ]

    total = 0
    ambiguous = 0
    for language, dictionary in dictionaries.items():
        for entry, dictionary_category in dictionary.items():
            matches = catalog_names.get(normalize(entry), [])
            if not matches:
                continue
            categories = {str(concept["category"]) for concept in matches}
            if len(matches) > 1:
                ambiguous += 1
            if dictionary_category in categories:
                continue
            total += 1
            descriptions = "; ".join(
                f'{concept["id"]} ({concept["display"]}) → {concept["category"]}'
                for concept in matches
            )
            lines.append(
                f"| {language} | {md_escape(entry)} | "
                f"{dictionary_category} | {md_escape(descriptions)} | "
                f"{', '.join(sorted(categories))} |"
            )

    if total == 0:
        lines.append("| — | No disagreements found | — | — | — |")

    lines += [
        "",
        "## Notes",
        "",
        f"- Exact-name category disagreements found: **{total}**.",
        f"- Dictionary entries matching more than one catalog concept name/alias: **{ambiguous}** (potential ambiguity; inspect before changing anything).",
        "- A dictionary entry is not flagged if its category matches at least one matching catalog concept. Ambiguous aliases therefore need human review.",
        "- This report does not infer matches for product labels such as `organic ...`, `sliced ...`, or other longer phrases. Those need a separate heuristic audit and manual review.",
        "",
    ]

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Alignment audit complete: {REPORT_PATH.relative_to(ROOT)}")
    print(f"Parsed concepts: {len(concepts)}")
    print(f"Exact category disagreements: {total}")
    print("No application data was modified.")

if __name__ == "__main__":
    main()
