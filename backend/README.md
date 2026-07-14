# FitSense API

Node.js backend for FitSense AI:

- **Handoff relay** — desktop ↔ phone QR size transfer (`/v1/handoff/:sessionId`)
- **Cloud sync** — Firestore proxy with Firebase ID token auth (`/v1/sync/*`)

Mirrors the contracts used by the web app in `src/lib/cloud/sync.ts` and `src/embed/handoff.ts`.

## Quick start

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Server runs at **http://localhost:8787** by default.

### Web app

In the project root `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8787
```

Restart `npm run dev`. The client will use the API for handoff and (optionally) sync instead of talking to Firestore directly when sync-via-api is enabled.

### Embed / SDK handoff

```javascript
FitSense.init({
  handoff: {
    baseUrl: "http://localhost:8787",
    transport: "http",
  },
});
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Liveness + Firestore status |
| PUT | `/v1/handoff/:sessionId` | — | Publish handoff payload `{ payload }` |
| GET | `/v1/handoff/:sessionId` | — | Poll payload `{ payload? }` |
| DELETE | `/v1/handoff/:sessionId` | — | Remove session |
| GET | `/v1/sync` | Bearer | Pull profile, events, scans |
| PUT | `/v1/sync/fit-profile` | Bearer | Upsert fit profile |
| PUT | `/v1/sync/scans/:scanId` | Bearer | Upsert scan |
| PUT | `/v1/sync/fit-events/:eventId` | Bearer | Upsert event |
| DELETE | `/v1/sync` | Bearer | Erase all user cloud data |

## Firebase Admin

1. Firebase Console → Project settings → Service accounts → Generate new private key.
2. Save as `backend/service-account.json` (gitignored).
3. Set in `.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

Or set `FIREBASE_SERVICE_ACCOUNT_JSON` to the minified JSON string.

The web client must send `Authorization: Bearer <Firebase ID token>` on sync routes. Tokens come from anonymous (or signed-in) Firebase Auth on the client.

### Local dev without Firebase

Handoff works without Firebase. For sync testing:

```env
SKIP_AUTH=true
```

Then pass header `X-Debug-Uid: test-user-123` instead of a Bearer token.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Watch mode with `tsx` |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled server |

## Production notes

- Replace in-memory handoff store with Redis for multi-instance deploys.
- Restrict `CORS_ORIGIN` to your real domains.
- Never enable `SKIP_AUTH` in production.
