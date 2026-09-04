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
- **State**: `src/lib/store.tsx` — React context. Two providers, picked by
  whether Supabase is configured: `LocalCookingProvider` persists the whole
  state as one blob to IndexedDB via `src/lib/storage.ts` (idb-keyval, key
  `cooking-store-v1`) for local-only / test mode; `RemoteCookingProvider`
  (signed in) does optimistic local updates + per-entity Supabase reads/writes
  through `src/lib/remote.ts` (`fetchAll`, `insert*/patch*/delete*` per row for
  `pantry_items` / `shopping_items` / `profiles`), with a realtime channel
  (`cooking:<userId>`) that debounce-resyncs on any change to the user's rows.
  Recipes stay on-device in both modes. Hydration is async and gated by
  `hydrated`.
- **Server stand-ins**: `src/lib/ai.ts` runs deterministic local logic; swap for
  `fetch()` when a backend exists (keep the signatures).
- **i18n**: `src/lib/i18n.tsx` — `<I18nProvider>` + `useI18n()` → `{ lang, setLang, t }`.
  String tables live in that file (`en`/`it` complete; `de`/`fr`/`es` cover the
  shell and fall back to English). `t("some.key", { n })` interpolates `{n}` and
  picks plural forms. Chosen language persists in `localStorage` under
  `cooking-lang`; `src/lib/category/locales.ts` `getAppLang()` reads the same key.
  Language picker is in the Profile tab (`ProfileTab`); it currently offers only
  `en`/`it` (`LANGUAGE_ORDER` in `i18n.tsx`) since the others aren't
  content-complete — the `de`/`fr`/`es` tables and lexicons stay in place. Category labels are
  translated under the `category.<key>` keys (English mirrors `categoryMeta` in
  `data.ts`; keep in sync by hand). Curated ingredient names are translated in
  `src/lib/foodNames.ts` (keyed by concept id, `it` only — other languages fall
  back to the concept's English `displayName`); render them with
  `foodName(conceptId, lang, item.displayName)`. Recipe-catalog ingredient names
  (`src/lib/recipes.ts`) are still English-only.
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
- **Backend**: Supabase. Client in `src/lib/supabase.ts` (null when
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are unset — app then runs
  local-only). Auth context `src/lib/auth.tsx` (email magic link), login screen
  `src/components/AuthGate.tsx` wraps the shell in `App.tsx`. Env: `.env.example`
  → `.env.local`. Schema + RLS in `supabase/schema.sql` (idempotent, applied to
  the live project; no versioned migrations yet). Store persistence already runs
  on per-entity Supabase queries + realtime when signed in (see **State**);
  `pantry_items` / `shopping_items` / `profiles` are live. `share_requests`
  exists in the schema (table + RLS + `ShareRequest` type + `requestsEnabled`
  profile flag) but has no client code or UI yet.
- **Community discovery**: `src/lib/community.ts` (pure Supabase fns, like
  `remote.ts`) + `src/lib/community-store.tsx` (`CommunityProvider` /
  `useCommunity()`, mounted under `CookingProvider` in `App.tsx`). Remote-only:
  `enabled` is false in local mode / tests and every action is an inert no-op.
  Drives the `nearby` tab (cross-community ingredient search, join/create/leave)
  and the Leaflet map of `share_on_map` kitchens. Schema: `communities`,
  `community_members`, and the `co_*` RPCs in `supabase/schema.sql`.
- **Profile tab** (`src/screens/ProfileTab.tsx`): display name, language picker,
  the two kitchen-sharing switches (`shareWithCommunities` / `shareOnMap` on
  `UserProfile`) + `requestsEnabled`, logout.
- **Map**: `src/components/NearbyMap.tsx` uses Leaflet + OSM tiles (tiles are
  online-only, not precached). Leaflet + its CSS load via dynamic `import()`
  inside the effect → own lazy chunk, never in the local-only/test bundle
  (`NearbyMap` mounts only when `useCommunity().enabled`). `vite.config.ts`
  aliases the bare `leaflet` specifier to `leaflet/dist/leaflet.js` (its `main`
  is unbundled source). Coarse location via `src/lib/geo.ts` `getCoarsePosition`
  (rounds to ~2 dp; resolves `null`, never throws).

## Not yet done

- Capacitor wrapper (`ios/`, `android/`) for the app stores.
- `share_requests` flow: client fns (create / accept / decline) + send UI + an
  in-app inbox with realtime resync (no PWA push on iOS).
- Versioned Supabase migrations (`supabase/migrations/`) — currently one
  idempotent `schema.sql`.
- iOS `apple-touch-startup-image` splash screens.
- i18n: `de`/`fr`/`es` are shell-only; `foodNames.ts` is `it`-only; recipe-catalog
  ingredient names (`recipes.ts`) are English-only with no per-language shape.
