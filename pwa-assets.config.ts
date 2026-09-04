import { defineConfig } from "@vite-pwa/assets-generator/config";

// Regenerate the PWA icons from assets/icon.svg:
//   npx pwa-assets-generator
//   then move pwa-*/maskable-*/apple-touch-icon-*/favicon.ico from assets/ into public/
//
// The source is a full-bleed coral tile, so every derivative bleeds to the edge
// instead of floating the mark on a white card: padding 0 everywhere, and the
// maskable / apple canvases are filled coral rather than the default white.
const CORAL = "#F0384B";

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  images: ["assets/icon.svg"],
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, "favicon.ico"]],
      padding: 0,
    },
    maskable: {
      sizes: [512],
      padding: 0,
      resizeOptions: { fit: "contain", background: CORAL },
    },
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: { fit: "contain", background: CORAL },
    },
  },
});
