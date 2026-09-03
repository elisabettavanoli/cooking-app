import { useMemo, useState } from "react";
import { ChefHat, Clock, Leaf, Sparkles, Users } from "lucide-react";
import { Button } from "../components/ui";
import { colors } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { useActiveInventory, useCooking } from "../lib/store";
import { recipeMatches } from "../lib/recipes";
import { RecipeDetailSheet } from "../components/RecipeDetailSheet";
import { AiRecipeSheet } from "../components/AiRecipeSheet";
import type { Recipe } from "../lib/types";
import s from "./CookTab.module.css";

export function CookTab() {
  const { t } = useI18n();
  const { selectedConcepts, clearSelectedConcepts } = useCooking();
  const activeInventory = useActiveInventory();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [showAi, setShowAi] = useState(false);

  const matches = useMemo(
    () =>
      recipeMatches(
        selectedConcepts.length > 0 ? selectedConcepts : undefined,
        activeInventory,
      ),
    [selectedConcepts, activeInventory],
  );
  const topMatches = matches.slice(0, 10);

  return (
    <div className={s.screen}>
      <div className={s.scroll}>
        <h1 className={s.title}>
          {selectedConcepts.length > 0 ? t("cook.titleSelected") : t("cook.titleDefault")}
        </h1>
        <p className={s.subtitle}>
          {selectedConcepts.length > 0
            ? t("cook.subtitleSelected", { n: selectedConcepts.length })
            : t("cook.subtitleItems", { n: activeInventory.length })}
        </p>

        {selectedConcepts.length > 0 && (
          <div className={s.selectedBar}>
            <span className={s.selectedText}>{t("cook.usingSelected")}</span>
            <button
              type="button"
              className={["resetButton", s.clear].join(" ")}
              onClick={clearSelectedConcepts}
            >
              {t("common.clear")}
            </button>
          </div>
        )}

        <div className={s.actionsRow}>
          <Button
            label={t("cook.aiRecipe")}
            variant="outline"
            style={{ flex: 1 }}
            disabled={activeInventory.length === 0}
            onPress={() => setShowAi(true)}
            icon={<Sparkles size={16} color={colors.foreground} />}
          />
          <Button
            label={t("cook.community")}
            variant="outline"
            style={{ flex: 1 }}
            icon={<Users size={16} color={colors.foreground} />}
          />
        </div>

        <p className={s.sectionTitle}>{t("cook.suggested").toUpperCase()}</p>

        {topMatches.length === 0 && (
          <div className={s.emptyCard}>
            <ChefHat size={32} color={colors.mutedForeground} />
            <p className={s.emptyTitle}>{t("cook.noMatchTitle")}</p>
            <p className={s.emptyText}>{t("cook.noMatchText")}</p>
          </div>
        )}

        {topMatches.map((match) => {
          const r = match.recipe;
          const missing = match.missing.length;
          return (
            <button
              key={r.id}
              type="button"
              className={["resetButton", s.card].join(" ")}
              onClick={() => setSelectedRecipe(r)}
            >
              <span className={s.cardIcon}>
                <ChefHat size={24} color={colors.primary} />
              </span>
              <span className={s.cardBody}>
                <span className={s.cardTop}>
                  <span className={s.cardName}>{r.name}</span>
                  <span
                    className={s.pill}
                    style={{ backgroundColor: missing === 0 ? colors.freshSoft : colors.warnSoft }}
                  >
                    <span
                      className={s.pillText}
                      style={{ color: missing === 0 ? colors.fresh : colors.warn }}
                    >
                      {missing === 0 ? t("cook.ready") : t("cook.missing", { n: missing })}
                    </span>
                  </span>
                </span>
                <span className={s.cardDesc}>{r.description}</span>
                <span className={s.cardMeta}>
                  <span className={s.metaItem}>
                    <Clock size={12} color={colors.mutedForeground} />
                    <span className={s.metaText}>{t("cook.minutes", { n: r.timeMinutes })}</span>
                  </span>
                  <span className={s.metaItem}>
                    <Leaf size={12} color={colors.mutedForeground} />
                    <span className={s.metaText}>{t("cook.have", { n: match.have.length })}</span>
                  </span>
                  <span className={s.metaItem}>
                    <Users size={12} color={colors.mutedForeground} />
                    <span className={s.metaText}>{t("cook.servings", { n: r.servings })}</span>
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

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
    </div>
  );
}
