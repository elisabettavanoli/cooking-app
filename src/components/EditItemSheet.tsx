import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { BottomSheet, Button, ChipSelect, Field, uiStyles } from "./ui";
import { Switch } from "./Switch";
import { colors } from "../lib/theme";
import { categories, units } from "../lib/data";
import { usePantry } from "../lib/store";
import type { Category, InventoryItem, Unit } from "../lib/types";
import s from "./EditItemSheet.module.css";

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
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Edit ingredient"
      subtitle="Adjust quantity, category, or sharing."
      heightPct={0.85}
    >
      <div className={uiStyles.sheetScroll}>
        <Field label="Name" value={displayName} onChangeText={setDisplayName} />

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
            onChange={setCategory}
            options={categories.map((x) => ({ value: x, label: x }))}
          />
        </div>

        <div className={s.shareRow}>
          <div className={s.grow}>
            <div className={s.label}>Share with community</div>
            <div className={s.hint}>Let neighbors see you have this</div>
          </div>
          <Switch value={isShareable} onValueChange={setIsShareable} label="Share with community" />
        </div>

        <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

        <div className={s.rowActions}>
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
        </div>
      </div>
    </BottomSheet>
  );
}
