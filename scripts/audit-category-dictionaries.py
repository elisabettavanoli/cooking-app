#!/usr/bin/env python3
"""Read-only audit of Co-oking's EN/IT category dictionaries.

Run from the repository root:
    python3 scripts/audit-category-dictionaries.py

The script does not modify application files. It writes a Markdown report to
    reports/category-dictionary-audit.md
"""
from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "lib" / "category" / "data"
REPORT_PATH = ROOT / "reports" / "category-dictionary-audit.md"

# Terms commonly describing packaging, preparation, size, or marketing rather
# than a different base ingredient. Removing these is only a way to FIND
# candidates; it is not proof that two entries should share a category.
EN_MODIFIERS = {
    "all", "baby", "black", "boneless", "brown", "canned", "chopped",
    "classic", "cut", "diced", "dried", "extra", "fat", "free", "fresh",
    "frozen", "gluten", "grade", "green", "ground", "jumbo", "large",
    "lean", "low", "medium", "mini", "mild", "natural", "non", "organic",
    "pastured", "premium", "pure", "range", "raw", "red", "reduced",
    "ripe", "seedless", "sliced", "small", "smoked", "skinless", "sodium",
    "sweet", "unsweetened", "white", "whole", "yellow",
}

def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", value).strip()

def load_dictionary(language: str) -> dict[str, str]:
    path = DATA_DIR / f"{language}.json"
    with path.open(encoding="utf-8") as handle:
        result = json.load(handle)
    if not isinstance(result, dict) or not all(
        isinstance(k, str) and isinstance(v, str) for k, v in result.items()
    ):
        raise ValueError(f"Unexpected dictionary structure in {path}")
    return result

def modifier_groups(dictionary: dict[str, str]) -> list[tuple[str, list[tuple[str, str]]]]:
    groups: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for name, category in dictionary.items():
        tokens = normalize(name).split()
        base_tokens = [token for token in tokens if token not in EN_MODIFIERS]
        base = " ".join(base_tokens)
        if base and base != normalize(name):
            groups[base].append((name, category))

    findings = []
    for base, variants in groups.items():
        all_variants = list(variants)
        if base in dictionary:
            all_variants.append((base, dictionary[base]))
        categories = {category for _, category in all_variants}
        if len(categories) > 1:
            # Deduplicate repeated name/category pairs while preserving order.
            unique = list(dict.fromkeys(all_variants))
            findings.append((base, unique))
    return sorted(findings)

def plural_candidates(dictionary: dict[str, str], language: str):
    """Find simple singular/plural-looking pairs with different categories.

    Deliberately conservative and heuristic; all findings require review.
    """
    normalized_lookup: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for name, category in dictionary.items():
        normalized_lookup[normalize(name)].append((name, category))

    pairs = set()
    for normalized_name, entries in normalized_lookup.items():
        tokens = normalized_name.split()
        if not tokens:
            continue
        last = tokens[-1]
        candidates = set()
        if language == "en":
            if len(last) > 3 and last.endswith("ies"):
                candidates.add(" ".join(tokens[:-1] + [last[:-3] + "y"]))
            if len(last) > 3 and last.endswith("es"):
                candidates.add(" ".join(tokens[:-1] + [last[:-2]]))
            if len(last) > 3 and last.endswith("s") and not last.endswith(("ss", "us", "is")):
                candidates.add(" ".join(tokens[:-1] + [last[:-1]]))
        else:
            if len(last) > 3 and last.endswith("e"):
                candidates.add(" ".join(tokens[:-1] + [last[:-1] + "a"]))
                candidates.add(" ".join(tokens[:-1] + [last[:-1] + "i"]))
            if len(last) > 3 and last.endswith("i"):
                candidates.add(" ".join(tokens[:-1] + [last[:-1] + "o"]))
            if len(last) > 3 and last.endswith("e"):
                candidates.add(" ".join(tokens[:-1] + [last[:-1] + "o"]))

        for candidate in candidates:
            if candidate in normalized_lookup:
                for left_name, left_cat in entries:
                    for right_name, right_cat in normalized_lookup[candidate]:
                        if left_name != right_name and left_cat != right_cat:
                            pair = tuple(sorted(((left_name, left_cat), (right_name, right_cat))))
                            pairs.add(pair)
    return sorted(pairs, key=lambda pair: (pair[0][0], pair[1][0]))

def md_escape(value: str) -> str:
    return value.replace("|", r"\|")

def main() -> None:
    dictionaries = {lang: load_dictionary(lang) for lang in ("en", "it")}
    lines = [
        "# Category dictionary audit (read-only)",
        "",
        "This report is generated from the current repository dictionaries. "
        "It flags candidates only; it does not decide or apply category changes.",
        "",
    ]

    for language, dictionary in dictionaries.items():
        findings = modifier_groups(dictionary)
        plural_pairs = plural_candidates(dictionary, language)
        lines += [
            f"## {language.upper()} — modifier-related category differences",
            "",
            f"Candidate groups: **{len(findings)}**",
            "",
            "| Base candidate | Entry | Category |",
            "|---|---|---|",
        ]
        for base, entries in findings:
            for name, category in entries:
                lines.append(
                    f"| {md_escape(base)} | {md_escape(name)} | {md_escape(category)} |"
                )
        if not findings:
            lines.append("| — | No candidates found | — |")

        lines += [
            "",
            f"## {language.upper()} — possible singular/plural conflicts",
            "",
            f"Candidate pairs: **{len(plural_pairs)}**",
            "",
            "| Entry A | Category A | Entry B | Category B |",
            "|---|---|---|---|",
        ]
        for (name_a, cat_a), (name_b, cat_b) in plural_pairs:
            lines.append(
                f"| {md_escape(name_a)} | {md_escape(cat_a)} | "
                f"{md_escape(name_b)} | {md_escape(cat_b)} |"
            )
        if not plural_pairs:
            lines.append("| — | — | No candidates found | — |")
        lines.append("")

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Audit complete. Report written to: {REPORT_PATH.relative_to(ROOT)}")
    print("No application data was modified.")

if __name__ == "__main__":
    main()
