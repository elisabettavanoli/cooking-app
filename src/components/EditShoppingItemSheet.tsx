import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { BottomSheet, Button, ChipSelect, Field, uiStyles } from "./ui";
import { useI18n } from "../lib/i18n";
import { units } from "../lib/data";
import { unitLabel } from "../lib/units";
import { useCooking } from "../lib/store";
import type { ShoppingItem, Unit } from "../lib/types";

export function EditShoppingItemSheet({
  item,
  open,
  onClose,
}: {
  item: ShoppingItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { updateShoppingItem } = useCooking();

  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Unit>("piece");

  useEffect(() => {
    if (!item) return;
    setQuantity(item.quantity != null ? String(item.quantity) : "");
    setUnit(item.unit);
  }, [item]);

  const handleSave = () => {
    if (!item) return;

    const trimmedQty = quantity.trim();
    const qty = trimmedQty ? Number(trimmedQty) : null;

    if (qty === null || !Number.isFinite(qty) || qty <= 0) return;

    updateShoppingItem(item.id, {
      quantity: qty,
      unit,
    });
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t("sheet.editShoppingTitle")}
      subtitle={t("sheet.editShoppingSubtitle")}
      heightPct={0.55}
    >
      <div className={uiStyles.sheetScroll}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Field
            label={t("sheet.quantity")}
            value={quantity}
            onChangeText={setQuantity}
            inputMode="decimal"
            style={{ flex: 1 }}
          />

          <div style={{ flex: 2, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: 6,
              }}
            >
              {t("sheet.unit")}
            </div>
            <ChipSelect
              value={unit}
              onChange={setUnit}
              options={units.map((x) => ({
                value: x,
                label: unitLabel(x, t, 1),
              }))}
            />
          </div>
        </div>

        <Button label={t("common.save")} onPress={handleSave} icon={<Save size={18} />} />
      </div>
    </BottomSheet>
  );
}
