import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { BottomSheet, Button, Field } from "./ui";
import { colors } from "../lib/theme";
import { useActiveInventory, usePantry } from "../lib/store";
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
  const { selectedConcepts, clearSelectedConcepts } = usePantry();
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
      title="AI recipe"
      subtitle={`Based on ${selectedConcepts.length > 0 ? "selected" : "available"} ingredients.`}
      heightPct={0.7}
    >
      <div className={s.wrap}>
        <Field
          label="What are you in the mood for? (optional)"
          value={mood}
          onChangeText={setMood}
          placeholder="e.g. something spicy, quick, breakfast"
        />

        <div className={s.note}>
          <span className={s.noteText}>
            Using {conceptIds.length} ingredient{conceptIds.length !== 1 ? "s" : ""} from your
            kitchen.
          </span>
          {selectedConcepts.length > 0 && (
            <button
              type="button"
              className={["resetButton", s.clear].join(" ")}
              onClick={clearSelectedConcepts}
            >
              Clear selection
            </button>
          )}
        </div>

        <div className={s.localBadge}>
          <Sparkles size={13} color={colors.mutedForeground} />
          <span className={s.localText}>
            Offline mode: picks the closest catalog recipe. Real AI generation is wired up later.
          </span>
        </div>

        <Button
          label="Generate recipe"
          onPress={handleGenerate}
          disabled={conceptIds.length === 0}
          icon={<Wand2 size={18} color={colors.primaryForeground} />}
        />
      </div>
    </BottomSheet>
  );
}
