/**
 * Localised unit rendering. `unit.<key>` lives in `i18n.tsx` (plural pair where
 * the word inflects, plain string for the invariant abbreviations g/kg/ml/l).
 * Always render a `Unit` through here — never inline `{item.unit}`.
 */
import type { Translate } from "./i18n";
import type { Unit } from "./types";

/** The unit word alone, pluralised on `quantity` (e.g. "pezzo" vs "pezzi"). */
export function unitLabel(unit: Unit, t: Translate, quantity = 1): string {
  return t(`unit.${unit}`, { n: quantity });
}

/** Number + localised unit: "250 g", "2 pezzi", "1 confezione". */
export function formatAmount(quantity: number, unit: Unit, t: Translate): string {
  return `${quantity} ${unitLabel(unit, t, quantity)}`;
}

/** Units short enough to butt up against the number with no space ("500g"). */
const TIGHT_UNITS = new Set<Unit>(["g", "kg", "ml", "l"]);

/**
 * Compact form for the Kitchen tile's corner badge — language-agnostic (unit
 * codes, not translated words), so it stays tiny: "3" for 3 pieces, "500g" for
 * 500 g, "2 pack" for 2 packs. Only called when quantity is set — the badge
 * itself is hidden otherwise.
 */
export function compactAmount(quantity: number, unit: Unit): string {
  if (unit === "piece") return String(quantity);
  return TIGHT_UNITS.has(unit) ? `${quantity}${unit}` : `${quantity} ${unit}`;
}
