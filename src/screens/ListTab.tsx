import { useMemo, useState } from "react";
import { Check, Plus, Search, ShoppingCart, Trash2, Undo2 } from "lucide-react";
import { FoodIcon } from "../components/FoodIcon";
import { colors } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { foodName } from "../lib/foodNames";
import { formatAmount } from "../lib/units";
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
  const { t, lang } = useI18n();
  const { shoppingList, addShoppingItem, markShoppingItemPurchased, removeShoppingItem } =
    useCooking();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);

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
    const filtered = shoppingList.filter(
      (i) =>
        i.displayName.toLowerCase().includes(q) ||
        foodName(i.conceptId, lang, i.displayName).toLowerCase().includes(q),
    );
    return {
      active: filtered.filter((i) => !i.purchased),
      purchased: filtered.filter((i) => i.purchased),
    };
  }, [shoppingList, search, lang]);

  return (
    <div className={s.screen}>
      <div className={s.scroll}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>{t("list.title")}</h1>
            <p className={s.subtitle}>{t("list.toBuy", { n: active.length })}</p>
          </div>
        </div>

        <div className={s.searchBox}>
          <Search size={16} color={colors.mutedForeground} />
          <input
            className={s.searchInput}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder={t("list.searchPlaceholder")}
          />
        </div>

        {active.length === 0 && purchased.length === 0 && (
          <div className={s.emptyState}>
            <div className={s.emptyIcon}>
              <ShoppingCart size={28} color={colors.mutedForeground} />
            </div>
            <p className={s.emptyTitle}>{t("list.emptyTitle")}</p>
            <p className={s.emptyText}>{t("list.emptyText")}</p>
          </div>
        )}

        {groupByCategory(active).map(({ category, items }) => (
          <div key={category} className={s.section}>
            <p className={s.sectionTitle}>{t(`category.${category}`).toUpperCase()}</p>
            <div className={s.rows}>
              {items.map((item) => (
                <div key={item.id} className={s.row}>
                  <FoodIcon iconKey={item.conceptId} category={item.category} size={44} />
                  <div className={s.rowText}>
                    <div className={s.rowName}>{foodName(item.conceptId, lang, item.displayName)}</div>
                    <div className={s.rowSub}>{formatAmount(item.quantity, item.unit, t)}</div>
                  </div>
                  <button
                    type="button"
                    className={s.iconBtn}
                    onClick={() => removeShoppingItem(item.id)}
                    aria-label={t("common.remove")}
                  >
                    <Trash2 size={16} color={colors.destructive} />
                  </button>
                  <button
                    type="button"
                    className={[s.iconBtn, s.iconBtnPrimary].join(" ")}
                    onClick={() => markShoppingItemPurchased(item.id, true)}
                    aria-label={t("list.purchased")}
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
            <p className={s.sectionTitle}>{t("list.purchased").toUpperCase()}</p>
            <div className={s.rows}>
              {purchased.map((item) => (
                <div key={item.id} className={[s.row, s.rowPurchased].join(" ")}>
                  <FoodIcon iconKey={item.conceptId} category={item.category} size={44} />
                  <div className={s.rowText}>
                    <div className={[s.rowName, s.rowNameStruck].join(" ")}>
                      {foodName(item.conceptId, lang, item.displayName)}
                    </div>
                    <div className={[s.rowSub, s.rowSubDone].join(" ")}>
                      {formatAmount(item.quantity, item.unit, t)} · {t("list.inYourKitchen")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={s.iconBtn}
                    onClick={() => markShoppingItemPurchased(item.id, false)}
                    aria-label={t("common.undo")}
                  >
                    <Undo2 size={16} color={colors.foreground} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {composerOpen ? (
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
            onBlur={() => {
              if (!draft.trim()) setComposerOpen(false);
            }}
            placeholder={t("list.addPlaceholder")}
            aria-label={t("list.addPlaceholder")}
            autoComplete="off"
            enterKeyHint="done"
            autoFocus
          />
          <button
            type="submit"
            className={s.composerBtn}
            disabled={!draft.trim()}
            aria-label={t("list.add")}
          >
            <Plus size={20} color={colors.primaryForeground} />
          </button>
        </form>
      ) : (
        <button
          type="button"
          className={s.fab}
          onClick={() => setComposerOpen(true)}
          aria-label={t("list.add")}
        >
          <Plus size={24} color={colors.primaryForeground} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
