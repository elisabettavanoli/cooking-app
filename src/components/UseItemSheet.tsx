import { Minus, Plus, ShoppingCart } from "lucide-react";
import { BottomSheet, Button } from "./ui";
import { colors } from "../lib/theme";
import { categoryLabel } from "../lib/data";
import { useCooking } from "../lib/store";
import type { InventoryItem } from "../lib/types";
import s from "./UseItemSheet.module.css";

/**
 * Shown on a tap in the Kitchen grid. Lets you draw down the quantity as you
 * use an item — reaching zero marks it used up and drops it from the pantry —
 * or send it straight to the shopping list.
 */
export function UseItemSheet({
  item,
  open,
  onClose,
}: {
  item: InventoryItem;
  open: boolean;
  onClose: () => void;
}) {
  const { updateInventoryItem, addShoppingItem } = useCooking();

  const step = item.unit === "g" || item.unit === "ml" ? 50 : 1;
  const round = (n: number) => Number(n.toFixed(2));

  const setQuantity = (next: number) => {
    const quantity = Math.max(0, round(next));
    updateInventoryItem(item.id, {
      quantity,
      status: quantity > 0 ? "active" : "consumed",
    });
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={item.displayName}
      subtitle={categoryLabel(item.category)}
      heightPct={0.55}
    >
      <p className={s.intro}>Lower the amount as you use it — reaching zero clears it from your kitchen.</p>

      <div className={s.sectionLabel}>Quantity</div>
      <div className={s.qtyRow}>
        <button
          type="button"
          className={s.qtyBtn}
          onClick={() => setQuantity(item.quantity - step)}
          aria-label="Decrease quantity"
        >
          <Minus size={18} color={colors.foreground} />
        </button>
        <div className={s.qtyValueWrap}>
          <span className={s.qtyValue}>{item.quantity}</span>
          <span className={s.qtyUnit}>{item.unit}</span>
        </div>
        <button
          type="button"
          className={s.qtyBtn}
          onClick={() => setQuantity(item.quantity + step)}
          aria-label="Increase quantity"
        >
          <Plus size={18} color={colors.foreground} />
        </button>
      </div>

      <Button
        label="Add to shopping list"
        variant="outline"
        icon={<ShoppingCart size={18} color={colors.foreground} />}
        style={{ width: "100%" }}
        onPress={() => {
          addShoppingItem({
            conceptId: item.conceptId,
            displayName: item.displayName,
            // Restock at the default step (1, or 50 for g/ml), not whatever is
            // left in the pantry.
            quantity: step,
            unit: item.unit,
            category: item.category,
            source: "from-inventory",
          });
          onClose();
        }}
      />
    </BottomSheet>
  );
}
