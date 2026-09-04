import { useState } from "react";
import { Info } from "lucide-react";
import { BottomSheet } from "./ui";
import { colors } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import s from "./PageInfo.module.css";

/**
 * Small (ⓘ) button for a screen's header, top-right of the title. Opens a
 * short bottom sheet summarising what the screen is for — no navigation, just
 * an explainer. `title` is the sheet's own title (usually the screen's name).
 */
export function PageInfo({ title, text }: { title: string; text: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={["resetButton", s.btn].join(" ")}
        onClick={() => setOpen(true)}
        aria-label={t("common.pageInfo")}
      >
        <Info size={18} color={colors.mutedForeground} />
      </button>
      {open && (
        <BottomSheet open onClose={() => setOpen(false)} title={title} heightPct={0.4}>
          <p className={s.text}>{text}</p>
        </BottomSheet>
      )}
    </>
  );
}
