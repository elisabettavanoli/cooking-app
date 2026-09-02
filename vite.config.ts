/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// PWA icons live in public/ and are (re)generated with:
//   npx pwa-assets-generator --preset minimal-2023 assets/icon.png
//   (then move the pwa-*/maskable-*/apple-touch-icon-*/favicon.ico into public/)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "generateSW",
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png"],
      manifest: {
        id: "/",
        name: "Pantry",
        short_name: "Pantry",
        description:
          "Track what's in your kitchen, see what you can cook, and share with neighbours.",
        start_url: "/?source=pwa",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#FDFBF6",
        background_color: "#FDFBF6",
        categories: ["food", "lifestyle", "utilities"],
        icons: [
          { src: "/pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: { outDir: "dist", sourcemap: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
