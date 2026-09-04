/**
 * User-chosen visual style for food icons across the app: native emoji glyphs,
 * or one of two vendored SVG sets (see `src/components/FoodIcon.tsx` for the
 * lookup logic). Persisted in localStorage like the language choice in
 * `i18n.tsx` — it's a device-level rendering preference, not synced data.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type IconStyle = "emoji" | "openmoji" | "foodiconpack";

export const ICON_STYLE_STORAGE_KEY = "cooking-icon-style";

export const ICON_STYLE_ORDER: IconStyle[] = ["emoji", "openmoji", "foodiconpack"];

function isIconStyle(v: string | null): v is IconStyle {
  return v === "emoji" || v === "openmoji" || v === "foodiconpack";
}

function readStoredStyle(): IconStyle {
  try {
    const v = localStorage.getItem(ICON_STYLE_STORAGE_KEY);
    return isIconStyle(v) ? v : "emoji";
  } catch {
    return "emoji";
  }
}

interface IconStyleValue {
  iconStyle: IconStyle;
  setIconStyle: (style: IconStyle) => void;
}

const IconStyleContext = createContext<IconStyleValue | null>(null);

export function IconStyleProvider({ children }: { children: React.ReactNode }) {
  const [iconStyle, setIconStyleState] = useState<IconStyle>(readStoredStyle);

  const setIconStyle = useCallback((next: IconStyle) => {
    setIconStyleState(next);
    try {
      localStorage.setItem(ICON_STYLE_STORAGE_KEY, next);
    } catch {
      // ignore — the choice still applies for this session
    }
  }, []);

  const value = useMemo<IconStyleValue>(() => ({ iconStyle, setIconStyle }), [iconStyle, setIconStyle]);

  return <IconStyleContext.Provider value={value}>{children}</IconStyleContext.Provider>;
}

export function useIconStyle(): IconStyleValue {
  const ctx = useContext(IconStyleContext);
  if (!ctx) throw new Error("useIconStyle must be used within an IconStyleProvider");
  return ctx;
}
