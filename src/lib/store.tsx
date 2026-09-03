import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getItem, setItem, requestPersistentStorage } from "./storage";
import type { InventoryItem, Recipe, ShoppingItem, UserProfile } from "./types";
import { initialInventorySeed, recipeCatalog, findConceptById } from "./data";
import { supabase, supabaseConfigured } from "./supabase";
import { useAuth } from "./auth";
import * as remote from "./remote";

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

type CookingValue = StoreState & StoreActions & { hydrated: boolean };

const CookingContext = createContext<CookingValue | null>(null);

const STORAGE_KEY = "cooking-store-v1"; // local mode: the whole state blob
const RECIPES_KEY = "cooking-recipes-v1"; // remote mode: recipes stay on-device

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─────────────────────────────────────────────────────────────
// Local mode — everything in one IndexedDB blob (offline-first, no account).
// ─────────────────────────────────────────────────────────────
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

function LocalCookingProvider({ children }: { children: React.ReactNode }) {
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

  const moveShoppingItemToInventory = useCallback((id: string) => {
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
  }, []);

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

  const value: CookingValue = {
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

  return <CookingContext.Provider value={value}>{children}</CookingContext.Provider>;
}

// ─────────────────────────────────────────────────────────────
// Remote mode — inventory / shopping / profile in Supabase (per user),
// with optimistic local updates + realtime resync. Recipes stay on-device;
// selectedConcepts is ephemeral. Same action signatures as local mode.
// ─────────────────────────────────────────────────────────────
function RemoteCookingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [profile, setProfile] = useState<UserProfile>(() => ({
    id: userId ?? "local",
    displayName: "You",
    sharingEnabled: false,
    requestsEnabled: false,
    inventoryVisible: false,
  }));
  const [recipes, setRecipes] = useState<Recipe[]>(() => [...recipeCatalog]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const invRef = useRef(inventory);
  invRef.current = inventory;
  const shopRef = useRef(shoppingList);
  shopRef.current = shoppingList;

  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await remote.fetchAll(userId);
      setInventory(data.inventory);
      setShoppingList(data.shoppingList);
      setProfile(data.profile);
    } catch (e) {
      console.error("[cooking] load failed", e);
    } finally {
      setHydrated(true);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // recipes: on-device only
  useEffect(() => {
    getItem(RECIPES_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Recipe[];
        if (Array.isArray(parsed) && parsed.length > 0) setRecipes(parsed);
      } catch {
        // keep catalog
      }
    });
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    setItem(RECIPES_KEY, JSON.stringify(recipes)).catch(() => {});
  }, [recipes, hydrated]);

  // realtime: any change to my rows → debounced resync
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const client = supabase;
    if (!userId || !client) return;
    const bump = () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(() => void reload(), 700);
    };
    const channel = client
      .channel(`cooking:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pantry_items", filter: `owner_id=eq.${userId}` },
        bump,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items", filter: `owner_id=eq.${userId}` },
        bump,
      )
      .subscribe();
    return () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      void client.removeChannel(channel);
    };
  }, [userId, reload]);

  const onWriteError = useCallback(
    (e: unknown) => {
      console.error("[cooking] write failed", e);
      void reload();
    },
    [reload],
  );

  const addInventoryItem = useCallback(
    (item: Omit<InventoryItem, "id" | "addedAt" | "status">) => {
      if (!userId) return;
      const newItem: InventoryItem = {
        ...item,
        id: makeId(),
        status: "active",
        addedAt: new Date().toISOString(),
      };
      setInventory((prev) => [newItem, ...prev]);
      remote.insertInventory(userId, newItem).catch(onWriteError);
    },
    [userId, onWriteError],
  );

  const updateInventoryItem = useCallback(
    (id: string, updates: Partial<InventoryItem>) => {
      setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
      remote.patchInventory(id, updates).catch(onWriteError);
    },
    [onWriteError],
  );

  const removeInventoryItem = useCallback(
    (id: string) => {
      setInventory((prev) => prev.filter((i) => i.id !== id));
      remote.deleteInventory(id).catch(onWriteError);
    },
    [onWriteError],
  );

  const markInventoryItemConsumed = useCallback(
    (id: string) => {
      setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, status: "consumed" } : i)));
      remote.patchInventory(id, { status: "consumed" }).catch(onWriteError);
    },
    [onWriteError],
  );

  const addShoppingItem = useCallback(
    (item: Omit<ShoppingItem, "id" | "createdAt" | "purchased">) => {
      if (!userId) return;
      const newItem: ShoppingItem = {
        ...item,
        id: makeId(),
        purchased: false,
        createdAt: new Date().toISOString(),
      };
      setShoppingList((prev) => [newItem, ...prev]);
      remote.insertShopping(userId, newItem).catch(onWriteError);
    },
    [userId, onWriteError],
  );

  const updateShoppingItem = useCallback(
    (id: string, updates: Partial<ShoppingItem>) => {
      setShoppingList((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
      remote.patchShopping(id, updates).catch(onWriteError);
    },
    [onWriteError],
  );

  const removeShoppingItem = useCallback(
    (id: string) => {
      setShoppingList((prev) => prev.filter((i) => i.id !== id));
      remote.deleteShopping(id).catch(onWriteError);
    },
    [onWriteError],
  );

  const moveShoppingItemToInventory = useCallback(
    (id: string) => {
      if (!userId) return;
      const item = shopRef.current.find((i) => i.id === id);
      if (!item) return;
      const concept = findConceptById(item.conceptId);
      const category = concept?.category ?? item.category;
      const existing = invRef.current.find(
        (i) => i.conceptId === item.conceptId && i.unit === item.unit && i.status === "active",
      );

      setShoppingList((prev) => prev.map((i) => (i.id === id ? { ...i, purchased: true } : i)));

      if (existing) {
        const quantity = existing.quantity + item.quantity;
        setInventory((prev) =>
          prev.map((i) => (i.id === existing.id ? { ...i, quantity } : i)),
        );
        Promise.all([
          remote.patchInventory(existing.id, { quantity }),
          remote.patchShopping(id, { purchased: true }),
        ]).catch(onWriteError);
      } else {
        const newItem: InventoryItem = {
          id: makeId(),
          conceptId: item.conceptId,
          displayName: concept?.displayName ?? item.displayName,
          quantity: item.quantity,
          unit: item.unit,
          category,
          status: "active",
          addedAt: new Date().toISOString(),
        };
        setInventory((prev) => [newItem, ...prev]);
        Promise.all([
          remote.insertInventory(userId, newItem),
          remote.patchShopping(id, { purchased: true }),
        ]).catch(onWriteError);
      }
    },
    [userId, onWriteError],
  );

  const markShoppingItemPurchased = useCallback(
    (id: string, purchased: boolean) => {
      if (purchased) {
        moveShoppingItemToInventory(id);
        return;
      }
      setShoppingList((prev) => prev.map((i) => (i.id === id ? { ...i, purchased: false } : i)));
      remote.patchShopping(id, { purchased: false }).catch(onWriteError);
    },
    [moveShoppingItemToInventory, onWriteError],
  );

  const toggleSelectedConcept = useCallback((conceptId: string) => {
    setSelectedConcepts((prev) =>
      prev.includes(conceptId) ? prev.filter((c) => c !== conceptId) : [...prev, conceptId],
    );
  }, []);

  const clearSelectedConcepts = useCallback(() => setSelectedConcepts([]), []);

  const addRecipe = useCallback((recipe: Recipe) => {
    setRecipes((prev) => [recipe, ...prev]);
  }, []);

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      if (!userId) return;
      setProfile((prev) => ({ ...prev, ...updates }));
      remote.patchProfile(userId, updates).catch(onWriteError);
    },
    [userId, onWriteError],
  );

  const resetData = useCallback(() => {
    if (!userId) return;
    setInventory([]);
    setShoppingList([]);
    setSelectedConcepts([]);
    remote.clearAll(userId).catch(onWriteError);
  }, [userId, onWriteError]);

  const value: CookingValue = {
    inventory,
    shoppingList,
    recipes,
    selectedConcepts,
    profile,
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

  return <CookingContext.Provider value={value}>{children}</CookingContext.Provider>;
}

export function CookingProvider({ children }: { children: React.ReactNode }) {
  const Provider = useMemo(
    () => (supabaseConfigured ? RemoteCookingProvider : LocalCookingProvider),
    [],
  );
  return <Provider>{children}</Provider>;
}

export function useCooking() {
  const ctx = useContext(CookingContext);
  if (!ctx) throw new Error("useCooking must be used within a CookingProvider");
  return ctx;
}

export function useActiveInventory(): InventoryItem[] {
  const { inventory } = useCooking();
  return inventory.filter((i) => i.status === "active");
}
