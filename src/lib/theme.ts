/**
 * Co-oking design tokens, ported from the web app's oklch system to hex so plain
 * React Native StyleSheet can consume them. Values are close approximations of
 * the original oklch() colors in the web project's styles.css.
 */

export const colors = {
  background: "#FFFFFF",
  foreground: "#241A1C",
  card: "#FFFFFF",
  cardForeground: "#241A1C",
  primary: "#F0384B",
  primaryForeground: "#FFFFFF",
  secondary: "#FFE7DE",
  secondaryForeground: "#9E2A38",
  muted: "#FBF2EE",
  mutedForeground: "#8A7A74",
  accent: "#FFB020",
  accentForeground: "#3D2A05",
  destructive: "#D61F3C",
  destructiveForeground: "#FFFFFF",
  border: "#F1E7E2",
  ring: "#F0384B",

  tile: "#FFFFFF",
  fresh: "#4FA300",
  freshSoft: "#E7F4D4",
  warn: "#E8590C",
  warnSoft: "#FCE7D3",
  low: "#C98A00",
  lowSoft: "#FBEFC9",
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  "2xl": 22,
  "3xl": 26,
  full: 999,
} as const;

export const spacing = (n: number) => n * 4;

export const font = {
  // Mirrors --font-sans in src/styles/tokens.css. Space Grotesk + DM Sans are
  // self-hosted via @fontsource and imported in src/main.tsx.
  sans: '"Space Grotesk", "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};
