export type Category =
  | "fruit"
  | "vegetables"
  | "dairy"
  | "meat-fish"
  | "pantry"
  | "sauces-condiments"
  | "spices-herbs"
  | "baking"
  | "drinks"
  | "breakfast-snacks"
  | "snacks"
  | "other";

export type Unit =
  | "piece"
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "cup"
  | "tbsp"
  | "tsp"
  | "pack"
  | "bunch"
  | "can"
  | "bottle";

export interface IngredientConcept {
  id: string;
  displayName: string;
  category: Category;
  iconKey: string;
  aliases: string[];
}

export interface InventoryItem {
  id: string;
  conceptId: string;
  displayName: string;
  quantity: number;
  unit: Unit;
  category: Category;
  expiry?: string;
  notes?: string;
  status: "active" | "consumed";
  addedAt: string;
}

export interface ShoppingItem {
  id: string;
  conceptId: string;
  displayName: string;
  quantity: number;
  unit: Unit;
  category: Category;
  purchased: boolean;
  source: "manual" | "from-inventory" | "from-recipe";
  createdAt: string;
}

export interface RecipeIngredient {
  conceptId: string;
  displayName: string;
  quantity: number;
  unit: Unit;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  timeMinutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tags: string[];
}

export interface UserProfile {
  id: string;
  displayName: string;
  sharingEnabled: boolean;
  requestsEnabled: boolean;
  inventoryVisible: boolean;
}

export interface Community {
  id: string;
  name: string;
  code: string;
}

export interface ShareRequest {
  id: string;
  requesterId: string;
  ownerId: string;
  conceptId: string;
  displayName: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  message?: string;
  createdAt: string;
}

export interface AICategorizationResult {
  conceptId: string;
  displayName: string;
  category: Category;
  iconKey: string;
  confidence: number;
}

export interface RecipeMatch {
  recipe: Recipe;
  haveCount: number;
  missingCount: number;
  optionalCount: number;
  coverage: number;
  missing: RecipeIngredient[];
  have: RecipeIngredient[];
}
