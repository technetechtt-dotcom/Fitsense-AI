# FitSense AI — Web companion

Interactive web app for AR-assisted foot sizing and shoe recommendations.
Shares sizing logic with the native Android app in `android/`.

## Tech

- **React 18 + TypeScript + Vite 5**
- **Tailwind CSS** — responsive layout, safe-area insets, PWA manifest
- **React Router 6** — screen transitions via Framer Motion
- **OpenCV.js + MediaPipe** — reference detection and foot landmarks on `/scan`
- **WebXR** — immersive AR plane mode (Android Chrome) via `arSession.ts`
- **Firebase** (optional) — anonymous auth, Firestore sync, Analytics
- **localStorage** — offline-first persistence

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run dev:full     # web + API together (recommended)
npm run build        # production bundle in dist/
npm run build:sdk    # partner embed SDK → dist-sdk/embed.js
npm run build:all    # app + SDK
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
`VITE_API_BASE_URL` is set. Sync still requires Firebase web config (ID tokens)
plus Firebase Admin on the server — see [backend/README.md](backend/README.md).

### Firebase (optional)

Copy `.env.example` to `.env.local` and fill in your Firebase web app config.
Without it, the app runs fully offline; cloud sync and analytics stay disabled.

## Screens

| Route | Page |
|-------|------|
| `/splash` | Animated splash |
| `/onboarding` | Intro carousel |
| `/home` | Dashboard + consent reminder |
| `/scan` | Camera / tap-to-measure / WebXR AR |
| `/results/:scanId` | Measurement summary |
| `/recommendations/:scanId` | Ranked shoes |
| `/measurements` | Scan history |
| `/fit-profile` | Portable fit identity |
| `/products/:productId` | Product detail |
| `/integrations` | Partner embed preview + docs |
| `/settings` | Units, consent, cloud restore, sign-out |
| `/privacy` | Policy, export, delete, restore |

Embed mode: append `?embed=1` (see `INTEGRATION.md` and `npm run build:sdk`).

## Project layout

```
src/
├── App.tsx              # router + error boundary + bootstrap
├── lib/
│   ├── api/             # HTTP client, handoff defaults, health
│   ├── cloud/           # Firebase sync + restore (via API or direct)
│   ├── cv/              # OpenCV reference detection
│   ├── ml/              # on-device learned ranker
│   ├── consent.ts       # privacy consent state
│   └── analytics.ts     # Firebase Analytics (consent-gated)
├── embed/               # iframe SDK + EmbedApp
├── pages/               # routed screens
└── components/          # shared UI
backend/                 # FitSense API (Express + Firebase Admin)
android/                 # native Kotlin app (ARCore pipeline)
```

## Native shells

- **iOS**: `npx cap sync ios` after `npm run build` (see `capacitor.config.ts`)
- **Android**: standalone app under `android/`
