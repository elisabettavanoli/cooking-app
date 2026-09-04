import { useMemo, useRef, useState, type MouseEvent } from "react";
import { Check, Plus, Search, UtensilsCrossed, X } from "lucide-react";
import { FoodIcon } from "../components/FoodIcon";
import { Button } from "../components/ui";
import { categoryMeta } from "../lib/data";
import { colors } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { foodName } from "../lib/foodNames";
import { compactAmount } from "../lib/units";
import { useActiveInventory, useCooking } from "../lib/store";
import { AddItemSheet } from "../components/AddItemSheet";
import { EditItemSheet } from "../components/EditItemSheet";
import { UseItemSheet } from "../components/UseItemSheet";
import { PageInfo } from "../components/PageInfo";
import type { InventoryItem } from "../lib/types";
import s from "./KitchenTab.module.css";

/** Flip back to `true` to restore the per-tile status badges ("last", "old",
 *  "3d", …). Hidden for now — see `tileBadge` below for what they showed. */
const SHOW_TILE_BADGES = false;

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function tileBadge(item: InventoryItem): { text: string; color: string; bg: string } | null {
  if (item.expiry) {
    const d = daysUntil(item.expiry);
    if (d < 0) return { text: "old", color: colors.destructive, bg: "#FCE0E4" };
    if (d <= 3) return { text: d === 0 ? "today" : `${d}d`, color: colors.warn, bg: colors.warnSoft };
  }
  if (item.unit === "piece" && item.quantity != null && item.quantity <= 1) {
    return { text: "last", color: colors.low, bg: colors.lowSoft };
  }
  return null;
}

/** Long-press (touch) / right-click (desktop) → actions, else a plain tap. */
function useLongPress(onLongPress: () => void, onTap: () => void, ms = 500) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = undefined;
  };
  return {
    onPointerDown: () => {
      fired.current = false;
      clear();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLongPress();
      }, ms);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerMove: clear,
    onContextMenu: (e: MouseEvent) => {
      e.preventDefault();
      clear();
      fired.current = true;
      onLongPress();
    },
    onClick: () => {
      if (fired.current) {
        fired.current = false;
        return;
      }
      onTap();
    },
  };
}

function Tile({
  item,
  selected,
  onTap,
  onLongPress,
}: {
  item: InventoryItem;
  selected: boolean;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const { lang } = useI18n();
  const badge = SHOW_TILE_BADGES ? tileBadge(item) : null;
  const handlers = useLongPress(onLongPress, onTap);
  return (
    <button
      type="button"
      className={["resetButton", s.tile, selected ? s.tileSelected : ""].join(" ")}
      style={{ backgroundColor: categoryMeta[item.category].bg }}
      {...handlers}
    >
      {badge && (
        <span className={s.badge} style={{ backgroundColor: badge.bg }}>
          <span className={s.badgeText} style={{ color: badge.color }}>
            {badge.text}
          </span>
        </span>
      )}
      {/* Quantity is only shown once you've told the app how much you have —
          untracked (null) items get no badge at all. Same corner as the status
          badge above, but that one is currently off (SHOW_TILE_BADGES). */}
      {item.quantity != null && (
        <span className={s.qtyBadge}>{compactAmount(item.quantity, item.unit)}</span>
      )}
      {selected && (
        <span className={s.tileCheck}>
          <Check size={10} color={colors.primaryForeground} strokeWidth={3} />
        </span>
      )}
      <FoodIcon iconKey={item.conceptId} category={item.category} size={30} variant="bare" />
      <span className={s.tileTexts}>
        <span className={s.tileName}>{foodName(item.conceptId, lang, item.displayName)}</span>
      </span>
    </button>
  );
}

export function KitchenTab({ onSwitchToCook }: { onSwitchToCook: () => void }) {
  const [search, setSearch] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [useItemId, setUseItemId] = useState<string | null>(null);

  const { t, lang } = useI18n();
  const { inventory, selectedConcepts, toggleSelectedConcept, clearSelectedConcepts } = useCooking();
  const activeInventory = useActiveInventory();

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = activeInventory.filter(
      (i) =>
        i.displayName.toLowerCase().includes(q) ||
        foodName(i.conceptId, lang, i.displayName).toLowerCase().includes(q),
    );
    const map = new Map<string, InventoryItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [activeInventory, search, lang]);

  const expiringCount = activeInventory.filter((i) => i.expiry && daysUntil(i.expiry) <= 3).length;

  const editItem = inventory.find((i) => i.id === editItemId) ?? null;
  const useItem = inventory.find((i) => i.id === useItemId) ?? null;

  const handleTap = (item: InventoryItem) => {
    if (selectionMode) toggleSelectedConcept(item.conceptId);
    else setUseItemId(item.id);
  };

  return (
    <div className={s.screen}>
      <div className={s.scroll}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>{t("kitchen.title")}</h1>
            <p className={s.subtitle}>
              {t("kitchen.itemsTracked", { n: activeInventory.length })}
              {expiringCount > 0 ? (
                <span className={s.subtitleWarn}> · {t("kitchen.toUseSoon", { n: expiringCount })}</span>
              ) : null}
            </p>
          </div>
          <PageInfo title={t("kitchen.title")} text={t("kitchen.infoText")} />
        </div>

        <div className={s.searchRow}>
          <div className={s.searchBox}>
            <Search size={16} color={colors.mutedForeground} />
            <input
              className={s.searchInput}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              placeholder={t("kitchen.searchPlaceholder")}
            />
          </div>
          <button
            type="button"
            className={[s.selectBtn, selectionMode ? s.selectBtnActive : ""].join(" ")}
            onClick={() => {
              setSelectionMode((v) => !v);
              clearSelectedConcepts();
            }}
            aria-label={selectionMode ? t("kitchen.exitSelect") : t("kitchen.enterSelect")}
          >
            {selectionMode ? (
              <X size={18} color={colors.primaryForeground} />
            ) : (
              <UtensilsCrossed size={18} color={colors.foreground} />
            )}
          </button>
        </div>
        {selectionMode && <p className={s.hint}>{t("kitchen.hintSelect")}</p>}

        {grouped.length === 0 && (
          <div className={s.emptyState}>
            <div className={s.emptyIcon}>
              <UtensilsCrossed size={28} color={colors.mutedForeground} />
            </div>
            <p className={s.emptyTitle}>
              {search ? t("kitchen.noMatchTitle") : t("kitchen.emptyTitle")}
            </p>
            <p className={s.emptyText}>
              {search ? t("kitchen.noMatchText") : t("kitchen.emptyText")}
            </p>
          </div>
        )}

        {grouped.map(({ category, items }) => (
          <div key={category} className={s.group}>
            <div className={s.sectionHead}>
              <span className={s.sectionTitle}>{t(`category.${category}`)}</span>
              <span className={s.sectionCount}>{items.length}</span>
            </div>
            <div className={s.grid}>
              {items.map((item) => (
                <Tile
                  key={item.id}
                  item={item}
                  selected={selectedConcepts.includes(item.conceptId)}
                  onTap={() => handleTap(item)}
                  onLongPress={() => setEditItemId(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {!selectionMode && (
        <button
          type="button"
          className={s.fab}
          onClick={() => setAddOpen(true)}
          aria-label={t("kitchen.addIngredient")}
        >
          <Plus size={24} color={colors.primaryForeground} strokeWidth={2.5} />
        </button>
      )}

      {selectionMode && selectedConcepts.length > 0 && (
        <div className={s.cookCta}>
          <Button
            label={t("kitchen.cookWith", { n: selectedConcepts.length })}
            onPress={() => {
              setSelectionMode(false);
              onSwitchToCook();
            }}
          />
        </div>
      )}

      <AddItemSheet open={addOpen} onClose={() => setAddOpen(false)} />
      {editItem && (
        <EditItemSheet item={editItem} open={!!editItemId} onClose={() => setEditItemId(null)} />
      )}
      {useItem && (
        <UseItemSheet item={useItem} open={!!useItemId} onClose={() => setUseItemId(null)} />
      )}
    </div>
  );
}
