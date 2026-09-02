import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getItem, setItem, requestPersistentStorage } from "./storage";
import type { InventoryItem, Recipe, ShoppingItem, UserProfile } from "./types";
import { initialInventorySeed, recipeCatalog, findConceptById } from "./data";

interface StoreState {
  inventory: InventoryItem[];
  shoppingList: ShoppingItem[];
  recipes: Recipe[];
  selectedConcepts: string[];
  profile: UserProfile;
}

interface StoreActions {
  addInventoryItem: (item: Omit<InventoryItem, "id" | "addedAt" | "status">) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  removeInventoryItem: (id: string) => void;
  markInventoryItemConsumed: (id: string) => void;
  addShoppingItem: (item: Omit<ShoppingItem, "id" | "createdAt" | "purchased">) => void;
  updateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => void;
  removeShoppingItem: (id: string) => void;
  markShoppingItemPurchased: (id: string, purchased: boolean) => void;
  moveShoppingItemToInventory: (id: string) => void;
  toggleSelectedConcept: (conceptId: string) => void;
  clearSelectedConcepts: () => void;
  addRecipe: (recipe: Recipe) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetData: () => void;
}

type PantryValue = StoreState & StoreActions & { hydrated: boolean };

const PantryContext = createContext<PantryValue | null>(null);

const STORAGE_KEY = "pantry-store-v1";

let idCounter = 0;
function makeId(): string {
  idCounter += 1;
  return `id-${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildDefaultState(): StoreState {
  const now = new Date().toISOString();
  const inventory: InventoryItem[] = initialInventorySeed.map((seed) => {
    const concept = findConceptById(seed.conceptId)!;
    return {
      id: makeId(),
      conceptId: seed.conceptId,
      displayName: concept.displayName,
      quantity: seed.quantity,
      unit: seed.unit,
      category: concept.category,
      isShareable: seed.isShareable,
      status: "active" as const,
      addedAt: now,
    };
  });
  return {
    inventory,
    shoppingList: [],
    recipes: [...recipeCatalog],
    selectedConcepts: [],
    profile: {
      id: "local",
      displayName: "You",
      sharingEnabled: false,
      requestsEnabled: false,
      inventoryVisible: false,
    },
  };
}

function mergeState(parsed: Partial<StoreState>): StoreState {
  const defaults = buildDefaultState();
  return {
    inventory: parsed.inventory ?? defaults.inventory,
    shoppingList: parsed.shoppingList ?? defaults.shoppingList,
    recipes: parsed.recipes && parsed.recipes.length > 0 ? parsed.recipes : defaults.recipes,
    selectedConcepts: parsed.selectedConcepts ?? defaults.selectedConcepts,
    profile: { ...defaults.profile, ...(parsed.profile ?? {}) },
  };
}

export function PantryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(buildDefaultState);
  const [hydrated, setHydrated] = useState(false);
  const skipPersist = useRef(true);

  useEffect(() => {
    let cancelled = false;
    getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            setState(mergeState(JSON.parse(raw) as Partial<StoreState>));
          } catch {
            // ignore corrupt payload, keep defaults
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHydrated(true);
          requestPersistentStorage();
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const setInventory = useCallback((fn: (prev: InventoryItem[]) => InventoryItem[]) => {
    setState((prev) => ({ ...prev, inventory: fn(prev.inventory) }));
  }, []);

  const setShoppingList = useCallback((fn: (prev: ShoppingItem[]) => ShoppingItem[]) => {
    setState((prev) => ({ ...prev, shoppingList: fn(prev.shoppingList) }));
  }, []);

  const addInventoryItem = useCallback(
    (item: Omit<InventoryItem, "id" | "addedAt" | "status">) => {
      const newItem: InventoryItem = {
        ...item,
        id: makeId(),
        status: "active",
        addedAt: new Date().toISOString(),
      };
      setInventory((prev) => [newItem, ...prev]);
    },
    [setInventory],
  );

  const updateInventoryItem = useCallback(
    (id: string, updates: Partial<InventoryItem>) => {
      setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    },
    [setInventory],
  );

  const removeInventoryItem = useCallback(
    (id: string) => {
      setInventory((prev) => prev.filter((i) => i.id !== id));
    },
    [setInventory],
  );

  const markInventoryItemConsumed = useCallback(
    (id: string) => {
      setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, status: "consumed" } : i)));
    },
    [setInventory],
  );

  const addShoppingItem = useCallback(
    (item: Omit<ShoppingItem, "id" | "createdAt" | "purchased">) => {
      const newItem: ShoppingItem = {
        ...item,
        id: makeId(),
        purchased: false,
        createdAt: new Date().toISOString(),
      };
      setShoppingList((prev) => [newItem, ...prev]);
    },
    [setShoppingList],
  );

  const updateShoppingItem = useCallback(
    (id: string, updates: Partial<ShoppingItem>) => {
      setShoppingList((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    },
    [setShoppingList],
  );

  const removeShoppingItem = useCallback(
    (id: string) => {
      setShoppingList((prev) => prev.filter((i) => i.id !== id));
    },
    [setShoppingList],
  );

  const moveShoppingItemToInventory = useCallback(
    (id: string) => {
      setState((prev) => {
        const item = prev.shoppingList.find((i) => i.id === id);
        if (!item) return prev;
        const concept = findConceptById(item.conceptId);
        const now = new Date().toISOString();
        const category = concept?.category ?? item.category;

        const existing = prev.inventory.find(
          (i) => i.conceptId === item.conceptId && i.unit === item.unit && i.status === "active",
        );
        const inventory = existing
          ? prev.inventory.map((i) =>
              i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i,
            )
          : [
              {
                id: makeId(),
                conceptId: item.conceptId,
                displayName: concept?.displayName ?? item.displayName,
                quantity: item.quantity,
                unit: item.unit,
                category,
                isShareable: false,
                status: "active" as const,
                addedAt: now,
              },
              ...prev.inventory,
            ];

        return {
          ...prev,
          inventory,
          shoppingList: prev.shoppingList.map((i) =>
            i.id === id ? { ...i, purchased: true } : i,
          ),
        };
      });
    },
    [],
  );

  const markShoppingItemPurchased = useCallback(
    (id: string, purchased: boolean) => {
      if (purchased) {
        moveShoppingItemToInventory(id);
        return;
      }
      setShoppingList((prev) => prev.map((i) => (i.id === id ? { ...i, purchased: false } : i)));
    },
    [setShoppingList, moveShoppingItemToInventory],
  );

  const toggleSelectedConcept = useCallback((conceptId: string) => {
    setState((prev) => {
      const selected = new Set(prev.selectedConcepts);
      if (selected.has(conceptId)) selected.delete(conceptId);
      else selected.add(conceptId);
      return { ...prev, selectedConcepts: Array.from(selected) };
    });
  }, []);

  const clearSelectedConcepts = useCallback(() => {
    setState((prev) => ({ ...prev, selectedConcepts: [] }));
  }, []);

  const addRecipe = useCallback((recipe: Recipe) => {
    setState((prev) => ({ ...prev, recipes: [recipe, ...prev.recipes] }));
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...updates } }));
  }, []);

  const resetData = useCallback(() => {
    setState(buildDefaultState());
  }, []);

  const value: PantryValue = {
    ...state,
    hydrated,
    addInventoryItem,
    updateInventoryItem,
    removeInventoryItem,
    markInventoryItemConsumed,
    addShoppingItem,
    updateShoppingItem,
    removeShoppingItem,
    markShoppingItemPurchased,
    moveShoppingItemToInventory,
    toggleSelectedConcept,
    clearSelectedConcepts,
    addRecipe,
    updateProfile,
    resetData,
  };

  return <PantryContext.Provider value={value}>{children}</PantryContext.Provider>;
}

export function usePantry() {
  const ctx = useContext(PantryContext);
  if (!ctx) throw new Error("usePantry must be used within a PantryProvider");
  return ctx;
}

export function useActiveInventory(): InventoryItem[] {
  const { inventory } = usePantry();
  return inventory.filter((i) => i.status === "active");
}
