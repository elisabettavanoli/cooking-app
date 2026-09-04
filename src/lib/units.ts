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
