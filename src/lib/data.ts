import type { Category, IngredientConcept, Recipe, Unit } from "./types";

export const categoryMeta: Record<
  Category,
  { label: string; color: string; bg: string }
> = {
  // "Citrus Pop" palette — vivid category colours, each a distinct hue, on a
  // soft tint of the same colour.
  fruit: { label: "Fruit", color: "#F0384B", bg: "#FCDEE1" },
  vegetables: { label: "Vegetables", color: "#4FA300", bg: "#E7F4D4" },
  dairy: { label: "Dairy", color: "#2E7FD1", bg: "#DCEBFB" },
  "meat-fish": { label: "Meat & Fish", color: "#C2410C", bg: "#F8E3D5" },
  pantry: { label: "Pantry", color: "#C08A12", bg: "#F8EFCF" },
  "sauces-condiments": { label: "Sauces & Condiments", color: "#E0930C", bg: "#FBEBCC" },
  "spices-herbs": { label: "Spices & Herbs", color: "#1F9E55", bg: "#D8F3E1" },
  baking: { label: "Baking", color: "#A9663A", bg: "#F1E4D6" },
  drinks: { label: "Drinks", color: "#0E9AA8", bg: "#D2F0F3" },
  "breakfast-snacks": { label: "Breakfast & Treats", color: "#D6409F", bg: "#FBE1F1" },
  snacks: { label: "Savoury Snacks", color: "#7A5AF0", bg: "#E7E0FD" },
  other: { label: "Other", color: "#64748B", bg: "#E8EBEF" },
};

export const categories: Category[] = Object.keys(categoryMeta) as Category[];

export const units: Unit[] = [
  "piece",
  "g",
  "kg",
  "ml",
  "l",
  "cup",
  "tbsp",
  "tsp",
  "pack",
  "bunch",
  "can",
  "bottle",
];

const c = (
  id: string,
  displayName: string,
  category: Category,
  iconKey: string,
  aliases: string[] = [],
): IngredientConcept => ({
  id,
  displayName,
  category,
  iconKey,
  aliases: [displayName.toLowerCase(), ...aliases],
});

export const concepts: IngredientConcept[] = [
  // Fruit
  c("lemon", "Lemon", "fruit", "lemon", ["lemons"]),
  c("lime", "Lime", "fruit", "lime", ["limes"]),
  c("avocado", "Avocado", "fruit", "avocado", ["avocados"]),
  c("apple", "Apple", "fruit", "apple", ["apples"]),
  c("banana", "Banana", "fruit", "banana", ["bananas"]),
  c("orange", "Orange", "fruit", "orange", ["oranges"]),
  c("berries", "Berries", "fruit", "berries", ["strawberries", "blueberries", "raspberries"]),

  // Vegetables
  c("tomato", "Tomato", "vegetables", "tomato", ["tomatoes", "cherry tomato", "roma tomato"]),
  c("onion", "Onion", "vegetables", "onion", ["onions", "yellow onion", "red onion"]),
  c("garlic", "Garlic", "vegetables", "garlic", ["garlic cloves"]),
  c("carrot", "Carrot", "vegetables", "carrot", ["carrots"]),
  c("potato", "Potato", "vegetables", "potato", ["potatoes"]),
  c("bell-pepper", "Bell Pepper", "vegetables", "bell-pepper", ["pepper", "capsicum"]),
  c("spinach", "Spinach", "vegetables", "spinach", ["baby spinach"]),
  c("mushroom", "Mushroom", "vegetables", "mushroom", ["mushrooms"]),
  c("broccoli", "Broccoli", "vegetables", "broccoli", ["broccoli florets"]),
  c("cauliflower", "Cauliflower", "vegetables", "cauliflower", ["cauliflower florets"]),
  c("lettuce", "Lettuce", "vegetables", "lettuce", ["romaine", "mixed greens"]),
  c("cucumber", "Cucumber", "vegetables", "cucumber", ["cucumbers"]),
  c("zucchini", "Zucchini", "vegetables", "zucchini", ["courgette"]),
  c("eggplant", "Eggplant", "vegetables", "eggplant", ["aubergine"]),
  c("celery", "Celery", "vegetables", "celery"),
  c("peas", "Peas", "vegetables", "peas", ["green peas", "frozen peas"]),
  c("ginger", "Ginger", "vegetables", "ginger", ["fresh ginger"]),
  c("chili", "Chili", "vegetables", "chili", ["chilli", "chili pepper", "red chili"]),

  // Fresh & dried herbs
  c("parsley", "Parsley", "spices-herbs", "parsley", ["fresh parsley"]),
  c("cilantro", "Cilantro", "spices-herbs", "cilantro", ["coriander", "fresh coriander"]),
  c("basil", "Basil", "spices-herbs", "basil", ["fresh basil"]),
  c("thyme", "Thyme", "spices-herbs", "thyme", ["fresh thyme"]),
  c("oregano", "Oregano", "spices-herbs", "oregano", ["fresh oregano"]),
  c("rosemary", "Rosemary", "spices-herbs", "rosemary", ["fresh rosemary"]),
  c("mint", "Mint", "spices-herbs", "mint", ["fresh mint"]),

  // Dairy
  c("milk", "Milk", "dairy", "milk"),
  c("butter", "Butter", "dairy", "butter"),
  c("eggs", "Eggs", "dairy", "eggs", ["egg"]),
  c("yogurt", "Yogurt", "dairy", "yogurt", ["greek yogurt"]),
  c("cream", "Cream", "dairy", "cream", ["heavy cream", "whipping cream"]),
  c("cheese", "Cheese", "dairy", "cheese", ["cheddar", "gouda", "cheese block"]),
  c("mozzarella", "Mozzarella", "dairy", "mozzarella", ["fresh mozzarella"]),
  c("parmesan", "Parmesan", "dairy", "parmesan", ["parmigiano"]),
  c("feta", "Feta", "dairy", "feta"),

  // Meat & Fish
  c("chicken", "Chicken", "meat-fish", "chicken", ["chicken breast", "chicken thighs"]),
  c("beef", "Beef", "meat-fish", "beef", ["ground beef", "minced beef", "steak"]),
  c("pork", "Pork", "meat-fish", "pork", ["pork chops"]),
  c("bacon", "Bacon", "meat-fish", "bacon"),
  c("ham", "Ham", "meat-fish", "ham"),
  c("sausage", "Sausage", "meat-fish", "sausage", ["sausages"]),
  c("fish", "Fish", "meat-fish", "fish", ["white fish", "cod", "tilapia"]),
  c("salmon", "Salmon", "meat-fish", "salmon"),
  c("shrimp", "Shrimp", "meat-fish", "shrimp", ["prawns"]),
  c("tuna", "Tuna", "meat-fish", "tuna", ["canned tuna"]),

  // Pantry
  c("pasta", "Pasta", "pantry", "pasta", ["penne", "spaghetti", "fusilli", "macaroni"]),
  c("rice", "Rice", "pantry", "rice", ["white rice", "jasmine rice", "basmati rice"]),
  c("noodles", "Noodles", "pantry", "noodles", ["ramen noodles", "egg noodles"]),
  c("bread", "Bread", "pantry", "bread", ["loaf", "sliced bread"]),
  c("tortilla", "Tortilla", "pantry", "tortilla", ["tortillas", "wrap", "wraps"]),
  c("chickpeas", "Chickpeas", "pantry", "chickpeas", ["canned chickpeas"]),
  c("lentils", "Lentils", "pantry", "lentils", ["red lentils", "green lentils"]),
  c("beans", "Beans", "pantry", "beans", ["black beans", "kidney beans", "canned beans"]),
  c("coconut-milk", "Coconut Milk", "pantry", "coconut-milk", ["canned coconut milk"]),
  c("canned-tomatoes", "Canned Tomatoes", "pantry", "canned-tomatoes", ["tomato can"]),
  c("olives", "Olives", "pantry", "olives"),
  c("oats", "Oats", "pantry", "oats", ["rolled oats"]),
  c("nuts", "Nuts", "pantry", "nuts", ["almonds", "walnuts"]),

  // Sauces & Condiments
  c("olive-oil", "Olive Oil", "sauces-condiments", "olive-oil", ["extra virgin olive oil"]),
  c("vegetable-oil", "Vegetable Oil", "sauces-condiments", "vegetable-oil", ["canola oil", "sunflower oil"]),
  c("soy-sauce", "Soy Sauce", "sauces-condiments", "soy-sauce"),
  c("vinegar", "Vinegar", "sauces-condiments", "vinegar", ["white vinegar", "apple cider vinegar"]),
  c("balsamic-vinegar", "Balsamic Vinegar", "sauces-condiments", "balsamic-vinegar"),
  c("tomato-sauce", "Tomato Sauce", "sauces-condiments", "tomato-sauce", ["marinara", "passata"]),
  c("tomato-paste", "Tomato Paste", "sauces-condiments", "tomato-paste"),
  c("pesto", "Pesto", "sauces-condiments", "pesto", ["basil pesto"]),
  c("mustard", "Mustard", "sauces-condiments", "mustard", ["dijon mustard"]),
  c("ketchup", "Ketchup", "sauces-condiments", "ketchup"),
  c("mayonnaise", "Mayonnaise", "sauces-condiments", "mayonnaise"),
  c("honey", "Honey", "sauces-condiments", "honey"),
  c("jam", "Jam", "sauces-condiments", "jam", ["strawberry jam"]),
  c("peanut-butter", "Peanut Butter", "sauces-condiments", "peanut-butter"),
  c("sesame-oil", "Sesame Oil", "sauces-condiments", "sesame-oil"),
  c("fish-sauce", "Fish Sauce", "sauces-condiments", "fish-sauce"),
  c("rice-vinegar", "Rice Vinegar", "sauces-condiments", "rice-vinegar"),
  c("stock", "Stock", "sauces-condiments", "stock", ["broth", "chicken stock", "vegetable stock"]),
  c("salsa", "Salsa", "sauces-condiments", "salsa"),

  // Spices & Herbs
  c("salt", "Salt", "spices-herbs", "salt", ["sea salt", "kosher salt"]),
  c("black-pepper", "Black Pepper", "spices-herbs", "black-pepper", ["pepper"]),
  c("cumin", "Cumin", "spices-herbs", "cumin", ["cumin powder"]),
  c("paprika", "Paprika", "spices-herbs", "paprika", ["smoked paprika"]),
  c("curry-powder", "Curry Powder", "spices-herbs", "curry-powder"),
  c("turmeric", "Turmeric", "spices-herbs", "turmeric"),
  c("cinnamon", "Cinnamon", "spices-herbs", "cinnamon"),
  c("oregano-dried", "Dried Oregano", "spices-herbs", "oregano-dried"),
  c("chili-flakes", "Chili Flakes", "spices-herbs", "chili-flakes", ["red pepper flakes"]),
  c("garlic-powder", "Garlic Powder", "spices-herbs", "garlic-powder"),
  c("onion-powder", "Onion Powder", "spices-herbs", "onion-powder"),
  c("bay-leaf", "Bay Leaf", "spices-herbs", "bay-leaf", ["bay leaves"]),

  // Baking
  c("flour", "Flour", "baking", "flour", ["all-purpose flour"]),
  c("sugar", "Sugar", "baking", "sugar", ["white sugar", "granulated sugar"]),
  c("brown-sugar", "Brown Sugar", "baking", "brown-sugar"),
  c("baking-powder", "Baking Powder", "baking", "baking-powder"),
  c("baking-soda", "Baking Soda", "baking", "baking-soda"),
  c("vanilla", "Vanilla Extract", "baking", "vanilla"),
  c("chocolate", "Chocolate", "baking", "chocolate", ["chocolate chips"]),
  c("yeast", "Yeast", "baking", "yeast"),

  // Drinks
  c("water", "Water", "drinks", "water"),
  c("juice", "Juice", "drinks", "juice", ["orange juice", "apple juice"]),
  c("coffee", "Coffee", "drinks", "coffee"),
  c("tea", "Tea", "drinks", "tea"),
  c("wine", "Wine", "drinks", "wine", ["white wine", "red wine"]),
  c("beer", "Beer", "drinks", "beer"),
  c("soda", "Soda", "drinks", "soda", ["soft drink"]),

  // Breakfast & treats
  c("cereal", "Cereal", "breakfast-snacks", "cereal", ["breakfast cereal", "corn flakes"]),
  c("biscuits", "Biscuits", "breakfast-snacks", "biscuits", ["cookies", "digestives"]),
  c("chocolate-bar", "Chocolate Bar", "breakfast-snacks", "chocolate-bar", ["milk chocolate bar", "candy bar"]),
  c("ice-cream", "Ice Cream", "breakfast-snacks", "ice-cream", ["gelato"]),
  c("chocolate-spread", "Chocolate Spread", "breakfast-snacks", "chocolate-spread", ["nutella", "hazelnut spread"]),
  c("sweets", "Sweets", "breakfast-snacks", "sweets", ["candy", "gummies"]),

  // Savoury snacks
  c("crisps", "Crisps", "snacks", "crisps", ["potato chips", "chips"]),
  c("crackers", "Crackers", "snacks", "crackers", ["savoury crackers"]),
  c("popcorn", "Popcorn", "snacks", "popcorn"),
  c("pretzels", "Pretzels", "snacks", "pretzels"),

  // Pizza & ready meals
  c("pizza", "Pizza", "pantry", "pizza", ["frozen pizza"]),

  // Other
  c("ice", "Ice", "other", "ice"),
];

export const conceptsById = new Map(concepts.map((x) => [x.id, x]));

export function findConceptById(id: string): IngredientConcept | undefined {
  return conceptsById.get(id);
}

/** Exact match on display name or an alias — no substring fuzz. Safe in any language. */
export function findConceptByNameExact(name: string): IngredientConcept | undefined {
  const normalized = name.trim().toLowerCase();
  return (
    concepts.find((x) => x.displayName.toLowerCase() === normalized) ??
    concepts.find((x) => x.aliases.includes(normalized))
  );
}

export function findConceptByName(name: string): IngredientConcept | undefined {
  const normalized = name.trim().toLowerCase();
  return (
    findConceptByNameExact(name) ??
    concepts.find((x) =>
      x.aliases.some((a) => a.includes(normalized) || normalized.includes(a)),
    )
  );
}

export function categoryLabel(category: Category): string {
  return categoryMeta[category].label;
}

const u = (id: string, n: number, unit: Unit, optional = false) => ({
  conceptId: id,
  displayName: findConceptById(id)?.displayName ?? id,
  quantity: n,
  unit,
  optional,
});

export const recipeCatalog: Recipe[] = [
  {
    id: "pasta-tomato-sauce",
    name: "Pasta with Tomato Sauce",
    description: "A quick, comforting classic that only needs a few pantry staples.",
    timeMinutes: 20,
    servings: 2,
    tags: ["quick", "vegetarian", "pantry"],
    ingredients: [u("pasta", 250, "g"), u("tomato-sauce", 400, "g"), u("garlic", 2, "piece"), u("olive-oil", 2, "tbsp"), u("basil", 10, "g"), u("parmesan", 30, "g", true)],
    instructions: ["Boil salted water and cook pasta until al dente.", "Warm olive oil in a pan, add minced garlic and cook for 30 seconds.", "Add tomato sauce and simmer for 10 minutes.", "Toss pasta with sauce, top with basil and parmesan if available."],
  },
  {
    id: "caprese-salad",
    name: "Caprese Salad",
    description: "Fresh tomatoes and mozzarella with basil and a drizzle of oil.",
    timeMinutes: 10,
    servings: 2,
    tags: ["no-cook", "vegetarian", "summer"],
    ingredients: [u("tomato", 2, "piece"), u("mozzarella", 200, "g"), u("basil", 10, "g"), u("olive-oil", 1, "tbsp"), u("balsamic-vinegar", 1, "tbsp", true)],
    instructions: ["Slice tomatoes and mozzarella.", "Layer them on a plate with basil leaves.", "Drizzle olive oil and balsamic vinegar if available.", "Sprinkle with salt and pepper."],
  },
  {
    id: "simple-omelette",
    name: "Simple Omelette",
    description: "A fluffy omelette you can fill with whatever you have.",
    timeMinutes: 10,
    servings: 1,
    tags: ["quick", "breakfast", "vegetarian"],
    ingredients: [u("eggs", 3, "piece"), u("milk", 2, "tbsp"), u("butter", 10, "g"), u("salt", 1, "tsp"), u("black-pepper", 1, "tsp", true)],
    instructions: ["Whisk eggs with milk, salt, and pepper.", "Melt butter in a non-stick pan over medium heat.", "Pour in eggs, let set briefly, then fold and serve."],
  },
  {
    id: "chicken-stir-fry",
    name: "Chicken Stir Fry",
    description: "Fast chicken and vegetables with a savory soy sauce glaze.",
    timeMinutes: 25,
    servings: 2,
    tags: ["quick", "asian", "dinner"],
    ingredients: [u("chicken", 250, "g"), u("rice", 150, "g"), u("soy-sauce", 2, "tbsp"), u("bell-pepper", 1, "piece"), u("onion", 1, "piece"), u("garlic", 2, "piece"), u("ginger", 15, "g", true), u("sesame-oil", 1, "tbsp", true)],
    instructions: ["Cook rice according to package instructions.", "Cut chicken and vegetables into bite-sized pieces.", "Stir-fry chicken in a hot pan until cooked through, then remove.", "Stir-fry vegetables, add garlic and ginger, return chicken to pan.", "Add soy sauce and sesame oil, toss with rice."],
  },
  {
    id: "fried-rice",
    name: "Fried Rice",
    description: "The best way to use leftover rice and random bits from the kitchen.",
    timeMinutes: 20,
    servings: 2,
    tags: ["quick", "leftover-friendly", "asian"],
    ingredients: [u("rice", 300, "g"), u("eggs", 2, "piece"), u("soy-sauce", 2, "tbsp"), u("onion", 1, "piece"), u("carrot", 1, "piece"), u("peas", 80, "g"), u("garlic", 2, "piece"), u("vegetable-oil", 1, "tbsp")],
    instructions: ["Heat oil in a pan, scramble eggs and remove.", "Sauté onion, garlic, carrot and peas until softened.", "Add cold rice and soy sauce, stir-fry over high heat.", "Mix in scrambled eggs and serve."],
  },
  {
    id: "chicken-curry",
    name: "Chicken Curry",
    description: "A cozy coconut curry with tender chicken and aromatic spices.",
    timeMinutes: 40,
    servings: 3,
    tags: ["comfort", "dinner", "spicy"],
    ingredients: [u("chicken", 400, "g"), u("rice", 150, "g"), u("onion", 1, "piece"), u("garlic", 3, "piece"), u("ginger", 20, "g"), u("coconut-milk", 400, "ml"), u("curry-powder", 2, "tbsp"), u("tomato", 2, "piece"), u("cilantro", 10, "g", true)],
    instructions: ["Sauté chopped onion, garlic, and ginger until soft.", "Add curry powder and cook for 1 minute.", "Add chicken and cook until no longer pink.", "Pour in coconut milk and tomatoes, simmer 20 minutes.", "Serve over rice, garnished with cilantro if available."],
  },
  {
    id: "tomato-soup",
    name: "Tomato Soup",
    description: "Creamy tomato soup with garlic and basil.",
    timeMinutes: 30,
    servings: 3,
    tags: ["comfort", "vegetarian", "quick"],
    ingredients: [u("tomato", 800, "g"), u("onion", 1, "piece"), u("garlic", 2, "piece"), u("stock", 500, "ml"), u("cream", 100, "ml", true), u("basil", 10, "g"), u("olive-oil", 1, "tbsp")],
    instructions: ["Sauté onion and garlic in olive oil.", "Add tomatoes and stock, simmer 20 minutes.", "Blend until smooth.", "Stir in cream if available, garnish with basil."],
  },
  {
    id: "greek-salad",
    name: "Greek Salad",
    description: "Crisp cucumber, tomato, and feta with olives and olive oil.",
    timeMinutes: 10,
    servings: 2,
    tags: ["no-cook", "vegetarian", "fresh"],
    ingredients: [u("cucumber", 1, "piece"), u("tomato", 2, "piece"), u("feta", 150, "g"), u("olives", 80, "g"), u("onion", 0.5, "piece"), u("olive-oil", 1, "tbsp"), u("oregano-dried", 1, "tsp", true)],
    instructions: ["Chop cucumber, tomato, and onion.", "Combine in a bowl with olives and feta.", "Drizzle olive oil and sprinkle oregano."],
  },
  {
    id: "carbonara",
    name: "Carbonara",
    description: "Creamy pasta with eggs, bacon, and parmesan.",
    timeMinutes: 25,
    servings: 2,
    tags: ["italian", "comfort", "quick"],
    ingredients: [u("pasta", 250, "g"), u("eggs", 2, "piece"), u("bacon", 150, "g"), u("parmesan", 50, "g"), u("black-pepper", 1, "tsp"), u("garlic", 1, "piece", true)],
    instructions: ["Cook pasta in salted water.", "Crisp bacon in a pan, add garlic if using.", "Whisk eggs with grated parmesan and pepper.", "Toss hot pasta with bacon and egg mixture off the heat."],
  },
  {
    id: "aglio-e-olio",
    name: "Spaghetti Aglio e Olio",
    description: "Garlic, olive oil, chili, and parsley over pasta.",
    timeMinutes: 20,
    servings: 2,
    tags: ["italian", "vegetarian", "pantry"],
    ingredients: [u("pasta", 250, "g"), u("garlic", 4, "piece"), u("olive-oil", 4, "tbsp"), u("chili-flakes", 0.5, "tsp"), u("parsley", 10, "g"), u("parmesan", 30, "g", true)],
    instructions: ["Cook pasta until al dente.", "Slowly cook sliced garlic in olive oil until golden.", "Add chili flakes and pasta water.", "Toss pasta with sauce and parsley."],
  },
  {
    id: "mushroom-risotto",
    name: "Mushroom Risotto",
    description: "Creamy rice with mushrooms and parmesan.",
    timeMinutes: 35,
    servings: 2,
    tags: ["comfort", "italian", "vegetarian"],
    ingredients: [u("rice", 200, "g"), u("mushroom", 200, "g"), u("onion", 1, "piece"), u("garlic", 2, "piece"), u("stock", 800, "ml"), u("parmesan", 50, "g"), u("wine", 100, "ml", true), u("butter", 20, "g")],
    instructions: ["Sauté mushrooms until browned, remove.", "Sauté onion and garlic, add rice and toast 2 minutes.", "Add wine if using, then stock ladle by ladle.", "Stir in mushrooms, butter and parmesan."],
  },
  {
    id: "simple-tacos",
    name: "Simple Tacos",
    description: "Crispy tortillas filled with seasoned beef and fresh toppings.",
    timeMinutes: 25,
    servings: 2,
    tags: ["mexican", "quick", "dinner"],
    ingredients: [u("tortilla", 4, "piece"), u("beef", 250, "g"), u("onion", 0.5, "piece"), u("tomato", 1, "piece"), u("lettuce", 50, "g"), u("cheese", 50, "g"), u("salsa", 4, "tbsp", true), u("cumin", 1, "tsp")],
    instructions: ["Brown beef with onion and cumin.", "Warm tortillas in a dry pan.", "Fill tortillas with beef, lettuce, tomato, cheese and salsa."],
  },
  {
    id: "shakshuka",
    name: "Shakshuka",
    description: "Eggs poached in a spiced tomato and pepper sauce.",
    timeMinutes: 30,
    servings: 2,
    tags: ["breakfast", "vegetarian", "comfort"],
    ingredients: [u("eggs", 4, "piece"), u("tomato", 400, "g"), u("bell-pepper", 1, "piece"), u("onion", 1, "piece"), u("cumin", 1, "tsp"), u("paprika", 1, "tsp"), u("garlic", 2, "piece"), u("olive-oil", 1, "tbsp"), u("cilantro", 10, "g", true)],
    instructions: ["Sauté onion, pepper, and garlic in olive oil.", "Add spices and tomatoes, simmer 15 minutes.", "Make wells and crack eggs into the sauce.", "Cover and cook until eggs are set."],
  },
  {
    id: "pancakes",
    name: "Classic Pancakes",
    description: "Fluffy pancakes for a slow morning.",
    timeMinutes: 25,
    servings: 2,
    tags: ["breakfast", "sweet", "comfort"],
    ingredients: [u("flour", 150, "g"), u("milk", 200, "ml"), u("eggs", 1, "piece"), u("butter", 20, "g"), u("sugar", 1, "tbsp"), u("baking-powder", 1, "tsp"), u("salt", 0.25, "tsp"), u("honey", 2, "tbsp", true)],
    instructions: ["Mix flour, sugar, baking powder and salt.", "Whisk in milk, egg and melted butter.", "Cook spoonfuls on a buttered pan until bubbles form.", "Flip and cook until golden."],
  },
  {
    id: "banana-smoothie",
    name: "Banana Smoothie",
    description: "Creamy banana smoothie with yogurt and honey.",
    timeMinutes: 5,
    servings: 1,
    tags: ["quick", "breakfast", "healthy"],
    ingredients: [u("banana", 1, "piece"), u("milk", 200, "ml"), u("yogurt", 100, "g"), u("honey", 1, "tbsp"), u("oats", 20, "g", true)],
    instructions: ["Blend all ingredients until smooth.", "Add ice if desired."],
  },
  {
    id: "avocado-toast",
    name: "Avocado Toast",
    description: "Crispy toast topped with creamy avocado and lemon.",
    timeMinutes: 10,
    servings: 1,
    tags: ["quick", "breakfast", "vegetarian"],
    ingredients: [u("bread", 2, "piece"), u("avocado", 1, "piece"), u("lemon", 0.5, "piece"), u("salt", 0.5, "tsp"), u("black-pepper", 0.5, "tsp"), u("chili-flakes", 0.5, "tsp", true)],
    instructions: ["Toast bread until golden.", "Mash avocado with lemon juice, salt and pepper.", "Spread on toast and add chili flakes if available."],
  },
  {
    id: "chicken-noodle-soup",
    name: "Chicken Noodle Soup",
    description: "Comforting soup with chicken, noodles, and vegetables.",
    timeMinutes: 35,
    servings: 3,
    tags: ["comfort", "soup", "healthy"],
    ingredients: [u("chicken", 250, "g"), u("noodles", 150, "g"), u("carrot", 2, "piece"), u("onion", 1, "piece"), u("celery", 2, "piece"), u("stock", 800, "ml"), u("garlic", 2, "piece"), u("parsley", 10, "g", true)],
    instructions: ["Sauté onion, garlic, carrot, and celery.", "Add stock and chicken, simmer 20 minutes.", "Add noodles and cook until tender.", "Garnish with parsley if available."],
  },
  {
    id: "pasta-salad",
    name: "Simple Pasta Salad",
    description: "Cold pasta salad with fresh vegetables and mozzarella.",
    timeMinutes: 20,
    servings: 2,
    tags: ["no-cook", "vegetarian", "summer"],
    ingredients: [u("pasta", 250, "g"), u("tomato", 2, "piece"), u("cucumber", 1, "piece"), u("mozzarella", 150, "g"), u("olive-oil", 2, "tbsp"), u("basil", 10, "g"), u("balsamic-vinegar", 1, "tbsp", true)],
    instructions: ["Cook pasta, cool under running water.", "Chop tomato, cucumber, and mozzarella.", "Toss with olive oil, basil, and vinegar if available."],
  },
  {
    id: "rice-beans",
    name: "Rice and Beans",
    description: "Hearty, budget-friendly rice and beans with cumin and tomato.",
    timeMinutes: 25,
    servings: 2,
    tags: ["budget", "vegetarian", "pantry"],
    ingredients: [u("rice", 150, "g"), u("beans", 400, "g"), u("onion", 1, "piece"), u("garlic", 2, "piece"), u("cumin", 1, "tsp"), u("tomato", 2, "piece"), u("olive-oil", 1, "tbsp"), u("cilantro", 10, "g", true)],
    instructions: ["Cook rice.", "Sauté onion and garlic, add cumin, tomatoes, and beans.", "Simmer 10 minutes.", "Serve beans over rice with cilantro."],
  },
  {
    id: "chickpea-spinach-curry",
    name: "Chickpea & Spinach Curry",
    description: "A quick vegetarian curry with chickpeas and spinach.",
    timeMinutes: 25,
    servings: 2,
    tags: ["vegetarian", "quick", "spicy"],
    ingredients: [u("chickpeas", 400, "g"), u("spinach", 150, "g"), u("onion", 1, "piece"), u("garlic", 2, "piece"), u("ginger", 15, "g"), u("curry-powder", 1, "tbsp"), u("coconut-milk", 200, "ml", true), u("rice", 150, "g", true)],
    instructions: ["Sauté onion, garlic, and ginger.", "Add curry powder and chickpeas.", "Add coconut milk if available, simmer 10 minutes.", "Stir in spinach until wilted, serve with rice."],
  },
];

/**
 * New accounts / fresh installs start with an empty kitchen — no demo items.
 * Kept as an (empty) export so callers and tests have a stable shape to import.
 */
export const initialInventorySeed: { conceptId: string; quantity: number; unit: Unit }[] = [];
