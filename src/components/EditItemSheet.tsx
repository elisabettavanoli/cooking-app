import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Save, Trash2 } from "lucide-react-native";
import { BottomSheet, Button, ChipSelect, Field } from "./ui";
import { colors, radius } from "../lib/theme";
import { categories, units } from "../lib/data";
import { usePantry } from "../lib/store";
import type { Category, InventoryItem, Unit } from "../lib/types";

export function EditItemSheet({
  item,
  open,
  onClose,
}: {
  item: InventoryItem;
  open: boolean;
  onClose: () => void;
}) {
  const { updateInventoryItem, removeInventoryItem } = usePantry();
  const [displayName, setDisplayName] = useState(item.displayName);
  const [category, setCategory] = useState<Category>(item.category);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState<Unit>(item.unit);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [isShareable, setIsShareable] = useState(item.isShareable);

  const handleSave = () => {
    updateInventoryItem(item.id, {
      displayName,
      category,
      quantity: parseFloat(quantity) || 0,
      unit,
      notes,
      isShareable,
    });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit ingredient" subtitle="Adjust quantity, category, or sharing." heightPct={0.85}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
        <Field label="Name" value={displayName} onChangeText={setDisplayName} />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Field
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            style={{ flex: 1 }}
          />
          <View style={{ flex: 2 }}>
            <Text style={s.label}>Unit</Text>
            <ChipSelect value={unit} onChange={setUnit} options={units.map((x) => ({ value: x, label: x }))} />
          </View>
        </View>

        <View>
          <Text style={s.label}>Category</Text>
          <ChipSelect value={category} onChange={setCategory} options={categories.map((x) => ({ value: x, label: x }))} />
        </View>

        <View style={s.shareRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Share with community</Text>
            <Text style={s.hint}>Let neighbors see you have this</Text>
          </View>
          <Switch value={isShareable} onValueChange={setIsShareable} />
        </View>

        <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            label="Delete"
            variant="destructive"
            icon={<Trash2 size={18} color={colors.destructiveForeground} />}
            onPress={() => {
              removeInventoryItem(item.id);
              onClose();
            }}
          />
          <Button
            label="Save"
            onPress={handleSave}
            icon={<Save size={18} color={colors.primaryForeground} />}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 },
  hint: { fontSize: 12, color: colors.mutedForeground },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
  },
});
