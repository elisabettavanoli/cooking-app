import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Plus } from "lucide-react-native";
import { BottomSheet, Button, ChipSelect, Field, Segmented } from "./ui";
import { colors, radius } from "../lib/theme";
import { categories, units } from "../lib/data";
import { usePantry } from "../lib/store";
import { categorizeIngredient } from "../lib/ai";
import type { Category, Unit } from "../lib/types";

type AddMode = "inventory" | "list";

export function AddItemSheet({
  open,
  onClose,
  defaultMode = "inventory",
}: {
  open: boolean;
  onClose: () => void;
  defaultMode?: AddMode;
}) {
  const { addInventoryItem, addShoppingItem } = usePantry();
  const [mode, setMode] = useState<AddMode>(defaultMode);
  const [rawName, setRawName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<Unit>("piece");
  const [notes, setNotes] = useState("");
  const [isShareable, setIsShareable] = useState(false);
  const [resolved, setResolved] = useState<{ name: string; conceptId: string } | null>(null);

  const reset = () => {
    setRawName("");
    setDisplayName("");
    setCategory("other");
    setCategoryTouched(false);
    setQuantity("1");
    setUnit("piece");
    setNotes("");
    setIsShareable(false);
    setResolved(null);
  };

  const resolveName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const result = categorizeIngredient(trimmed);
    setDisplayName((cur) => cur || result.displayName);
    if (!categoryTouched) setCategory(result.category);
    const next = { name: trimmed, conceptId: result.conceptId };
    setResolved(next);
    return { ...next, ...result };
  };

  const handleSubmit = () => {
    const typed = rawName.trim();
    const qty = parseFloat(quantity) || 0;
    if (!typed || qty <= 0) return;
    const match = resolveName(typed);
    const name = (displayName || match?.displayName || typed).trim();
    const conceptId = match?.conceptId ?? typed.toLowerCase().replace(/\s+/g, "-");
    const finalCategory: Category = categoryTouched ? category : match?.category ?? category;

    const base = { conceptId, displayName: name, category: finalCategory, quantity: qty, unit, notes };
    if (mode === "inventory") {
      addInventoryItem({ ...base, isShareable });
    } else {
      addShoppingItem({ ...base, source: "manual" });
    }
    reset();
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={mode === "inventory" ? "Add to kitchen" : "Add to shopping list"}
      subtitle="Enter an ingredient, the category is filled in for you."
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "inventory", label: "Kitchen" },
            { value: "list", label: "Shopping list" },
          ]}
        />

        <Field
          label="Ingredient name"
          value={rawName}
          onChangeText={setRawName}
          onBlur={() => resolveName(rawName)}
          placeholder="e.g. 3 red tomatoes"
        />

        <Field
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Name as shown in the app"
        />

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
            <ChipSelect
              value={unit}
              onChange={setUnit}
              options={units.map((x) => ({ value: x, label: x }))}
            />
          </View>
        </View>

        <View>
          <Text style={s.label}>Category</Text>
          <ChipSelect
            value={category}
            onChange={(v) => {
              setCategory(v);
              setCategoryTouched(true);
            }}
            options={categories.map((x) => ({ value: x, label: x }))}
          />
        </View>

        {mode === "inventory" && (
          <View style={s.shareRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Share with community</Text>
              <Text style={s.hint}>Let neighbors see you have this</Text>
            </View>
            <Switch value={isShareable} onValueChange={setIsShareable} />
          </View>
        )}

        <Field
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Brand, storage tip, etc."
          multiline
        />

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button label="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
          <Button
            label={`Add to ${mode === "inventory" ? "kitchen" : "list"}`}
            onPress={handleSubmit}
            icon={<Plus size={18} color={colors.primaryForeground} />}
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
