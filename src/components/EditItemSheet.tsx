import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { BottomSheet, Button, ChipSelect, Field, uiStyles } from "./ui";
import { colors } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { categories, units } from "../lib/data";
import { unitLabel } from "../lib/units";
import { useCooking } from "../lib/store";
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
  const { t } = useI18n();
  const { updateInventoryItem, removeInventoryItem } = useCooking();
  const [displayName, setDisplayName] = useState(item.displayName);
  const [category, setCategory] = useState<Category>(item.category);
  const [quantity, setQuantity] = useState(item.quantity != null ? String(item.quantity) : "");
  const [unit, setUnit] = useState<Unit>(item.unit);
  const [notes, setNotes] = useState(item.notes ?? "");

  const handleSave = () => {
    // Quantity is optional — clear the field to go back to untracked (null).
    const trimmedQty = quantity.trim();
    const qty = trimmedQty ? Number(trimmedQty) : null;
    if (qty !== null && (!Number.isFinite(qty) || qty < 0)) return;
    updateInventoryItem(item.id, {
      displayName,
      category,
      quantity: qty,
      unit,
      notes,
    });
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t("sheet.editTitle")}
      subtitle={t("sheet.editSubtitle")}
      heightPct={0.85}
    >
      <div className={uiStyles.sheetScroll}>
        <Field label={t("sheet.name")} value={displayName} onChangeText={setDisplayName} />

        <div className={s.row}>
          <Field
            label={t("sheet.quantity")}
            value={quantity}
            onChangeText={setQuantity}
            inputMode="decimal"
            placeholder={t("sheet.quantityOptional")}
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
            onChange={setCategory}
            options={categories.map((x) => ({ value: x, label: t(`category.${x}`) }))}
          />
        </div>

        <Field label={t("sheet.notes")} value={notes} onChangeText={setNotes} multiline />

        <div className={s.rowActions}>
          <Button
            label={t("common.delete")}
            variant="destructive"
            icon={<Trash2 size={18} color={colors.destructiveForeground} />}
            onPress={() => {
              removeInventoryItem(item.id);
              onClose();
            }}
          />
          <Button
            label={t("common.save")}
            onPress={handleSave}
            icon={<Save size={18} color={colors.primaryForeground} />}
            style={{ flex: 1 }}
          />
        </div>
      </div>
    </BottomSheet>
  );
}
