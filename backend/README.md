# FitSense API

Node.js backend for FitSense AI:

- Handoff relay: desktop to phone QR size transfer (`/v1/handoff/:sessionId`)
- Cloud sync: profile, fit-event, and scan persistence (`/v1/sync/*`)

The web app contract mirrors `src/lib/cloud/sync.ts` and
`src/embed/handoff.ts`.

## Quick Start

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Server runs at `http://localhost:8787` by default.

### Web App

In the project root `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8787
```

Restart `npm run dev`. The client will use the API for handoff and sync when
`VITE_API_BASE_URL` is set.

## Neon / Postgres

Set these in `backend/.env` locally or in Render service environment variables:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&channel_binding=require
SYNC_STORE=postgres
HANDOFF_STORE=postgres
```

When `DATABASE_URL` exists, the backend defaults both sync and handoff storage
to Postgres unless you explicitly override `SYNC_STORE` or `HANDOFF_STORE`.

The API creates these tables automatically on startup or first handoff use:

- `fit_profiles`
- `fit_events`
- `scans`
- `handoff_sessions`

Payloads are stored as `jsonb` after request validation.

## Authentication

Production sync routes still require Firebase Admin for ID-token verification.
This is separate from Firestore storage: you can use Firebase anonymous auth for
identity and Neon/Postgres for persistence.

Options:

```env
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
# or for containers:
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Local sync testing can bypass Firebase:

```env
SKIP_AUTH=true
```

Then pass `X-Debug-Uid: test-user-123` instead of a Bearer token. Never enable
`SKIP_AUTH` in production.

## Endpoints

| Method | Path                           | Auth   | Description                            |
| ------ | ------------------------------ | ------ | -------------------------------------- |
| GET    | `/health`                      | no     | Liveness and selected storage backends |
| PUT    | `/v1/handoff/:sessionId`       | no     | Publish handoff payload `{ payload }`  |
| GET    | `/v1/handoff/:sessionId`       | no     | Poll payload `{ payload? }`            |
| DELETE | `/v1/handoff/:sessionId`       | no     | Remove session                         |
| GET    | `/v1/sync`                     | Bearer | Pull profile, events, scans            |
| PUT    | `/v1/sync/fit-profile`         | Bearer | Upsert fit profile                     |
| PUT    | `/v1/sync/scans/:scanId`       | Bearer | Upsert scan                            |
| DELETE | `/v1/sync/scans/:scanId`       | Bearer | Delete one scan                        |
| PUT    | `/v1/sync/fit-events/:eventId` | Bearer | Upsert event                           |
| DELETE | `/v1/sync`                     | Bearer | Erase all user cloud data              |

## Scripts

| Command         | Description                 |
| --------------- | --------------------------- |
| `npm run dev`   | Watch mode with `tsx`       |
| `npm run build` | Compile to `dist/`          |
| `npm test`      | Node test runner via `tsx`  |
| `npm run check` | Typecheck, tests, and build |
| `npm start`     | Run compiled server         |

## Production Notes

- Use `HANDOFF_STORE=postgres` with Neon, or `HANDOFF_STORE=upstash` with
  Upstash Redis. Do not use memory handoff for normal production.
- Restrict `CORS_ORIGIN` to the deployed web origin.
- Never enable `SKIP_AUTH` in production.
- Keep `JSON_LIMIT` small; raw camera frames must never be sent to this API.
- Build the deployable API image with `docker build -t fitsense-api .`.

Startup fails in `NODE_ENV=production` when CORS is wildcard, `SKIP_AUTH` is
enabled, a production-safe handoff store is not configured, or Postgres storage
is selected without `DATABASE_URL`.
