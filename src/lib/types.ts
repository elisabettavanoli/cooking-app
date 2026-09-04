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
  /** Untracked by default — set only where the user typed one in explicitly. */
  quantity: number | null;
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
  /** Untracked by default — the list never shows or asks for it. */
  quantity: number | null;
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
  /** Expose your active pantry to co-members of the communities you joined. */
  shareWithCommunities: boolean;
  /** Put your kitchen on the public map (coarse location) for any signed-in user. */
  shareOnMap: boolean;
  /** Others may raise a request to borrow one of your items. */
  requestsEnabled: boolean;
  /** Coarse latitude (~2 dp), set only while shareOnMap is on. */
  latitude: number | null;
  longitude: number | null;
}

export interface Community {
  id: string;
  name: string;
  code: string;
  memberCount?: number;
  createdBy?: string | null;
}

/** A pantry item a co-member shares, as returned by the cross-community search. */
export interface CommunityItemHit {
  ownerId: string;
  ownerName: string;
  communityId: string;
  communityName: string;
  conceptId: string;
  displayName: string;
  category: Category;
  quantity: number | null;
  unit: Unit;
}

/** A public kitchen shown as a pin on the nearby map. */
export interface NearbyKitchen {
  ownerId: string;
  ownerName: string;
  latitude: number;
  longitude: number;
  itemCount: number;
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
