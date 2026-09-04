/**
 * Localized display names for the curated ingredient concepts in `data.ts`
 * (keyed by concept id). The catalog stores one English `displayName`; this
 * table translates it per UI language for the Kitchen and List screens.
 *
 * Only languages that are "content complete" need an entry — everything else
 * falls back to the concept's English `displayName` (see `foodName()`).
 * Custom, free-typed items have a concept id that isn't in the catalog, so they
 * also fall back to whatever the user typed.
 *
 * Category labels live in the i18n string tables under `category.<key>`.
 */
import type { LangCode } from "./category/locales";
import { findConceptById } from "./data";

const it: Record<string, string> = {
  // Fruit
  lemon: "Limone",
  lime: "Lime",
  avocado: "Avocado",
  apple: "Mela",
  banana: "Banana",
  orange: "Arancia",
  berries: "Frutti di bosco",

  // Vegetables
  tomato: "Pomodoro",
  onion: "Cipolla",
  garlic: "Aglio",
  carrot: "Carota",
  potato: "Patata",
  "bell-pepper": "Peperone",
  spinach: "Spinaci",
  mushroom: "Funghi",
  broccoli: "Broccoli",
  cauliflower: "Cavolfiore",
  lettuce: "Lattuga",
  cucumber: "Cetriolo",
  zucchini: "Zucchine",
  eggplant: "Melanzana",
  celery: "Sedano",
  peas: "Piselli",
  ginger: "Zenzero",
  chili: "Peperoncino",

  // Fresh & dried herbs / spices
  parsley: "Prezzemolo",
  cilantro: "Coriandolo",
  basil: "Basilico",
  thyme: "Timo",
  oregano: "Origano",
  rosemary: "Rosmarino",
  mint: "Menta",
  salt: "Sale",
  "black-pepper": "Pepe nero",
  cumin: "Cumino",
  paprika: "Paprika",
  "curry-powder": "Curry in polvere",
  turmeric: "Curcuma",
  cinnamon: "Cannella",
  "oregano-dried": "Origano secco",
  "chili-flakes": "Peperoncino in fiocchi",
  "garlic-powder": "Aglio in polvere",
  "onion-powder": "Cipolla in polvere",
  "bay-leaf": "Alloro",

  // Dairy
  milk: "Latte",
  butter: "Burro",
  eggs: "Uova",
  yogurt: "Yogurt",
  cream: "Panna",
  cheese: "Formaggio",
  mozzarella: "Mozzarella",
  parmesan: "Parmigiano",
  feta: "Feta",
  "cream-cheese": "Formaggio spalmabile",

  // Meat & Fish
  chicken: "Pollo",
  beef: "Manzo",
  pork: "Maiale",
  bacon: "Pancetta",
  ham: "Prosciutto",
  sausage: "Salsiccia",
  fish: "Pesce",
  salmon: "Salmone",
  shrimp: "Gamberi",
  tuna: "Tonno",

  // Pantry
  pasta: "Pasta",
  rice: "Riso",
  noodles: "Noodle",
  bread: "Pane",
  tortilla: "Tortilla",
  chickpeas: "Ceci",
  lentils: "Lenticchie",
  beans: "Fagioli",
  "coconut-milk": "Latte di cocco",
  "canned-tomatoes": "Pomodori in scatola",
  olives: "Olive",
  oats: "Avena",
  nuts: "Frutta secca",
  pizza: "Pizza",
  pita: "Pita",
  ravioli: "Ravioli",

  // Sauces & condiments
  "olive-oil": "Olio d'oliva",
  "vegetable-oil": "Olio di semi",
  "soy-sauce": "Salsa di soia",
  vinegar: "Aceto",
  "balsamic-vinegar": "Aceto balsamico",
  "tomato-sauce": "Passata di pomodoro",
  "tomato-paste": "Concentrato di pomodoro",
  pesto: "Pesto",
  mustard: "Senape",
  ketchup: "Ketchup",
  mayonnaise: "Maionese",
  honey: "Miele",
  jam: "Marmellata",
  "peanut-butter": "Burro di arachidi",
  "sesame-oil": "Olio di sesamo",
  "fish-sauce": "Salsa di pesce",
  "rice-vinegar": "Aceto di riso",
  stock: "Brodo",
  salsa: "Salsa",

  // Baking
  flour: "Farina",
  sugar: "Zucchero",
  "brown-sugar": "Zucchero di canna",
  "baking-powder": "Lievito per dolci",
  "baking-soda": "Bicarbonato",
  vanilla: "Estratto di vaniglia",
  chocolate: "Cioccolato",
  yeast: "Lievito di birra",

  // Drinks
  water: "Acqua",
  juice: "Succo",
  coffee: "Caffè",
  tea: "Tè",
  chamomile: "Camomilla",
  wine: "Vino",
  beer: "Birra",
  soda: "Bibita",

  // Breakfast & treats
  cereal: "Cereali",
  biscuits: "Biscotti",
  "chocolate-bar": "Barretta di cioccolato",
  "ice-cream": "Gelato",
  "chocolate-spread": "Crema al cioccolato",
  sweets: "Caramelle",

  // Savoury snacks
  crisps: "Patatine",
  crackers: "Cracker",
  popcorn: "Popcorn",
  pretzels: "Salatini",

  // Other
  ice: "Ghiaccio",
};

const TABLES: Partial<Record<LangCode, Record<string, string>>> = { it };

/**
 * Display name for an item in the active UI language.
 *
 * The curated translation is used only when `stored` is the concept's canonical
 * English `displayName` — i.e. it was auto-filled (seed data, or a recipe-sourced
 * shopping item). A name the user typed themselves ("Nutella", "latte di mamma")
 * is kept verbatim, in any language, even when its concept has a translation.
 * Custom items (concept id not in the catalog) always fall back to `stored`.
 */
export function foodName(conceptId: string, lang: LangCode, stored: string): string {
  const translated = TABLES[lang]?.[conceptId];
  if (!translated) return stored;
  const canonical = findConceptById(conceptId)?.displayName;
  const isAutoFilled = !!canonical && stored.trim().toLowerCase() === canonical.toLowerCase();
  return isAutoFilled ? translated : stored;
}
