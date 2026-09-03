/**
 * Co-oking design tokens, ported from the web app's oklch system to hex so plain
 * React Native StyleSheet can consume them. Values are close approximations of
 * the original oklch() colors in the web project's styles.css.
 */

export const colors = {
  background: "#FDFBF6",
  foreground: "#302A21",
  card: "#FFFFFF",
  cardForeground: "#302A21",
  primary: "#4A7B5B",
  primaryForeground: "#F7FBF7",
  secondary: "#F0E8D8",
  secondaryForeground: "#3D3323",
  muted: "#F1EEE7",
  mutedForeground: "#897F70",
  accent: "#CC7C42",
  accentForeground: "#FFF7F0",
  destructive: "#C0442F",
  destructiveForeground: "#FDF5F3",
  border: "#E3DDD2",
  ring: "#4A7B5B",

  tile: "#FFFFFF",
  fresh: "#3D8A62",
  freshSoft: "#E0F1E6",
  warn: "#C2792F",
  warnSoft: "#F6E7D5",
  low: "#C4A23C",
  lowSoft: "#F7EDCF",
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
