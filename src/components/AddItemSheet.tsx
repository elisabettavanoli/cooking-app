import { useState } from "react";
import { Plus } from "lucide-react";
import { BottomSheet, Button, ChipSelect, Field, uiStyles } from "./ui";
import { colors } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { categories, units } from "../lib/data";
import { unitLabel } from "../lib/units";
import { useCooking } from "../lib/store";
import { categorizeIngredientAsync } from "../lib/ai";
import type { Category, Unit } from "../lib/types";
import s from "./AddItemSheet.module.css";

export function AddItemSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { addInventoryItem } = useCooking();
  const [rawName, setRawName] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<Unit>("piece");
  const [notes, setNotes] = useState("");
  const [, setResolved] = useState<{ name: string; conceptId: string } | null>(null);

  const reset = () => {
    setRawName("");
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
    // Keep the name the user typed; the matched concept only lends its id
    // (recipe matching) + icon + category.
    const conceptId = match?.conceptId ?? typed.toLowerCase().replace(/\s+/g, "-");
    const finalCategory: Category = categoryTouched ? category : match?.category ?? category;

    addInventoryItem({
      conceptId,
      displayName: typed,
      category: finalCategory,
      quantity: qty,
      unit,
      notes,
    });
    reset();
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t("sheet.addToKitchen")}
      subtitle={t("sheet.addSubtitle")}
    >
      <div className={uiStyles.sheetScroll}>
        <Field
          label={t("sheet.ingredientName")}
          value={rawName}
          onChangeText={setRawName}
          onBlur={() => {
            void resolveName(rawName);
          }}
          placeholder={t("sheet.ingredientPlaceholder")}
        />

        <div className={s.row}>
          <Field
            label={t("sheet.quantity")}
            value={quantity}
            onChangeText={setQuantity}
            inputMode="decimal"
            style={{ flex: 1 }}
          />
          <div className={s.grow2}>
            <div className={s.label}>{t("sheet.unit")}</div>
            <ChipSelect
              value={unit}
              onChange={setUnit}
              options={units.map((x) => ({ value: x, label: unitLabel(x, t, 1) }))}
            />
          </div>
        </div>

        <div>
          <div className={s.label}>{t("sheet.category")}</div>
          <ChipSelect
            value={category}
            onChange={(v) => {
              setCategory(v);
              setCategoryTouched(true);
            }}
            options={categories.map((x) => ({ value: x, label: t(`category.${x}`) }))}
          />
        </div>

        <Field
          label={t("sheet.notesOptional")}
          value={notes}
          onChangeText={setNotes}
          placeholder={t("sheet.notesPlaceholder")}
          multiline
        />

        <div className={s.rowActions}>
          <Button label={t("common.cancel")} variant="outline" onPress={onClose} style={{ flex: 1 }} />
          <Button
            label={t("sheet.addToKitchenBtn")}
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
