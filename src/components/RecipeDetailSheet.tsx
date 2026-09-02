import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Check, ShoppingCart, Users } from "lucide-react-native";
import { BottomSheet } from "./ui";
import { FoodIcon } from "./FoodIcon";
import { colors, radius } from "../lib/theme";
import { findConceptById } from "../lib/data";
import { useActiveInventory, usePantry } from "../lib/store";
import { matchRecipe } from "../lib/recipes";
import type { Recipe, RecipeIngredient } from "../lib/types";

export function RecipeDetailSheet({
  recipe,
  open,
  onClose,
}: {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
}) {
  const { addShoppingItem } = usePantry();
  const active = useActiveInventory();
  const match = matchRecipe(recipe, active);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const addMissing = (ing: RecipeIngredient) => {
    addShoppingItem({
      conceptId: ing.conceptId,
      displayName: ing.displayName,
      quantity: ing.quantity,
      unit: ing.unit,
      category: findConceptById(ing.conceptId)?.category ?? "other",
      source: "from-recipe",
    });
    setAddedIds((prev) => new Set(prev).add(ing.conceptId));
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={recipe.name} subtitle={recipe.description}>
      <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {recipe.tags.map((t) => (
            <View key={t} style={s.tag}>
              <Text style={s.tagText}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 16 }}>
          <Text style={s.meta}>{recipe.timeMinutes} min</Text>
          <Text style={s.meta}>{recipe.servings} servings</Text>
          <Text style={[s.meta, { color: match.missingCount === 0 ? colors.fresh : colors.warn, fontWeight: "700" }]}>
            {match.missingCount === 0 ? "Ready to cook" : `${match.missingCount} missing`}
          </Text>
        </View>

        <Section title={`You have (${match.have.length})`}>
          {match.have.map((ing) => (
            <View key={ing.conceptId} style={[s.ingRow, { backgroundColor: colors.muted }]}>
              <FoodIcon
                iconKey={ing.conceptId}
                category={active.find((i) => i.conceptId === ing.conceptId)?.category ?? "other"}
                size={36}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.ingName}>{ing.displayName}</Text>
                <Text style={s.ingQty}>
                  {ing.quantity} {ing.unit}
                </Text>
              </View>
              <Check size={18} color={colors.fresh} />
            </View>
          ))}
          {match.have.length === 0 && <Text style={s.empty}>Nothing from this recipe yet.</Text>}
        </Section>

        <Section title={`Missing (${match.missing.length})`}>
          {match.missing.map((ing) => {
            const added = addedIds.has(ing.conceptId);
            return (
              <View key={ing.conceptId} style={[s.ingRow, s.ingRowBorder]}>
                <FoodIcon
                  iconKey={ing.conceptId}
                  category={findConceptById(ing.conceptId)?.category ?? "other"}
                  size={36}
                />
                <View style={{ flex: 1 }}>
                  <Text style={s.ingName}>{ing.displayName}</Text>
                  <Text style={s.ingQty}>
                    {ing.quantity} {ing.unit}
                  </Text>
                </View>
                <Pressable style={s.iconBtn} onPress={() => addMissing(ing)} disabled={added}>
                  {added ? (
                    <Check size={16} color={colors.fresh} />
                  ) : (
                    <ShoppingCart size={16} color={colors.foreground} />
                  )}
                </Pressable>
                <Pressable style={s.iconBtn}>
                  <Users size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            );
          })}
          {match.missing.length === 0 && <Text style={s.empty}>You have everything you need.</Text>}
        </Section>

        <Section title="Instructions">
          {recipe.instructions.map((step, idx) => (
            <View key={idx} style={s.stepRow}>
              <View style={s.stepNum}>
                <Text style={s.stepNumText}>{idx + 1}</Text>
              </View>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </Section>
      </ScrollView>
    </BottomSheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  tag: { backgroundColor: colors.muted, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, color: colors.mutedForeground, fontWeight: "600" },
  meta: { fontSize: 13, color: colors.mutedForeground },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, color: colors.mutedForeground },
  ingRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.md, padding: 8 },
  ingRowBorder: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  ingName: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  ingQty: { fontSize: 12, color: colors.mutedForeground },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  empty: { fontSize: 13, color: colors.mutedForeground, fontStyle: "italic" },
  stepRow: { flexDirection: "row", gap: 12 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { fontSize: 12, fontWeight: "700", color: colors.foreground },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.foreground },
});
