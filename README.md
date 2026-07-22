# FitSense — retail footwear-fit technology

Phone-assisted foot measurement, reusable Fit ID, and product-specific footwear
size recommendations. The initial launch focus is South African school footwear,
with safety footwear as a separate secondary validation segment.

FitSense is not a medical device. It does not diagnose, treat, prevent, or
monitor medical conditions, and it does not guarantee that footwear will fit.
See [the product definition](docs/PRODUCT_DEFINITION.md) and
[validated measurement protocol](docs/MEASUREMENT_PROTOCOL.md).

## Tech

- **React 18 + TypeScript + Vite 8**
- **Tailwind CSS** — responsive layout, safe-area insets, PWA manifest
- **React Router 6** — screen transitions via Framer Motion
- **OpenCV.js + MediaPipe** — reference detection and foot landmarks on `/scan`
- **WebXR** — immersive AR plane mode (Android Chrome) via `arSession.ts`
- **FitSense API** (optional) — handoff relay and Postgres-backed cloud sync
- **localStorage** — offline-first persistence

## Run

Use Node 22.16.0 and npm 11.6.x (`.nvmrc`, `.node-version`, and
`packageManager` are committed).

```bash
npm ci
npm run dev          # http://localhost:5173
npm run dev:full     # web + API together (recommended)
npm run build        # production bundle in dist/
npm run build:sdk    # partner embed SDK → dist-sdk/embed.js
npm run build:all    # app + SDK
npm run check        # typecheck + lint + backend tests + production builds
npm run preview      # serve production build
```

### API backend (handoff + cloud sync)

Copy `.env.example` → `.env.local` and set `VITE_API_BASE_URL=` (empty uses
the Vite dev proxy to `http://127.0.0.1:8787`). Then:

```bash
cd backend && cp .env.example .env && npm install
npm run dev:full     # from project root
```

Handoff, embed QR flow, and cloud sync automatically use the API when
`VITE_API_BASE_URL` is set. The API issues signed device session tokens and
stores sync data in Postgres — see [backend/README.md](backend/README.md).

Neon/Postgres storage is supported through `DATABASE_URL`; see
[docs/RENDER_NEON.md](docs/RENDER_NEON.md) for the Render Blueprint setup.

### Production

Production readiness assets live in:

- `docs/PRODUCT_DEFINITION.md` - market, use cases, claims, value and acceptance
- `docs/MEASUREMENT_PROTOCOL.md` - valid/rejected scans and validation targets
- `docs/PRODUCTION_READINESS.md` - release gate, required env, external blockers
- `docs/RENDER_NEON.md` - Render Blueprint + Neon deployment guide
- `docs/architecture/ADR-001-monorepo-migration.md` - staged target architecture
- `render.yaml` - Render services for the API and static web app
- `backend/Dockerfile` - API container build
- `.github/workflows/ci.yml` - web, SDK, backend, and container CI

Use `VITE_ENABLE_DEMO_SCAN=false` or leave it unset in production. Simulated
scan fallback is enabled only in Vite dev by default.

## Screens

| Route                      | Page                                    |
| -------------------------- | --------------------------------------- |
| `/splash`                  | Animated splash                         |
| `/onboarding`              | Intro carousel                          |
| `/home`                    | Dashboard + consent reminder            |
| `/scan`                    | Camera / tap-to-measure / WebXR AR      |
| `/results/:scanId`         | Measurement summary                     |
| `/recommendations/:scanId` | Ranked shoes                            |
| `/measurements`            | Scan history                            |
| `/fit-profile`             | Portable fit identity                   |
| `/products/:productId`     | Product detail                          |
| `/integrations`            | Partner embed preview + docs            |
| `/settings`                | Units, consent, cloud restore, sign-out |
| `/privacy`                 | Policy, export, delete, restore         |

Embed mode: append `?embed=1` (see `INTEGRATION.md` and `npm run build:sdk`).

## Project layout

```
src/
├── App.tsx              # router + error boundary + bootstrap
├── lib/
│   ├── api/             # HTTP client, handoff defaults, health
│   ├── cloud/           # API-backed sync + restore
│   ├── cv/              # OpenCV reference detection
│   ├── ml/              # on-device learned ranker
│   ├── consent.ts       # privacy consent state
│   └── analytics.ts     # consent-gated analytics hooks
├── embed/               # iframe SDK + EmbedApp
├── pages/               # routed screens
└── components/          # shared UI
backend/                 # FitSense API (Express + Postgres sync)
android/                 # native Kotlin app (ARCore pipeline)
```

## Native shells

- **iOS**: `npx cap sync ios` after `npm run build` (see `capacitor.config.ts`)
- **Android**: standalone app under `android/`
