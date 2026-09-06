/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// PWA icons live in public/ and are (re)generated from assets/icon.svg with:
//   npx pwa-assets-generator            (config in pwa-assets.config.ts)
//   (then move the pwa-*/maskable-*/apple-touch-icon-*/favicon.ico into public/,
//    and copy assets/icon.svg to public/favicon.svg)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "generateSW",
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["favicon.svg", "favicon.ico", "apple-touch-icon-180x180.png"],
      manifest: {
        id: "/",
        name: "Co-oking",
        short_name: "Co-oking",
        description:
          "Track what's in your kitchen, see what you can cook, and share with neighbours.",
        start_url: "/?source=pwa",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#FFFFFF",
        background_color: "#FFFFFF",
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
        // Includes the two alternate FoodIcon SVG sets under public/icons/
        // (~1.8MB, ~300 small files) so every icon style works offline right
        // after install, same as the rest of the app — not just once a given
        // icon has been fetched over the network at least once.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
      },
      devOptions: { enabled: false },
    }),
  ],
  // `.trycloudflare.com` is allowed so a quick tunnel can be used to test the
  // installed PWA on a phone (needs HTTPS). Harmless: dev/preview only.
  // Leaflet's package `main` is the unbundled source; point the bare specifier
  // at the prebuilt production file so the lazy map chunk stays small. Exact
  // match only — `leaflet/dist/leaflet.css` must still resolve normally.
  resolve: { alias: [{ find: /^leaflet$/, replacement: "leaflet/dist/leaflet.js" }] },
  server: { host: true, port: 5173, allowedHosts: [".trycloudflare.com"] },
  preview: { host: true, port: 4173, allowedHosts: [".trycloudflare.com"] },
  build: { outDir: "dist", sourcemap: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Tests run the app in local-only mode — never against a real Supabase
    // project, even when .env.local is present.
    env: { VITE_SUPABASE_URL: "", VITE_SUPABASE_ANON_KEY: "" },
  },
});
