import { UtensilsCrossed } from "lucide-react";
import type { ReactNode } from "react";
import { categoryMeta } from "../lib/data";
import { foodiconpackCategoryFallback, foodiconpackIndex } from "../lib/foodiconpackIndex";
import { useIconStyle } from "../lib/iconStyle";
import type { Category } from "../lib/types";

/**
 * Emoji glyph for a food, keyed by the same `iconKey` slugs used across the
 * app (English concept ids and their common plurals/synonyms — see `ai.ts`
 * and the concept catalog in `data.ts`). A non-English item name is resolved
 * to its concept id via that catalog's `aliases` before it gets here, so this
 * map only needs a handful of standalone non-English entries for words with
 * no curated concept yet. Anything not listed falls back to the category
 * emoji, then a shopping trolley.
 */
const foodEmoji: Record<string, string> = {
  // ── Fruit ────────────────────────────────────────────────────────────────
  lemon: "🍋",
  lime: "🍋",
  avocado: "🥑",
  apple: "🍎",
  banana: "🍌",
  orange: "🍊",
  berries: "🫐",
  strawberry: "🍓",
  strawberries: "🍓",
  blueberries: "🫐",
  raspberries: "🍇",
  blackberries: "🍇",
  grapes: "🍇",
  raisins: "🍇",
  cherries: "🍒",
  mango: "🥭",
  pineapple: "🍍",
  peach: "🍑",
  pear: "🍐",
  plum: "🫐",
  kiwi: "🥝",
  melon: "🍈",
  watermelon: "🍉",
  grapefruit: "🍊",
  coconut: "🥥",
  dates: "🌴",

  // ── Vegetables ───────────────────────────────────────────────────────────
  tomato: "🍅",
  tomatoes: "🍅",
  onion: "🧅",
  onions: "🧅",
  "spring-onion": "🧅",
  scallion: "🧅",
  shallot: "🧅",
  leek: "🧅",
  garlic: "🧄",
  carrot: "🥕",
  carrots: "🥕",
  potato: "🥔",
  potatoes: "🥔",
  "sweet-potato": "🍠",
  "bell-pepper": "🫑",
  peppers: "🫑",
  spinach: "🥬",
  lettuce: "🥬",
  cabbage: "🥬",
  kale: "🥬",
  celery: "🥬",
  asparagus: "🥬",
  mushroom: "🍄",
  broccoli: "🥦",
  cauliflower: "🥦",
  cucumber: "🥒",
  pickles: "🥒",
  zucchini: "🥒",
  courgette: "🥒",
  eggplant: "🍆",
  aubergine: "🍆",
  peas: "🫛",
  "green-beans": "🫛",
  ginger: "🫚",
  chili: "🌶️",
  corn: "🌽",
  sweetcorn: "🌽",
  pumpkin: "🎃",
  artichoke: "🌿",
  capers: "🫒",

  // ── Herbs & spices ───────────────────────────────────────────────────────
  parsley: "🌿",
  cilantro: "🌿",
  basil: "🌿",
  thyme: "🌿",
  oregano: "🌿",
  "oregano-dried": "🌿",
  rosemary: "🌿",
  mint: "🌿",
  "bay-leaf": "🌿",
  pesto: "🌿",
  salt: "🧂",
  "black-pepper": "🧂",
  cumin: "🌰",
  paprika: "🌶️",
  "curry-powder": "🍛",
  turmeric: "🟡",
  cinnamon: "🪵",
  "chili-flakes": "🌶️",
  "garlic-powder": "🧄",
  "onion-powder": "🧅",

  // ── Nuts & seeds ─────────────────────────────────────────────────────────
  nuts: "🥜",
  peanut: "🥜",
  peanuts: "🥜",
  almonds: "🥜",
  walnuts: "🥜",
  cashews: "🥜",
  pistachios: "🥜",
  hazelnuts: "🥜",
  seeds: "🌰",

  // ── Dairy & eggs ─────────────────────────────────────────────────────────
  milk: "🥛",
  "oat-milk": "🥛",
  "almond-milk": "🥛",
  "soy-milk": "🥛",
  kefir: "🥛",
  cream: "🥛",
  "sour-cream": "🥛",
  yogurt: "🥛",
  butter: "🧈",
  eggs: "🥚",
  cheese: "🧀",
  mozzarella: "🧀",
  parmesan: "🧀",
  feta: "🧀",
  ricotta: "🧀",
  mascarpone: "🧀",
  "cottage-cheese": "🧀",
  cheddar: "🧀",
  gouda: "🧀",
  brie: "🧀",
  "cream-cheese": "🧀",

  // ── Meat & fish ──────────────────────────────────────────────────────────
  chicken: "🍗",
  turkey: "🦃",
  duck: "🦆",
  nuggets: "🍗",
  beef: "🥩",
  veal: "🥩",
  lamb: "🥩",
  steak: "🥩",
  mince: "🥩",
  "ground-beef": "🥩",
  meatballs: "🧆",
  pork: "🥓",
  bacon: "🥓",
  pancetta: "🥓",
  ham: "🍖",
  sausage: "🌭",
  salami: "🥓",
  prosciutto: "🥓",
  pepperoni: "🍕",
  mortadella: "🥓",
  fish: "🐟",
  salmon: "🐟",
  tuna: "🐟",
  anchovies: "🐟",
  cod: "🐟",
  sardines: "🐟",
  mackerel: "🐟",
  trout: "🐟",
  shrimp: "🦐",
  prawns: "🦐",
  crab: "🦀",
  mussels: "🦪",
  clams: "🦪",
  squid: "🦑",
  tofu: "🧆",
  tempeh: "🧆",

  // ── Grains, pasta & bakery ───────────────────────────────────────────────
  pasta: "🍝",
  spaghetti: "🍝",
  tortelloni: "🥟",
  lasagne: "🍝",
  lasagna: "🍝",
  noodles: "🍜",
  gnocchi: "🥟",
  ravioli: "🥟",
  tortellini: "🥟",
  rice: "🍚",
  quinoa: "🌾",
  couscous: "🌾",
  oats: "🌾",
  granola: "🥣",
  muesli: "🥣",
  cereal: "🥣",
  flour: "🌾",
  bread: "🍞",
  breadcrumbs: "🍞",
  baguette: "🥖",
  pitta: "🫓",
  roll: "🥖",
  croissant: "🥐",
  brioche: "🥐",
  bun: "🥯",
  bagel: "🥯",
  pita: "🫓",
  tortilla: "🫓",
  muffin: "🧁",
  pancakes: "🥞",
  waffles: "🧇",

  // ── Legumes & tinned ─────────────────────────────────────────────────────
  beans: "🫘",
  chickpeas: "🫘",
  lentils: "🫘",
  hummus: "🫘",
  tahini: "🫘",
  "canned-tomatoes": "🥫",
  "tomato-paste": "🥫",
  "tomato-sauce": "🥫",
  passata: "🥫",
  "coconut-milk": "🥥",
  olives: "🫒",
  guacamole: "🥑",

  // ── Oils, sauces & condiments ────────────────────────────────────────────
  "olive-oil": "🫒",
  "vegetable-oil": "🫗",
  "sesame-oil": "🫗",
  "soy-sauce": "🍶",
  "fish-sauce": "🐟",
  vinegar: "🍶",
  "balsamic-vinegar": "🍶",
  "rice-vinegar": "🍶",
  "worcestershire-sauce": "🍶",
  mustard: "🌭",
  ketchup: "🍅",
  mayonnaise: "🥚",
  salsa: "🍅",
  "hot-sauce": "🌶️",
  sriracha: "🌶️",
  honey: "🍯",
  syrup: "🍯",
  "maple-syrup": "🍁",
  molasses: "🍯",
  jam: "🍓",
  marmalade: "🍊",
  "peanut-butter": "🥜",
  stock: "🍲",
  broth: "🍲",
  bouillon: "🍲",

  // ── Baking ───────────────────────────────────────────────────────────────
  sugar: "🍬",
  "brown-sugar": "🍬",
  "icing-sugar": "🍬",
  "powdered-sugar": "🍬",
  "baking-powder": "🥣",
  "baking-soda": "🥣",
  yeast: "🍞",
  vanilla: "🍦",
  cocoa: "🍫",
  "cocoa-powder": "🍫",
  chocolate: "🍫",
  sprinkles: "🍩",
  gelatin: "🍮",

  // ── Drinks ───────────────────────────────────────────────────────────────
  water: "💧",
  "sparkling-water": "💧",
  "mineral-water": "💧",
  juice: "🧃",
  "orange-juice": "🧃",
  "apple-juice": "🧃",
  lemonade: "🍋",
  coffee: "☕",
  espresso: "☕",
  cappuccino: "☕",
  "hot-chocolate": "☕",
  tea: "🍵",
  chamomile: "🌼",
  "iced-tea": "🧋",
  soda: "🥤",
  cola: "🥤",
  "energy-drink": "🥤",
  smoothie: "🥤",
  milkshake: "🥤",
  wine: "🍷",
  prosecco: "🍾",
  champagne: "🍾",
  beer: "🍺",
  cider: "🍺",
  lager: "🍺",
  whiskey: "🥃",
  whisky: "🥃",
  rum: "🥃",
  vodka: "🍸",
  gin: "🍸",

  // ── Sweets, snacks & fast food ───────────────────────────────────────────
  "ice-cream": "🍦",
  gelato: "🍨",
  pudding: "🍮",
  "chocolate-bar": "🍫",
  "chocolate-spread": "🍫",
  nutella: "🍫",
  biscuits: "🍪",
  biscuit: "🍪",
  cookie: "🍪",
  cookies: "🍪",
  brownie: "🍫",
  sweets: "🍬",
  marshmallows: "🍬",
  lollipop: "🍭",
  cake: "🍰",
  cupcake: "🧁",
  pie: "🥧",
  tart: "🥧",
  donut: "🍩",
  doughnut: "🍩",
  crisps: "🍟",
  chips: "🍟",
  fries: "🍟",
  crackers: "🍘",
  popcorn: "🍿",
  pretzels: "🥨",
  nachos: "🧀",
  pizza: "🍕",
  burger: "🍔",
  hamburger: "🍔",
  hotdog: "🌭",
  "hot-dog": "🌭",
  taco: "🌮",
  burrito: "🌯",
  sushi: "🍣",
  ice: "🧊",

  // ── Italian words with no curated concept (see src/lib/data.ts) ──────────
  // Everything else typed in Italian resolves to its English concept id in
  // `categorizeIngredient()` (via the concept's `aliases`) before it ever
  // reaches this map — these three have no matching concept yet, so they're
  // the only Italian entries left here.
  torta: "🍰",
  panino: "🥪",
  insalata: "🥗",
};

const categoryEmoji: Record<Category, string> = {
  fruit: "🍎",
  vegetables: "🥕",
  dairy: "🥛",
  "meat-fish": "🍖",
  pantry: "🥫",
  "sauces-condiments": "🫙",
  "spices-herbs": "🌿",
  baking: "🧁",
  drinks: "🥤",
  "breakfast-snacks": "🥐",
  snacks: "🍿",
  other: "🛒",
};

/**
 * OpenMoji color SVGs (vendored under `public/icons/openmoji/`) are named by
 * their emoji's Unicode codepoints, stripped of the U+FE0F variation
 * selector. Deriving the filename from the glyph itself means every emoji
 * `foodEmoji`/`categoryEmoji` can produce — including the "🛒" catch-all —
 * automatically has an OpenMoji equivalent, no separate lookup table needed.
 */
function openmojiFilename(emoji: string): string {
  const codepoints: string[] = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === undefined || cp === 0xfe0f) continue;
    codepoints.push(cp.toString(16).toUpperCase());
  }
  return codepoints.join("-");
}

/**
 * Resolves what to actually render for a non-"emoji" style. OpenMoji always
 * finds a file (its filename is derived from whatever emoji `foodEmoji`/
 * `categoryEmoji` would show, so it inherits that same fallback chain — never
 * the emoji glyph itself). foodiconpack falls back to a same-style,
 * per-category outline icon when the concept isn't in its free set, and to a
 * neutral outline glyph — never a color emoji — when even that's missing
 * (only the "other" category today).
 */
function styledIcon(
  style: "openmoji" | "foodiconpack",
  iconKey: string,
  category: Category,
  emoji: string,
): { src: string } | { neutral: true } {
  if (style === "openmoji") return { src: `/icons/openmoji/${openmojiFilename(emoji)}.svg` };
  const path = foodiconpackIndex[iconKey] ?? foodiconpackCategoryFallback[category];
  return path ? { src: `/icons/foodiconpack/${path}.svg` } : { neutral: true };
}

export function FoodIcon({
  iconKey,
  category,
  size = 40,
  variant = "chip",
}: {
  iconKey: string;
  category: Category;
  size?: number;
  variant?: "chip" | "bare";
}) {
  const meta = categoryMeta[category];
  const { iconStyle } = useIconStyle();
  const emoji = foodEmoji[iconKey] ?? categoryEmoji[category] ?? "🛒";

  let glyph: ReactNode;
  if (iconStyle === "emoji") {
    glyph = (
      <span aria-hidden style={{ lineHeight: 1 }}>
        {emoji}
      </span>
    );
  } else {
    const resolved = styledIcon(iconStyle, iconKey, category, emoji);
    glyph =
      "src" in resolved ? (
        <img
          src={resolved.src}
          alt=""
          aria-hidden
          style={{ width: "78%", height: "78%", objectFit: "contain" }}
        />
      ) : (
        <UtensilsCrossed aria-hidden size={Math.round(size * 0.5)} color={meta.color} strokeWidth={1.75} />
      );
  }

  if (variant === "bare") {
    return (
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: Math.round(size * 0.9),
          height: Math.round(size * 0.9),
          fontSize: Math.round(size * 0.9),
        }}
      >
        {glyph}
      </span>
    );
  }

  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: meta.bg,
        fontSize: Math.round(size * 0.56),
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {glyph}
    </span>
  );
}
