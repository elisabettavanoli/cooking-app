import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, Edit3, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react-native";
import { BottomSheet } from "./ui";
import { FoodIcon } from "./FoodIcon";
import { colors, radius } from "../lib/theme";
import { categoryLabel } from "../lib/data";
import { usePantry } from "../lib/store";
import type { InventoryItem } from "../lib/types";

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
    usePantry();

  const step = item.unit === "g" || item.unit === "ml" ? 50 : 1;
  const round = (n: number) => Number(n.toFixed(2));

  const actions = [
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
    <BottomSheet open={open} onClose={onClose} title={item.displayName} subtitle={categoryLabel(item.category)} heightPct={0.6}>
      <View style={s.qtyRow}>
        <Pressable
          style={s.qtyBtn}
          onPress={() =>
            updateInventoryItem(item.id, { quantity: Math.max(0, round(item.quantity - step)) })
          }
        >
          <Minus size={18} color={colors.foreground} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={s.qtyValue}>{item.quantity}</Text>
          <Text style={s.qtyUnit}>{item.unit}</Text>
        </View>
        <Pressable
          style={s.qtyBtn}
          onPress={() => updateInventoryItem(item.id, { quantity: round(item.quantity + step) })}
        >
          <Plus size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={s.grid}>
        {actions.map((a) => (
          <Pressable key={a.key} style={s.actionBtn} onPress={a.onPress}>
            {a.icon}
            <Text style={[s.actionLabel, a.danger && { color: colors.destructive }]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.muted,
    borderRadius: radius["2xl"],
    padding: 8,
    marginBottom: 16,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  qtyUnit: { fontSize: 12, color: colors.mutedForeground },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: {
    width: "48%",
    flexGrow: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: { fontSize: 14, fontWeight: "600", color: colors.foreground },
});
