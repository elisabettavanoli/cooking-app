import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { BottomSheet, Button, Field } from "./ui";
import { colors } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { useActiveInventory, useCooking } from "../lib/store";
import { generateRecipe } from "../lib/ai";
import type { Recipe } from "../lib/types";
import s from "./AiRecipeSheet.module.css";

export function AiRecipeSheet({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: (recipe: Recipe) => void;
}) {
  const { t } = useI18n();
  const { selectedConcepts, clearSelectedConcepts } = useCooking();
  const active = useActiveInventory();
  const [mood, setMood] = useState("");

  const conceptIds =
    selectedConcepts.length > 0 ? selectedConcepts : active.map((i) => i.conceptId);

  const handleGenerate = () => {
    if (conceptIds.length === 0) return;
    onGenerated(generateRecipe(conceptIds));
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t("cook.aiRecipe")}
      subtitle={selectedConcepts.length > 0 ? t("sheet.aiSubtitleSelected") : t("sheet.aiSubtitleAvailable")}
      heightPct={0.7}
    >
      <div className={s.wrap}>
        <Field
          label={t("sheet.aiMood")}
          value={mood}
          onChangeText={setMood}
          placeholder={t("sheet.aiMoodPlaceholder")}
        />

        <div className={s.note}>
          <span className={s.noteText}>{t("sheet.aiUsing", { n: conceptIds.length })}</span>
          {selectedConcepts.length > 0 && (
            <button
              type="button"
              className={["resetButton", s.clear].join(" ")}
              onClick={clearSelectedConcepts}
            >
              {t("sheet.aiClearSelection")}
            </button>
          )}
        </div>

        <div className={s.localBadge}>
          <Sparkles size={13} color={colors.mutedForeground} />
          <span className={s.localText}>{t("sheet.aiOffline")}</span>
        </div>

        <Button
          label={t("sheet.aiGenerate")}
          onPress={handleGenerate}
          disabled={conceptIds.length === 0}
          icon={<Wand2 size={18} color={colors.primaryForeground} />}
        />
      </div>
    </BottomSheet>
  );
}
