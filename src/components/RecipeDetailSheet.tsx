import { useState, type ReactNode } from "react";
import { Check, ShoppingCart, Users } from "lucide-react";
import { BottomSheet, uiStyles } from "./ui";
import { FoodIcon } from "./FoodIcon";
import { colors } from "../lib/theme";
import { findConceptById } from "../lib/data";
import { useActiveInventory, usePantry } from "../lib/store";
import { matchRecipe } from "../lib/recipes";
import type { Recipe, RecipeIngredient } from "../lib/types";
import s from "./RecipeDetailSheet.module.css";

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
      <div className={uiStyles.sheetScroll} style={{ gap: 18 }}>
        <div className={s.tagRow}>
          {recipe.tags.map((t) => (
            <span key={t} className={s.tag}>
              <span className={s.tagText}>{t}</span>
            </span>
          ))}
        </div>

        <div className={s.metaRow}>
          <span className={s.meta}>{recipe.timeMinutes} min</span>
          <span className={s.meta}>{recipe.servings} servings</span>
          <span
            className={[s.meta, s.metaStrong].join(" ")}
            style={{ color: match.missingCount === 0 ? colors.fresh : colors.warn }}
          >
            {match.missingCount === 0 ? "Ready to cook" : `${match.missingCount} missing`}
          </span>
        </div>

        <Section title={`You have (${match.have.length})`}>
          {match.have.map((ing) => (
            <div key={ing.conceptId} className={[s.ingRow, s.ingRowHave].join(" ")}>
              <FoodIcon
                iconKey={ing.conceptId}
                category={active.find((i) => i.conceptId === ing.conceptId)?.category ?? "other"}
                size={36}
              />
              <div className={s.ingText}>
                <div className={s.ingName}>{ing.displayName}</div>
                <div className={s.ingQty}>
                  {ing.quantity} {ing.unit}
                </div>
              </div>
              <Check size={18} color={colors.fresh} />
            </div>
          ))}
          {match.have.length === 0 && <p className={s.empty}>Nothing from this recipe yet.</p>}
        </Section>

        <Section title={`Missing (${match.missing.length})`}>
          {match.missing.map((ing) => {
            const added = addedIds.has(ing.conceptId);
            return (
              <div key={ing.conceptId} className={[s.ingRow, s.ingRowMissing].join(" ")}>
                <FoodIcon
                  iconKey={ing.conceptId}
                  category={findConceptById(ing.conceptId)?.category ?? "other"}
                  size={36}
                />
                <div className={s.ingText}>
                  <div className={s.ingName}>{ing.displayName}</div>
                  <div className={s.ingQty}>
                    {ing.quantity} {ing.unit}
                  </div>
                </div>
                <button
                  type="button"
                  className={["resetButton", s.iconBtn].join(" ")}
                  onClick={() => addMissing(ing)}
                  disabled={added}
                  aria-label={added ? "Added to list" : "Add to shopping list"}
                >
                  {added ? (
                    <Check size={16} color={colors.fresh} />
                  ) : (
                    <ShoppingCart size={16} color={colors.foreground} />
                  )}
                </button>
                <span className={s.iconBtn}>
                  <Users size={16} color={colors.mutedForeground} />
                </span>
              </div>
            );
          })}
          {match.missing.length === 0 && (
            <p className={s.empty}>You have everything you need.</p>
          )}
        </Section>

        <Section title="Instructions">
          {recipe.instructions.map((step, idx) => (
            <div key={idx} className={s.stepRow}>
              <div className={s.stepNum}>
                <span className={s.stepNumText}>{idx + 1}</span>
              </div>
              <p className={s.stepText}>{step}</p>
            </div>
          ))}
        </Section>
      </div>
    </BottomSheet>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={s.section}>
      <div className={s.sectionTitle}>{title.toUpperCase()}</div>
      <div className={s.sectionList}>{children}</div>
    </div>
  );
}
