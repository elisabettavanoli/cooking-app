import { useMemo, useState } from "react";
import { Check, Plus, Search, ShoppingCart, Trash2, Undo2 } from "lucide-react";
import { FoodIcon } from "../components/FoodIcon";
import { colors } from "../lib/theme";
import { categoryLabel } from "../lib/data";
import { categorizeIngredientAsync } from "../lib/ai";
import { useCooking } from "../lib/store";
import type { Category, ShoppingItem } from "../lib/types";
import s from "./ListTab.module.css";

function groupByCategory(items: ShoppingItem[]) {
  const map = new Map<Category, ShoppingItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return Array.from(map.entries()).map(([category, list]) => ({ category, items: list }));
}

export function ListTab() {
  const { shoppingList, addShoppingItem, markShoppingItemPurchased, removeShoppingItem } =
    useCooking();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  const commitDraft = async () => {
    const name = draft.trim();
    if (!name) return;
    const resolved = await categorizeIngredientAsync(name);
    addShoppingItem({
      conceptId: resolved.conceptId,
      displayName: resolved.displayName,
      quantity: 1,
      unit: "piece",
      category: resolved.category,
      source: "manual",
    });
    setDraft("");
  };

  const { active, purchased } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = shoppingList.filter((i) => i.displayName.toLowerCase().includes(q));
    return {
      active: filtered.filter((i) => !i.purchased),
      purchased: filtered.filter((i) => i.purchased),
    };
  }, [shoppingList, search]);

  return (
    <div className={s.screen}>
      <div className={s.scroll}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Shopping List</h1>
            <p className={s.subtitle}>{active.length} items to buy</p>
          </div>
        </div>

        <div className={s.searchBox}>
          <Search size={16} color={colors.mutedForeground} />
          <input
            className={s.searchInput}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Search list..."
          />
        </div>

        {active.length === 0 && purchased.length === 0 && (
          <div className={s.emptyState}>
            <div className={s.emptyIcon}>
              <ShoppingCart size={28} color={colors.mutedForeground} />
            </div>
            <p className={s.emptyTitle}>Your list is empty</p>
            <p className={s.emptyText}>Add items manually or from a recipe.</p>
          </div>
        )}

        {groupByCategory(active).map(({ category, items }) => (
          <div key={category} className={s.section}>
            <p className={s.sectionTitle}>{categoryLabel(category).toUpperCase()}</p>
            <div className={s.rows}>
              {items.map((item) => (
                <div key={item.id} className={s.row}>
                  <FoodIcon iconKey={item.conceptId} category={item.category} size={44} />
                  <div className={s.rowText}>
                    <div className={s.rowName}>{item.displayName}</div>
                    <div className={s.rowSub}>
                      {item.quantity} {item.unit}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={s.iconBtn}
                    onClick={() => removeShoppingItem(item.id)}
                    aria-label="Remove"
                  >
                    <Trash2 size={16} color={colors.destructive} />
                  </button>
                  <button
                    type="button"
                    className={[s.iconBtn, s.iconBtnPrimary].join(" ")}
                    onClick={() => markShoppingItemPurchased(item.id, true)}
                    aria-label="Mark purchased"
                  >
                    <Check size={16} color={colors.primaryForeground} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {purchased.length > 0 && (
          <div className={s.sectionPurchased}>
            <p className={s.sectionTitle}>PURCHASED</p>
            <div className={s.rows}>
              {purchased.map((item) => (
                <div key={item.id} className={[s.row, s.rowPurchased].join(" ")}>
                  <FoodIcon iconKey={item.conceptId} category={item.category} size={44} />
                  <div className={s.rowText}>
                    <div className={[s.rowName, s.rowNameStruck].join(" ")}>{item.displayName}</div>
                    <div className={[s.rowSub, s.rowSubDone].join(" ")}>
                      {item.quantity} {item.unit} · in your kitchen
                    </div>
                  </div>
                  <button
                    type="button"
                    className={s.iconBtn}
                    onClick={() => markShoppingItemPurchased(item.id, false)}
                    aria-label="Undo"
                  >
                    <Undo2 size={16} color={colors.foreground} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        className={s.composer}
        onSubmit={(e) => {
          e.preventDefault();
          void commitDraft();
        }}
      >
        <input
          className={s.composerInput}
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          placeholder="Add an item…"
          aria-label="Add an item"
          autoComplete="off"
          enterKeyHint="done"
        />
        <button
          type="submit"
          className={s.composerBtn}
          disabled={!draft.trim()}
          aria-label="Add"
        >
          <Plus size={20} color={colors.primaryForeground} />
        </button>
      </form>
    </div>
  );
}
