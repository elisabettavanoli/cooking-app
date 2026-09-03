import { useState } from "react";
import { Plus } from "lucide-react";
import { BottomSheet, Button, ChipSelect, Field, Segmented, uiStyles } from "./ui";
import { colors } from "../lib/theme";
import { categories, units } from "../lib/data";
import { useCooking } from "../lib/store";
import { categorizeIngredientAsync } from "../lib/ai";
import type { Category, Unit } from "../lib/types";
import s from "./AddItemSheet.module.css";

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
  const { addInventoryItem, addShoppingItem } = useCooking();
  const [mode, setMode] = useState<AddMode>(defaultMode);
  const [rawName, setRawName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<Unit>("piece");
  const [notes, setNotes] = useState("");
  const [, setResolved] = useState<{ name: string; conceptId: string } | null>(null);

  const reset = () => {
    setRawName("");
    setDisplayName("");
    setCategory("other");
    setCategoryTouched(false);
    setQuantity("1");
    setUnit("piece");
    setNotes("");
    setResolved(null);
  };

  const resolveName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const result = await categorizeIngredientAsync(trimmed);
    setDisplayName((cur) => cur || result.displayName);
    if (!categoryTouched) setCategory(result.category);
    const next = { name: trimmed, conceptId: result.conceptId };
    setResolved(next);
    return { ...next, ...result };
  };

  const handleSubmit = async () => {
    const typed = rawName.trim();
    const qty = parseFloat(quantity) || 0;
    if (!typed || qty <= 0) return;
    const match = await resolveName(typed);
    const name = (displayName || match?.displayName || typed).trim();
    const conceptId = match?.conceptId ?? typed.toLowerCase().replace(/\s+/g, "-");
    const finalCategory: Category = categoryTouched ? category : match?.category ?? category;

    const base = { conceptId, displayName: name, category: finalCategory, quantity: qty, unit, notes };
    if (mode === "inventory") {
      addInventoryItem(base);
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
      <div className={uiStyles.sheetScroll}>
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
          onBlur={() => {
            void resolveName(rawName);
          }}
          placeholder="e.g. 3 red tomatoes"
        />

        <Field
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Name as shown in the app"
        />

        <div className={s.row}>
          <Field
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            inputMode="decimal"
            style={{ flex: 1 }}
          />
          <div className={s.grow2}>
            <div className={s.label}>Unit</div>
            <ChipSelect
              value={unit}
              onChange={setUnit}
              options={units.map((x) => ({ value: x, label: x }))}
            />
          </div>
        </div>

        <div>
          <div className={s.label}>Category</div>
          <ChipSelect
            value={category}
            onChange={(v) => {
              setCategory(v);
              setCategoryTouched(true);
            }}
            options={categories.map((x) => ({ value: x, label: x }))}
          />
        </div>

        <Field
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Brand, storage tip, etc."
          multiline
        />

        <div className={s.rowActions}>
          <Button label="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
          <Button
            label={`Add to ${mode === "inventory" ? "kitchen" : "list"}`}
            onPress={() => {
              void handleSubmit();
            }}
            icon={<Plus size={18} color={colors.primaryForeground} />}
            style={{ flex: 1 }}
          />
        </div>
      </div>
    </BottomSheet>
  );
}
