# Category lexicon — data sources

`build-category-lexicon.mjs` turns public grocery datasets into the
`src/lib/category/data/<lang>.json` term → category maps. Downloads are **not**
committed (large, separately licensed). Drop them here, then run:

```bash
npm run build:lexicon -- \
  --instacart scripts/sources/instacart \
  --openfoodfacts scripts/sources/openfoodfacts.csv \
  --min-count 5
```

Hand-curated entries already in the JSON files are always kept and win over
anything the datasets produce, so re-running is safe.

## Instacart Market Basket Dataset

- Source: <https://www.kaggle.com/c/instacart-market-basket-analysis/data>
- Put `products.csv`, `aisles.csv`, `departments.csv` in `scripts/sources/instacart/`.
- English only. ~50k real grocery product names, each with an aisle (134) and
  department (21). Mapped via `INSTACART_AISLE_MAP` / `INSTACART_DEPARTMENT_MAP`
  in the build script.
- Licence: Instacart competition rules — fine for internal use; check before
  redistributing the derived data.

## Open Food Facts

- Source: <https://world.openfoodfacts.org/data>. Any of these works — the file
  is **streamed** line by line (the full export is ~9 GB, too big to load whole)
  and the delimiter (tab or comma) is auto-detected from the header:
  - the full CSV/TSV export (tab-separated despite the `.csv` name), or its `.gz`
  - a filtered subset you make yourself (recommended — much faster)
- Fields split on the delimiter with **no quote handling** (the OFF export does
  not quote). A hand-rolled comma CSV with quoted fields will mis-parse — use TSV
  or pre-filter.
- Multilingual: uses `product_name_en/it/de/fr/es`, or `product_name` + `lang`.
- Category comes from `categories_tags` via `OFF_TAG_RULES`.
- `--min-count N` keeps only products with `unique_scans_n >= N` (popularity
  filter — raise it to bias toward common items and cut noise).
- Licence: **Open Database License (ODbL)** — share-alike applies if you
  redistribute the database. Internal app use is fine.

### Pre-filtering with DuckDB (recommended)

The full export is unwieldy. Grab the Parquet (`food.parquet`) and cut it down:

```sql
COPY (
  SELECT product_name, product_name_en, product_name_it, product_name_de,
         product_name_fr, product_name_es,
         array_to_string(categories_tags, ',') AS categories_tags,
         lang, unique_scans_n
  FROM read_parquet('food.parquet')
  WHERE unique_scans_n >= 5 AND len(categories_tags) > 0
) TO 'scripts/sources/openfoodfacts.tsv' (HEADER, DELIMITER '\t');
```

## Other options (not wired up)

- USDA FoodData Central (public domain, English, `foodCategory`).
- GS1 GPC bricks / Google Product Taxonomy — taxonomies, not product→category
  data; would need their own mapping layer.
- Wikidata SPARQL — multilingual food items via `subclass of` chains.

## Adding a language

1. Add the code to `LangCode` / `LOCALE_RULES` in `src/lib/category/locales.ts`.
2. Create `src/lib/category/data/<lang>.json` (can start as `{}`).
3. Add a `langCols` entry in the build script if Open Food Facts has that
   `product_name_<lang>` column, and a keyword section in `data/keywords.json`.
