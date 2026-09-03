import type { ReactNode } from "react";
import { Check, Edit3, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { BottomSheet } from "./ui";
import { colors } from "../lib/theme";
import { categoryLabel } from "../lib/data";
import { useCooking } from "../lib/store";
import type { InventoryItem } from "../lib/types";
import s from "./ItemActionsSheet.module.css";

export function ItemActionsSheet({
  item,
  open,
  onClose,
  onEdit,
}: {
  item: InventoryItem;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { updateInventoryItem, removeInventoryItem, markInventoryItemConsumed, addShoppingItem } =
    useCooking();

  const step = item.unit === "g" || item.unit === "ml" ? 50 : 1;
  const round = (n: number) => Number(n.toFixed(2));

  const actions: {
    key: string;
    label: string;
    icon: ReactNode;
    danger?: boolean;
    onPress: () => void;
  }[] = [
    {
      key: "list",
      label: "Add to list",
      icon: <ShoppingCart size={16} color={colors.foreground} />,
      onPress: () => {
        addShoppingItem({
          conceptId: item.conceptId,
          displayName: item.displayName,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          source: "from-inventory",
        });
        onClose();
      },
    },
    {
      key: "edit",
      label: "Edit details",
      icon: <Edit3 size={16} color={colors.foreground} />,
      onPress: () => {
        onClose();
        onEdit();
      },
    },
    {
      key: "used",
      label: "Used up",
      icon: <Check size={16} color={colors.foreground} />,
      onPress: () => {
        markInventoryItemConsumed(item.id);
        onClose();
      },
    },
    {
      key: "remove",
      label: "Remove",
      icon: <Trash2 size={16} color={colors.destructive} />,
      danger: true,
      onPress: () => {
        removeInventoryItem(item.id);
        onClose();
      },
    },
  ];

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={item.displayName}
      subtitle={categoryLabel(item.category)}
      heightPct={0.6}
    >
      <div className={s.qtyRow}>
        <button
          type="button"
          className={s.qtyBtn}
          onClick={() =>
            updateInventoryItem(item.id, { quantity: Math.max(0, round(item.quantity - step)) })
          }
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
          onClick={() => updateInventoryItem(item.id, { quantity: round(item.quantity + step) })}
          aria-label="Increase quantity"
        >
          <Plus size={18} color={colors.foreground} />
        </button>
      </div>

      <div className={s.grid}>
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            className={["resetButton", s.actionBtn, a.danger ? s.actionDanger : ""].join(" ")}
            onClick={a.onPress}
          >
            {a.icon}
            <span>{a.label}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
