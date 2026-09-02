import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Sparkles, Wand2 } from "lucide-react-native";
import { BottomSheet, Button, Field } from "./ui";
import { colors, radius } from "../lib/theme";
import { useActiveInventory, usePantry } from "../lib/store";
import { generateRecipe } from "../lib/ai";
import type { Recipe } from "../lib/types";

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
      <View style={{ gap: 16 }}>
        <Field
          label="What are you in the mood for? (optional)"
          value={mood}
          onChangeText={setMood}
          placeholder="e.g. something spicy, quick, breakfast"
        />

        <View style={s.note}>
          <Text style={s.noteText}>
            Using {conceptIds.length} ingredient{conceptIds.length !== 1 ? "s" : ""} from your kitchen.
          </Text>
          {selectedConcepts.length > 0 && (
            <Text style={s.clear} onPress={clearSelectedConcepts}>
              Clear selection
            </Text>
          )}
        </View>

        <View style={s.localBadge}>
          <Sparkles size={13} color={colors.mutedForeground} />
          <Text style={s.localText}>
            Offline mode: picks the closest catalog recipe. Real AI generation is wired up later.
          </Text>
        </View>

        <Button
          label="Generate recipe"
          onPress={handleGenerate}
          disabled={conceptIds.length === 0}
          icon={<Wand2 size={18} color={colors.primaryForeground} />}
        />
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  note: { backgroundColor: colors.muted, borderRadius: radius.md, padding: 12, gap: 4 },
  noteText: { fontSize: 13, color: colors.mutedForeground },
  clear: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  localBadge: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  localText: { flex: 1, fontSize: 12, color: colors.mutedForeground, lineHeight: 17 },
});
