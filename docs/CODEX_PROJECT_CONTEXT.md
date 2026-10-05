# Co-oking — persistent project context

**Last analyzed:** 2026-10-05 (repository state in this workspace). This is a code-derived reference; repository statements that could not be established are marked **UNKNOWN** or **NEEDS VERIFICATION**. This document is analysis only and does not assert that tests/build were run.

## 1. Project overview

Co-oking (`cooking-app`) is a mobile-first React web application installable as a PWA. It helps people track kitchen ingredients, maintain a shopping list, find recipes that fit their inventory, and (when authenticated against Supabase) discover sharing communities and nearby kitchens. User-facing name in manifest, HTML title, and auth UI is Co-oking; `pantry` in the code is the dry-goods category.

The app supports two runtime modes selected by presence of both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`:

- **Local mode:** no account/login; kitchen and shopping state persist in IndexedDB. Community discovery is disabled.
- **Configured mode:** Supabase email/password auth. Signed-in users use Supabase for inventory, shopping, and profile rows, with optimistic UI and realtime reloads. Recipes remain on-device. Signed-out flow is gated by `AuthGate`.

Primary journeys: add/edit/use kitchen items; search and organize shopping items; mark purchases to move them to the kitchen; select ingredients and browse ranked recipe suggestions; change language/icon style/profile and sharing preferences; authenticate, join/create communities, search opted-in community inventories, and view opted-in map kitchens.

**Current status from code:** functional PWA shell and local inventory/shopping/recipe flows; Supabase auth/data/community/map integration is implemented in client and schema, but live project configuration, deployed schema/policies, provider settings, and end-to-end remote behavior are **NEEDS VERIFICATION**. Borrow/share requests have SQL/type/profile flag scaffolding but no request client flow or inbox. Capacitor is not configured. AI is a local deterministic stand-in, not an AI service.

## 2. Repository map

```text
project/
├── src/
│   ├── App.tsx, main.tsx, MobileShell.tsx, platform.ts
│   ├── screens/                 Kitchen, Cook, List, Nearby, Profile tabs + CSS modules
│   ├── components/              sheets, auth gate, map, food icons, UI primitives, CSS modules
│   ├── lib/                     state, auth, Supabase adapters, data/types, recipes, category, i18n
│   │   └── category/            multilingual normalization/lexicon/cache/resolution + JSON lexicons
│   ├── styles/                  global CSS and tokens
│   └── test/                    Vitest setup
├── public/                      PWA icons and food icon collections (static assets)
├── assets/                      icon master/source assets
├── supabase/schema.sql          idempotent PostgreSQL schema, RLS, RPCs, realtime publication
├── scripts/                     category lexicon generation utility
├── docs/CODEX_PROJECT_CONTEXT.md this document
├── package.json                 scripts and dependencies
├── vite.config.ts               React, PWA, aliases, Vitest config
├── wrangler.toml                Cloudflare static asset SPA hosting
├── index.html                   PWA/iOS metadata and document entry
├── pwa-assets.config.ts         icon generation config
├── tsconfig*.json               TypeScript project configs
├── README.md                    setup/build/PWA notes
└── AGENTS.md                    project-specific architecture/conventions supplied in task
```

There is one runtime application/package, not a monorepo. No server application is present. `public/icons/foodiconpack` and `public/icons/openmoji` are static icon resources, not code modules; exact asset count is not useful to runtime architecture. `dist`, dependencies, and caches are generated/ignored content and were not analyzed. Legacy Expo/React Native project configuration was not found in the relevant source tree; current app is plain DOM React. `src/platform.ts` contains future-compatible Capacitor detection without a Capacitor dependency.

### Important source areas

- `src/main.tsx`: fonts/global styles, category cache warm-up, pinch-gesture prevention, React root.
- `src/App.tsx`: provider composition: `I18nProvider → IconStyleProvider → AuthProvider → AuthGate → CookingProvider → CommunityProvider → MobileShell + UpdateToast`.
- `src/MobileShell.tsx`: local active-tab state and bottom navigation; tab contents mount conditionally, so inactive screens unmount.
- `src/screens/`: user-facing feature composition. Each has a CSS module.
- `src/components/ui.tsx`: shared controls and native `<dialog>` `BottomSheet`; other components implement focused sheets and auth/map/icon UI.
- `src/lib/store.tsx`: central store contract and separate local/remote provider implementations.
- `src/lib/remote.ts`: `pantry_items`, `shopping_items`, `profiles` mapping and single-row CRUD.
- `src/lib/community.ts` / `community-store.tsx`: community RPC/query adapter and remote-only provider.
- `src/lib/data.ts`: category metadata, curated ingredient concept catalog, and bundled recipe catalog.
- `src/lib/ai.ts`, `recipes.ts`, `category/`: deterministic local categorization/recipe selection and multilingual category resolver.
- `src/lib/i18n.tsx`, `foodNames.ts`, `iconStyle.tsx`, `theme.ts`: translations and display preferences/tokens.
- `supabase/schema.sql`: only checked-in backend schema definition; no versioned migration files found.

## 3. Architecture and data flow

```text
Browser / installed PWA
  → main.tsx (styles, cache warm-up, React root)
  → App provider tree
  → AuthGate (login only when Supabase configured and no session)
  → CookingProvider (local IndexedDB or remote Supabase provider)
  → CommunityProvider (active only for configured signed-in user)
  → MobileShell (Kitchen | List | Cook | Nearby | Profile)
  → feature components/sheets
  → context action or pure library function
  → IndexedDB / Supabase client / browser geolocation / OSM tiles
```

The shared `useCooking()` interface exposes inventory, shopping list, recipes, selected concepts, profile, hydration, and mutation actions. `useActiveInventory()` filters `status === "active"`. Local mode hydrates one JSON state blob under `cooking-store-v1`, merges defaults, then writes state to IndexedDB (`idb-keyval`). It attempts one-time read-through/migration from `localStorage` and requests persistent browser storage. Remote mode fetches owned pantry/shopping rows plus profile, locally stores recipes under `cooking-recipes-v1`, and keeps selected concepts in memory. Remote mutations update React state first; failed writes log and call `reload()`. Realtime changes to the user's pantry/shopping rows debounce a full resync (~700 ms). Community membership changes debounce a membership reload (~600 ms).

Remote store selection is based on configuration, not current login. In a configured but signed-out session, `AuthGate` should prevent shell/provider content from rendering; verify this behavior when changing provider boundaries. Community provider itself uses both configuration and authenticated user ID. Remote row serialization in `remote.ts` converts snake_case to camelCase, and numeric values to JS numbers.

### Important item semantics

- Inventory and shopping quantities are nullable: `null` means amount untracked. Duplicate active inventory items or unpurchased shopping items merge by `(conceptId, unit)`; two null quantities remain null, otherwise amounts sum.
- Purchasing a shopping row moves/merges its quantity into active inventory and sets `purchased=true`; undo only flips purchased false, it does not subtract inventory.
- Consuming in `UseItemSheet` changes quantity and changes status to consumed at zero. A null quantity is treated as zero for the stepper.
- Recipe matching uses `conceptId`; a nullable inventory quantity counts as enough. Required missing items affect coverage; absent optional items are tracked separately.
- Recipes in `recipeCatalog` are English-only and bundled. Generated recipe action chooses the catalog recipe with greatest ingredient-concept overlap; ties retain the earliest catalog entry. The entered “mood” is not used by generation.

## 4. Backend, entities, and security model

### Supabase client and auth

`src/lib/supabase.ts` creates one globally memoized Supabase client only when both env vars exist. Auth persists under localStorage key `cooking-auth` using a safe storage wrapper (in-memory fallback if browser storage is unavailable), token refresh enabled, URL session detection disabled. `src/lib/auth.tsx` listens to `onAuthStateChange`; email/password sign-up includes `display_name` user metadata and sign-in uses `signInWithPassword`. Auth UI is `AuthGate.tsx`. Despite older comments in the supplied project notes referring to magic links, inspected code implements **email + password**, not magic-link login. Whether Supabase email confirmation is enabled is **NEEDS VERIFICATION**.

Environment variable names (values intentionally not documented): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. `.env.example` was referenced by README/AGENTS but presence/content is **NEEDS VERIFICATION** (not in the source file inventory returned during this analysis). Never put secrets in this document.

### Tables and relationships (from `supabase/schema.sql`)

- `profiles`: primary key `id → auth.users.id` with cascade delete; `display_name`, `share_with_communities`, `share_on_map`, `requests_enabled`, nullable coarse `latitude`/`longitude`, `created_at`. Map index is partial on opted-in rows. Profile is created by `handle_new_user` trigger; client reads/updates it. Client currently does not upsert a missing profile; remote reads use a default profile if absent. **NEEDS VERIFICATION:** trigger installation and deployed state.
- `pantry_items`: UUID id, `owner_id → auth.users` cascade, `concept_id`, `display_name`, nullable numeric `quantity`, checked text `unit` and `category`, nullable `expiry`, `notes`, status (`active|consumed`), `added_at`, `updated_at`. Indexed by owner/status. Client inserts/patches/deletes; consumed items remain rows. Community/map reads expose active rows subject to profile sharing and RLS/RPC logic.
- `shopping_items`: UUID id, owner FK, concept/display names, nullable numeric quantity, checked unit/category, purchased boolean, source (`manual|from-inventory|from-recipe`), `created_at`; owner index. Client CRUD; purchased rows remain on the list.
- `communities`: UUID id, name, unique generated six-character code, nullable creator FK, created timestamp.
- `community_members`: composite primary key `(community_id,user_id)`, both cascading FKs, role and joined timestamp. Community membership is queried/created/deleted by community adapter.
- `share_requests`: UUID, requester/owner user FKs, concept/display name, status (`pending|accepted|declined|cancelled`), optional message, timestamps per schema. RLS policies exist, but there is no client API/UI/realtime inbox implementation. Exact lifecycle enforcement beyond table checks/policies is **NEEDS VERIFICATION**.

SQL reference lists (`co_categories`, `co_units`) mirror TS unions. Schema contains migration-like compatibility logic for old profile columns and is described as re-runnable; it is not a versioned migration system.

### Access rules and RPCs

RLS is enabled on all listed tables. Policies provide users own profile/item access, community-scoped profile/pantry visibility when opted into community sharing, and map visibility for signed-in users where `share_on_map` is enabled. Shopping rows are owner-only. Share request reads/updates are allowed to requester or owner; insert requires requester identity and `shares_community_with(owner)` (verify exact policy details before extending). Community creation and code join use security-definer functions. `co_search_shared_item` only returns active items for other users sharing a community and opted-in profile; it does not return notes. `co_nearby_public_kitchens` returns opted-in coarse profile pins and counts active pantry rows within a latitude/longitude bounding box. Security-definer functions set an empty search path and RPC execute is revoked from public/anon and granted to authenticated for the community/map RPCs. Review policies in SQL before introducing queries; client-side UI conditions are not authorization.

Client flows:

- Store: `useCooking` mutation → optimistic state → `remote.insert*/patch*/delete*` → Supabase table operation → RLS → DB → realtime event → debounced `fetchAll`.
- Community: Nearby UI → `useCommunity()` → `community.ts` RPC/query → RLS/security-definer SQL → Postgres.
- Map: Profile requests browser geolocation → `getCoarsePosition()` rounds coordinates to 2 decimal places (~1.1 km) → `updateProfile` writes location/opt-in; NearbyMap dynamically imports Leaflet and requests map RPC. OSM tiles are network-loaded and not precached.

No conventional REST/HTTP backend endpoints, edge functions, server source, or background jobs were identified. Supabase SDK table queries/RPCs are the backend interface. Cloudflare serves static assets only; it is not an application API server.

## 5. Frontend screens and user flows

### Navigation

`MobileShell` provides five conditional tabs: Kitchen (initial), List, Cook, Nearby, Profile. There is no URL router observed; tab state is local component state, so deep-linkable per-tab routes are **not implemented/UNKNOWN**. Shell waits for cooking hydration before mounting screens but keeps bottom tab bar visible.

### Kitchen inventory

1. Kitchen tab filters active inventory by typed/display-localized name and groups by category.
2. Add button opens `AddItemSheet`; user enters name, optional positive quantity, unit, category, notes. Blur/submit invokes `categorizeIngredientAsync`; category is auto-filled unless manually changed.
3. Local resolver normalizes names, checks known concepts, localized lexicon and learned cache. Unknown names get slug ID and `other`; `aiCategorize()` currently returns null. User-entered display name is kept; matched concept ID/category drive icon/recipe matching.
4. Store merges same active concept+unit or prepends a new item. Local mode persists whole state; remote mode sends an insert/patch. Errors in remote write trigger reload.
5. Tile tap opens use stepper; long press/right-click opens edit. Edit supports name/category/quantity/unit/notes/delete. Expiry exists in data/schema but add/edit UI does not expose expiry in inspected components. Status badges are deliberately disabled (`SHOW_TILE_BADGES=false`).
6. Use stepper decrements/increments (step 50 for g/ml, otherwise 1), zero marks consumed. “Add to shopping list” creates a from-inventory shopping entry with null quantity.

### Shopping list

1. List tab filters active/purchased entries by display name and translated food name, groups active entries by category.
2. FAB opens inline composer. Submit categorizes the name, creates a manual, untracked, piece-unit entry.
3. Check marks purchased and moves/merges into inventory; purchased section supports undo. Delete removes row. Remote state persists via table writes/realtime.
4. `source` supports `from-recipe`, but recipe-to-list wiring was not observed; feature is **PARTIALLY IMPLEMENTED/UNKNOWN**.

### Cook / recipes

1. Kitchen selection mode toggles concept IDs; Kitchen has a switch-to-Cook action. Cook can clear selection.
2. Cook uses active inventory (or restricts it to selected concepts), matches bundled catalog by concept IDs and quantity, sorts by missing count then coverage then name, and shows top 10 when at least three ingredients are in play.
3. Recipe card opens `RecipeDetailSheet`; optional/missing ingredients are displayed. Catalog content is not localized.
4. “AI recipe” opens `AiRecipeSheet`, optionally accepts mood, then `generateRecipe()` chooses best overlap from static catalog. It does not call AI or generate novel instructions. `onGenerated` opens detail but does not add recipe into store.

### Authentication and profile

1. If backend is unconfigured, AuthGate passes children through. If configured, it waits for auth readiness and displays login/signup when no user.
2. Signup/sign-in invoke Supabase password auth; errors are surfaced by the gate UI. Profile shows account name/email and logout in configured signed-in mode.
3. Profile name updates on blur. Language (`en`/`it` picker per i18n order), icon style, community-sharing flag, public map sharing flag, and request-enabled flag are displayed.
4. Enabling map asks for geolocation and persists coarse coordinates. In configured mode, null result disables sharing and displays a temporary denial message. In local mode, it does not roll back the switch on null; map functionality remains disabled anyway.

### Nearby communities/map

1. Local/unauthenticated Nearby shows sign-in prompt and no map/community data.
2. Signed-in user can create a community or join by invite code; membership list and member counts load via Supabase queries and refresh via realtime membership changes.
3. Search sends a query to `co_search_shared_item`; SQL filters to active, opted-in community inventory. Errors are caught/logged in provider and currently yield empty results, so UI may not distinguish failure from no matches.
4. Nearby map requests current coarse position and map RPC results, dynamically imports Leaflet and OSM tiles. Browser geolocation permission denial/unavailability returns null without throwing. Map tile requests require network.
5. Community leave optimistically removes the community then restores from reload after failure.

## 6. Feature inventory

| Feature                             | Status                                                        | Evidence and limits                                                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PWA install/offline app shell       | IMPLEMENTED                                                   | Vite PWA generateSW, prompt updates, standalone metadata, icons and precache patterns. Map tiles remain online-only. Real install/deployment not verified.                  |
| Local kitchen persistence           | IMPLEMENTED                                                   | `store.tsx`, `storage.ts`; asynchronous IndexedDB hydration and localStorage read-through. Corrupt payload is ignored.                                                      |
| Remote account and sync             | IMPLEMENTED (integration; live behavior NEEDS VERIFICATION)   | Supabase auth, row adapters, optimistic updates, realtime resync. No offline write queue/conflict resolution.                                                               |
| Inventory create/edit/use/delete    | IMPLEMENTED                                                   | Screens/sheets and store actions. Expiry field exists in schema/type but no add/edit control found.                                                                         |
| Shopping list and purchase transfer | IMPLEMENTED                                                   | List tab and store; undo does not reverse kitchen transfer.                                                                                                                 |
| Recipe matching                     | IMPLEMENTED                                                   | Static recipe catalog and deterministic matching. English-only data; no quantity unit conversion.                                                                           |
| “AI recipe”                         | PARTIALLY IMPLEMENTED                                         | UI exists; selects one static recipe by overlap; mood ignored; no generated recipe persistence.                                                                             |
| Ingredient categorization           | IMPLEMENTED locally / AI TODO                                 | Curated concepts, multilingual lexicons, normalization/cache. `aiCategorize` returns null.                                                                                  |
| Category learned cache              | IMPLEMENTED                                                   | IndexedDB cache primed at startup. Build script exists for lexicon generation.                                                                                              |
| Community create/join/leave/search  | IMPLEMENTED in client/schema; live backend NEEDS VERIFICATION | RPCs and RLS. Empty/error results can be indistinguishable in provider.                                                                                                     |
| Public kitchen map                  | IMPLEMENTED in client/schema; live backend NEEDS VERIFICATION | coarse browser geolocation, RPC, lazy Leaflet; bounding box approximation, online OSM tiles.                                                                                |
| Borrow/share request flow           | TODO / NOT IMPLEMENTED                                        | Table/type/profile preference/policies, but no client CRUD, send UI, inbox or request realtime handling.                                                                    |
| Localization                        | PARTIALLY IMPLEMENTED                                         | `en`/`it` full shell, `de/fr/es` shell-only fallback per project instructions; language picker offers en/it. Food-name translation is Italian-only; recipe content English. |
| Icon styles                         | IMPLEMENTED                                                   | Emoji/OpenMoji/FoodIconPack selection; static assets.                                                                                                                       |
| Capacitor app-store wrapper         | TODO / NOT IMPLEMENTED                                        | No Capacitor packages/platform directories; `platform.ts` only detects future injected global.                                                                              |
| Versioned DB migrations             | TODO / NOT IMPLEMENTED                                        | One idempotent schema file only.                                                                                                                                            |

## 7. Data types and storage

Core TS types are in `src/lib/types.ts`: `Category`, `Unit`, `IngredientConcept`, `InventoryItem`, `ShoppingItem`, `RecipeIngredient`, `Recipe`, `UserProfile`, `Community`, `CommunityItemHit`, `NearbyKitchen`, `ShareRequest`, categorization result, and `RecipeMatch`. TS unions must remain synchronized with SQL checks and category labels/locales.

Persistence inventory:

- IndexedDB via `idb-keyval`: `cooking-store-v1` local state blob; `cooking-recipes-v1` remote-mode custom recipes; `cooking-category-cache-v1` learned category cache.
- localStorage: Supabase auth under `cooking-auth` (or in-memory fallback); language under `cooking-lang`; icon-style persistence implementation in `iconStyle.tsx` (key/value details inspect there before changing).
- React-only ephemeral state: selected recipe, open sheets/search/composer, selected concepts in remote mode, active tab, etc.
- Supabase: user-owned inventory/shopping/profile and community entities as above.

Inventory and shopping duplicate merge does not normalize between units. Recipe matching compares a stored quantity directly with recipe quantity while ignoring unit mismatch (e.g. quantity numbers in different units); this is a correctness limitation.

## 8. Configuration, build, deployment

Package: npm, ESM. Runtime dependencies: React/React DOM 19, Vite 8, TypeScript 5.9, Supabase JS, idb-keyval, Leaflet, lucide-react, vite-plugin-pwa. No Expo/React Native/Capacitor dependency. CSS Modules are used per screen/component; `src/lib/theme.ts` and `src/styles/tokens.css` are manually mirrored design token sources.

Commands from `package.json`/README:

- `npm run dev` (Vite port 5173)
- `npm run build` (`tsc -b && vite build`, output `dist/`)
- `npm run preview` (port 4173)
- `npm run typecheck` (`tsc -b --noEmit`)
- `npm test` (Vitest run)
- `npm run build:lexicon` (Node lexicon generator)

PWA: `vite.config.ts` uses `generateSW`, `registerType: "prompt"`, manual registration through `UpdateToast`, manifest display standalone and icon list. Precache glob includes JS/CSS/HTML/SVG/PNG/ICO/woff2; comment says icon collections are included for offline icon availability. Leaflet is aliased to built `leaflet/dist/leaflet.js`, exact match so CSS resolves, and map imports are dynamic. Vite allows `.trycloudflare.com` host for tunnel testing.

Cloudflare Workers static assets: `wrangler.toml` serves `./dist` with SPA fallback; deploy command documented as `npx wrangler deploy`. Worker has no server code. Compatibility date `2026-09-03`. CI configuration was not found in the inspected tracked file list (**UNKNOWN**); no Docker setup identified.

## 9. Tests and checks

Vitest runs in jsdom with `src/test/setup.ts`, tests under `src/**/*.{test,spec}.{ts,tsx}`. Vite test env explicitly empties Supabase vars to keep tests local-only. Existing tests cover app smoke/navigation/local Nearby state, inventory add/persistence/merge/profile switch interaction, categorization and category resolver/cache, recipe matching/generation, and coarse geolocation. Test files: `App.test.tsx`, `App.interactions.test.tsx`, `lib/ai.test.ts`, `lib/recipes.test.ts`, `lib/geo.test.ts`, `lib/category/resolve.test.ts`.

Remote Supabase behavior, RLS/RPC integration, communities/map UI, auth forms, IndexedDB failures, update prompt, accessibility behavior, and visual/mobile browser install are not covered by the inspected tests. No coverage configuration/report was found. Typecheck/build scripts exist; they were not run for this documentation task.

## 10. Code quality, risks, and prioritized recommendations

These are code-derived observations, not claims of production incidents.

### P0 — Critical

- **No verified critical issue identified from static inspection.** Live database security and deployment are material unknowns; before public launch, verify the deployed RLS policies and trigger against `supabase/schema.sql` and test using distinct authenticated users. Complexity: MEDIUM. Files: `supabase/schema.sql`, `src/lib/community.ts`, `src/lib/remote.ts`.

### P1 — Important

1. **Share request feature is schema-only.** Profile switch may imply a borrow workflow that users cannot complete. Implement create/accept/decline/cancel operations, requester/owner inbox, status UX, realtime refresh, and verify policy semantics. Benefit: closes existing product promise. Complexity: HIGH. Files: schema, `types.ts`, `community.ts` or request service, provider, Nearby UI/Profile.
2. **Remote persistence has no offline queue or transactional purchase transfer.** Inventory insert/patch and shopping purchased patch are separate operations; partial failure can be reconciled by reload but may leave only one side committed. Define desired atomic semantics (ideally DB RPC transaction) and explicit offline/retry UX. Complexity: HIGH. Files: `store.tsx`, `remote.ts`, SQL.
3. **Recipe match ignores unit compatibility and quantity conversion.** It may say an ingredient is available when measured in an incomparable unit. Normalize supported conversions or show availability without asserting amount adequacy. Complexity: MEDIUM. Files: `recipes.ts`, `units.ts`, types/tests.
4. **Remote and security integration lacks tests.** Add isolated client mocks/local Supabase integration tests for mappings, optimistic rollback/reload, policies/RPCs, and community errors. Complexity: MEDIUM/HIGH. Files: `remote.ts`, `community.ts`, store, `supabase/schema.sql`, tests.
5. **Profile/UI sharing semantics need consistency checks.** `requestsEnabled` exists, but no request flow; local mode can retain map opt-in after denied location. Hide/disable unsupported controls or complete the feature and ensure opt-in/location lifecycle is coherent. Complexity: MEDIUM. Files: `ProfileTab.tsx`, schema, nearby UI.

### P2 — Nice to have

1. Localize recipe catalog and ingredient display names beyond Italian; provide a content completeness gate before exposing additional languages. Complexity: MEDIUM/HIGH. Files: `data.ts`, `foodNames.ts`, `i18n.tsx`.
2. Distinguish community/map fetch errors from empty results; use visible retry/error states instead of only `console.error`/empty arrays. Complexity: LOW/MEDIUM. Files: `community-store.tsx`, `NearbyTab.tsx`.
3. Add expiry input/edit and restore or remove hidden expiry badges/summary if expiry is still a product feature. Complexity: LOW/MEDIUM. Files: `AddItemSheet.tsx`, `EditItemSheet.tsx`, `KitchenTab.tsx`.
4. Add screen-reader labels/current tab semantics and test keyboard/native-dialog focus behavior. Existing controls use some aria labels, but comprehensive a11y has no test evidence. Complexity: MEDIUM. Files: `MobileShell.tsx`, `ui.tsx`, screen components.
5. Version SQL changes under `supabase/migrations/` and document application procedure to reduce drift from live DB. Complexity: MEDIUM. Files: Supabase directory/schema and project docs.
6. Add an actual server-backed recipe/categorization integration only when product/provider requirements are defined; current UI labels “AI” while generation is deterministic catalog overlap. Complexity: HIGH. Files: `ai.ts`, sheet UI, future backend.

## 11. Current status and roadmap

### Where are we now?

**Working by implementation:** local-first inventory and shopping list with IndexedDB; five-tab shell; curated recipe matching; deterministic multi-language category assignment/cache; language and icon style preference; PWA manifest/service worker/update prompt; Supabase email/password auth and per-row data adapter; community/map client and SQL implementation.

**Partially working:** remote mode needs live-project verification and has no durable offline queue; map/community depend on Supabase/RLS/permissions/network; “AI” recipe generation is only best-overlap static recipe; `requestsEnabled` is not connected to a request flow; expiry has model fields but limited UI; localization is incomplete.

**Missing:** Capacitor packaging; borrow request UX/API; versioned migrations; real AI/backend endpoint; push notifications (not in code); full translations/recipe localization.

**Technical debt/risk:** duplicated local/remote store action logic can drift; single schema file; no remote integration test coverage; unit-insensitive recipe math; optimistic writes with eventual reload but no conflict/queue design; `requestsEnabled` affordance outpaces feature; fallback errors sometimes look like empty data.

### Recommended sequence (recommendations)

1. **Complete existing functionality:** decide whether to ship sharing requests; implement full request lifecycle and tests, or remove/disable request preference until supported. Verify deployed RLS and trigger.
2. **Reliability:** make purchase transfer atomic on remote backend; clarify offline behavior and surface retries/errors.
3. **Correctness:** define recipe quantity/unit semantics and test conversions; expose expiry editing if intended.
4. **Architecture and operations:** introduce ordered SQL migrations and deployment verification; add remote adapter/RPC contract tests.
5. **UX/accessibility:** error/loading/retry states for Nearby, keyboard/focus/aria audit, browser-device PWA smoke test.
6. **Future scope:** complete translations, then decide on actual AI service and later Capacitor wrapper (both are planned rather than currently configured).

## 12. Future developer implementation notes

- Keep `Category`/`Unit` in `types.ts`, category metadata in `data.ts`, category translation keys in `i18n.tsx`, and SQL `co_categories()`/`co_units()` synchronized.
- Use CSS Modules and DOM elements; do not reintroduce React Native/Expo. `pantry` remains a category value.
- Use `useCooking()` rather than mutating state directly. Preserve nullable quantity semantics and `(conceptId, unit)` merge behavior unless product rules change.
- Remote provider is selected by Supabase configuration; add remote tests without relying on a live account/project. Supabase table RLS is the authorization boundary.
- Keep recipes local by design unless explicitly changed. Local mode persists a whole blob; remote mode only persists recipes locally.
- `BottomSheet` uses native `<dialog>`; verify dialog semantics/focus when editing shared UI.
- `FoodIcon` supports multiple styles and a large static asset index; `NearbyMap` lazy-loads Leaflet. Avoid eager imports that defeat code splitting.
- PWA icons are generated from `assets/icon.svg` with `pwa-assets.config.ts`; generated files then need placement in `public/` as documented. Service worker precaches icon assets, not external OSM tile traffic.
- `getCoarsePosition` never rejects; 2-decimal rounding is a privacy behavior. Map flow depends on geolocation permission and secure context.
- Storage keys are compatibility-sensitive: `cooking-store-v1`, `cooking-recipes-v1`, `cooking-category-cache-v1`, `cooking-auth`, `cooking-lang`.
- `theme.ts` and `tokens.css` are manual mirrors. `i18n.tsx` has en/it full tables and de/fr/es shell fallback per supplied project instructions. `foodNames.ts` localizes curated food names in Italian only; catalog recipes remain English.
- Auth implementation is password-based, notwithstanding stale comments in `README`/other comments that may call it magic-link. Confirm project auth settings before changing UX.
- Supabase schema comments describe intended privacy; verify actual SQL policies and deployed state before relying on them. `share_requests` lacks client implementation despite schema/type/flag.
- Do not treat `generateRecipe` or `aiCategorize` as network AI. `mood` in `AiRecipeSheet` currently does not affect output.
- Useful commands: `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`, `npm run preview`, `npm run build:lexicon`. No commands were run in this analysis.

## 13. Final summary

Co-oking is a mobile-first installable web kitchen organizer. Its architecture is React contexts and conditional tabs, with IndexedDB local mode or Supabase auth/data mode; community and map discovery use Supabase SQL RPC/RLS and browser geolocation. The strongest implemented features are inventory, shopping transfer, local persistence, recipe matching, multilingual categorization, PWA shell, and community/map scaffolding. Most important missing product capability is the share-request lifecycle; biggest verification needs are live Supabase security/integration and remote-mode failure/offline behavior.

**Top five issues:** (1) share-request UI/service absent despite settings/schema; (2) no atomic remote purchase transfer/offline queue; (3) recipe matching ignores units; (4) remote/security pathways lack tests; (5) error and sharing-preference UX can misrepresent unsupported/failing states.

**Top five improvements:** complete or defer requests coherently; verify deployed SQL/RLS and add remote contract tests; make shopping-to-inventory transfer transactional; define unit-aware recipe availability; add explicit nearby errors/retries and accessibility coverage.

**Next steps:** audit live Supabase schema/policies and auth settings, decide request feature scope, cover remote paths with tests, then address transfer consistency and recipe unit correctness.
