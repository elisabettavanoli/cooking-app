# Co-oking

Track what's in your kitchen, see what you can cook, and share with neighbours.
A React + Vite web app, installable as a PWA ("Add to Home Screen").

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build & preview

```bash
npm run build      # tsc -b && vite build  -> dist/
npm run preview    # serve dist/ at http://localhost:4173
```

## Test

```bash
npm test           # vitest (jsdom): logic + full-app smoke/interaction tests
npm run typecheck
```

## Try it as an installed app

1. `npm run build && npm run preview`
2. Chrome desktop: address-bar install icon, or DevTools → Application → Manifest.
3. Real device install needs HTTPS (localhost only works on the same machine).
   Deploy `dist/` to any static host, then on iOS Safari use Share → "Add to
   Home Screen"; on Android Chrome use the install prompt.
4. Lighthouse (DevTools) → PWA / installability should be green.

## Regenerate PWA icons

Edit `assets/icon.svg` (the master — a full-bleed coral tile), then:

```bash
npx pwa-assets-generator            # config: pwa-assets.config.ts
# then move pwa-*.png, maskable-icon-*.png, apple-touch-icon-*.png, favicon.ico
# from assets/ into public/, and copy assets/icon.svg to public/favicon.svg
```

## Project layout

- `src/lib/` — data, types, store (IndexedDB-persisted), recipe matching, local
  AI stand-ins. Framework-agnostic.
- `src/components/`, `src/screens/` — DOM UI + co-located `*.module.css`.
- `src/styles/` — `tokens.css` (design tokens mirroring `lib/theme.ts`) + `global.css`.
- `public/` — PWA icons and favicon.
- `assets/` — source `icon.svg` for icon generation.

## Roadmap

- Capacitor wrapper for the App Store / Play Store.
- Backend + multi-device sync (persistence is currently local to the browser).
