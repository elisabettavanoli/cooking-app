import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { BottomSheet, Button } from "./ui";
import { colors } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { foodName } from "../lib/foodNames";
import { unitLabel } from "../lib/units";
import type { ShoppingItem } from "../lib/types";
import s from "./ConfirmPurchaseSheet.module.css";

/**
 * Shown when checking off a shopping-list item. The list itself doesn't show
 * quantity anymore (see ListTab) — this is where you say how many you
 * actually got, right before it lands in the kitchen.
 */
export function ConfirmPurchaseSheet({
  item,
  open,
  onClose,
  onConfirm,
}: {
  item: ShoppingItem;
  open: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}) {
  const { t, lang } = useI18n();
  const [quantity, setQuantity] = useState(item.quantity);

  const step = item.unit === "g" || item.unit === "ml" ? 50 : 1;
  const round = (n: number) => Number(n.toFixed(2));
  const setStep = (delta: number) =>
    setQuantity((q) => Math.max(step, round(q + delta)));

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={foodName(item.conceptId, lang, item.displayName)}
      subtitle={t(`category.${item.category}`)}
      heightPct={0.45}
    >
      <p className={s.intro}>{t("sheet.confirmPurchaseIntro")}</p>

      <div className={s.sectionLabel}>{t("sheet.quantity")}</div>
      <div className={s.qtyRow}>
        <button
          type="button"
          className={s.qtyBtn}
          onClick={() => setStep(-step)}
          aria-label={t("sheet.decrease")}
        >
          <Minus size={18} color={colors.foreground} />
        </button>
        <div className={s.qtyValueWrap}>
          <span className={s.qtyValue}>{quantity}</span>
          <span className={s.qtyUnit}>{unitLabel(item.unit, t, quantity)}</span>
        </div>
        <button
          type="button"
          className={s.qtyBtn}
          onClick={() => setStep(step)}
          aria-label={t("sheet.increase")}
        >
          <Plus size={18} color={colors.foreground} />
        </button>
      </div>

      <Button
        label={t("sheet.addToKitchenBtn")}
        style={{ width: "100%" }}
        onPress={() => {
          onConfirm(quantity);
          onClose();
        }}
      />
    </BottomSheet>
  );
}
