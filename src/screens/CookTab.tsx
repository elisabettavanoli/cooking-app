import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ChefHat, Clock, Leaf, Sparkles, Users } from "lucide-react-native";
import { Button } from "../components/ui";
import { colors, radius } from "../lib/theme";
import { useActiveInventory, usePantry } from "../lib/store";
import { recipeMatches } from "../lib/recipes";
import { RecipeDetailSheet } from "../components/RecipeDetailSheet";
import { AiRecipeSheet } from "../components/AiRecipeSheet";
import type { Recipe } from "../lib/types";

export function CookTab() {
  const { selectedConcepts, clearSelectedConcepts } = usePantry();
  const activeInventory = useActiveInventory();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [showAi, setShowAi] = useState(false);

  const matches = useMemo(
    () => recipeMatches(selectedConcepts.length > 0 ? selectedConcepts : undefined, activeInventory),
    [selectedConcepts, activeInventory],
  );
  const topMatches = matches.slice(0, 10);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>
          {selectedConcepts.length > 0 ? "Cook with selected" : "What can I cook?"}
        </Text>
        <Text style={styles.subtitle}>
          {selectedConcepts.length > 0
            ? `${selectedConcepts.length} ingredient${selectedConcepts.length > 1 ? "s" : ""} selected`
            : `${activeInventory.length} items in your kitchen`}
        </Text>

        {selectedConcepts.length > 0 && (
          <View style={styles.selectedBar}>
            <Text style={styles.selectedText}>Using selected ingredients</Text>
            <Text style={styles.clear} onPress={clearSelectedConcepts}>
              Clear
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          <Button
            label="AI recipe"
            variant="outline"
            style={{ flex: 1 }}
            disabled={activeInventory.length === 0}
            onPress={() => setShowAi(true)}
            icon={<Sparkles size={16} color={colors.foreground} />}
          />
          <Button
            label="Community"
            variant="outline"
            style={{ flex: 1 }}
            icon={<Users size={16} color={colors.foreground} />}
          />
        </View>

        <Text style={styles.sectionTitle}>SUGGESTED RECIPES</Text>

        {topMatches.length === 0 && (
          <View style={styles.emptyCard}>
            <ChefHat size={32} color={colors.mutedForeground} />
            <Text style={styles.emptyTitle}>No catalog matches yet</Text>
            <Text style={styles.emptyText}>Add more ingredients or try an AI recipe.</Text>
          </View>
        )}

        {topMatches.map((match) => {
          const r = match.recipe;
          const missing = match.missing.length;
          return (
            <Pressable key={r.id} style={styles.card} onPress={() => setSelectedRecipe(r)}>
              <View style={styles.cardIcon}>
                <ChefHat size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName}>{r.name}</Text>
                  <View
                    style={[
                      styles.pill,
                      { backgroundColor: missing === 0 ? colors.freshSoft : colors.warnSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: missing === 0 ? colors.fresh : colors.warn },
                      ]}
                    >
                      {missing === 0 ? "Ready" : `${missing} missing`}
                    </Text>
                  </View>
                </View>
                <Text numberOfLines={2} style={styles.cardDesc}>
                  {r.description}
                </Text>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Clock size={12} color={colors.mutedForeground} />
                    <Text style={styles.metaText}>{r.timeMinutes} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Leaf size={12} color={colors.mutedForeground} />
                    <Text style={styles.metaText}>{match.have.length} have</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Users size={12} color={colors.mutedForeground} />
                    <Text style={styles.metaText}>{r.servings} servings</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {showAi && (
        <AiRecipeSheet
          open={showAi}
          onClose={() => setShowAi(false)}
          onGenerated={(recipe) => {
            setGeneratedRecipe(recipe);
            setShowAi(false);
          }}
        />
      )}
      {selectedRecipe && (
        <RecipeDetailSheet
          recipe={selectedRecipe}
          open={!!selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
      {generatedRecipe && (
        <RecipeDetailSheet
          recipe={generatedRecipe}
          open={!!generatedRecipe}
          onClose={() => setGeneratedRecipe(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: colors.foreground },
  subtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  selectedBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  selectedText: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  clear: { fontSize: 14, fontWeight: "600", color: colors.primary },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.mutedForeground,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyCard: {
    alignItems: "center",
    gap: 6,
    padding: 24,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  emptyText: { fontSize: 13, color: colors.mutedForeground },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "#E7F0EA",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardName: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.foreground },
  pill: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 11, fontWeight: "700" },
  cardDesc: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: colors.mutedForeground },
});
