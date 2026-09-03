# Co-oking — web app (Vite + React + PWA)

Repo / package / Cloudflare project: **`cooking-app`**. User-facing name
(PWA manifest, `<title>`, login header): **Co-oking**. The lowercase word
`pantry` that remains in the code is a *food category* ("dry goods"), not the
old project name — leave it.

This project **was** an Expo / React Native app (SDK 54). It is now a plain
**web app**: Vite 8 + React 19 (react-dom), TypeScript, installable as a PWA
via `vite-plugin-pwa`. The goal is "Add to Home Screen" on iOS/Android that
behaves like a native app; a Capacitor wrapper for the app stores is a planned
later phase (not set up yet).

## Stack / conventions

- **Build**: Vite. `npm run dev` (5173), `npm run build` (`tsc -b && vite build` → `dist/`),
  `npm run preview` (4173), `npm run typecheck`, `npm test` (vitest).
- **No React Native.** Do not add `react-native`, `expo`, or `react-native-web`.
  UI is plain DOM: `div`/`button`/`input` + **CSS Modules** (`*.module.css`) per
  component. Icons: `lucide-react`.
- **Design tokens**: `src/lib/theme.ts` (TS, for JS-side colors) is mirrored by
  `src/styles/tokens.css` (`:root` custom properties, for CSS Modules). Keep the
  two in sync by hand.
- **State**: `src/lib/store.tsx` — React context, persisted to IndexedDB via
  `src/lib/storage.ts` (idb-keyval). Storage key `cooking-store-v1`. Hydration is
  async and gated by `hydrated`.
- **Server stand-ins**: `src/lib/ai.ts` runs deterministic local logic; swap for
  `fetch()` when a backend exists (keep the signatures).
- **i18n**: `src/lib/i18n.tsx` — `<I18nProvider>` + `useI18n()` → `{ lang, setLang, t }`.
  String tables live in that file (`en`/`it` complete; `de`/`fr`/`es` cover the
  shell and fall back to English). `t("some.key", { n })` interpolates `{n}` and
  picks plural forms. Chosen language persists in `localStorage` under
  `cooking-lang`; `src/lib/category/locales.ts` `getAppLang()` reads the same key.
  Language picker is in the Community tab (`NearbyTab`). Category labels
  (`categoryMeta` in `data.ts`) are not translated yet.
- **Sheets**: `BottomSheet` in `src/components/ui.tsx` is a native `<dialog>`.
- **PWA**: `vite-plugin-pwa` in `vite.config.ts` (generateSW, `registerType: prompt`).
  Icons in `public/` (regenerate: `npx pwa-assets-generator --preset minimal-2023
  assets/icon.png`, then move `pwa-*`/`maskable-*`/`apple-touch-icon-*`/`favicon.ico`
  into `public/`). SW update UI: `src/components/UpdateToast.tsx`.
- iOS/standalone meta tags live in `index.html`. Safe areas via
  `env(safe-area-inset-*)` and the `--safe-*` tokens; heights use `dvh`.
- **Hosting**: Cloudflare Workers static assets (`wrangler.toml` `[assets]`,
  `directory = "./dist"`, `not_found_handling = "single-page-application"` for the
  SPA fallback). Deploy: `npx wrangler deploy`, or Cloudflare git integration
  (build `npm run build`, deploy `npx wrangler deploy`).
- **Backend (in progress)**: Supabase. Client in `src/lib/supabase.ts` (null
  when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are unset — app then runs
  local-only). Auth context `src/lib/auth.tsx` (email magic link), login screen
  `src/components/AuthGate.tsx` wraps the shell in `App.tsx`. Env: `.env.example`
  → `.env.local`. Next: Postgres schema (`households`, `household_members`,
  `pantry_items`, …) + RLS, then move `store.tsx` persistence off the single
  IndexedDB blob onto per-entity Supabase queries + realtime.

## Not yet done

- Capacitor wrapper (`ios/`, `android/`) for the app stores.
- Supabase schema + RLS; `store.tsx` still persists one local blob (see above).
- iOS `apple-touch-startup-image` splash screens.
