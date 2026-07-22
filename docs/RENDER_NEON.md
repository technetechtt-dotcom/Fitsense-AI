# Render + Neon Deployment

This repo includes `render.yaml` for a Render Blueprint with:

- `fitsense-api` / `fitsense-web`: production pair
- `fitsense-api-staging` / `fitsense-web-staging`: **dedicated staging** pair

Neon is used through `DATABASE_URL`; the connection string is not committed.
Staging must use a **separate** Neon database (and distinct `AUTH_SECRET` /
`HANDOFF_SECRET`) from production.

## 1. Neon

Create or open a Neon database and copy the pooled connection string. It should
look like:

```env
postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&channel_binding=require
```

If the real database URL was shared in chat or committed anywhere, rotate the
password in Neon before using it in production.

## 2. Render Blueprint

Create a new Render Blueprint from this repo. Render reads `render.yaml` from
the repository root.

Both services use **Node 22.16.0** (required by `engines` + `engine-strict=true`).

Set these secret values when Render prompts (or under each service → Environment):

### fitsense-api

```env
DATABASE_URL=<your Neon pooled Postgres URL>
AUTH_SECRET=<long random secret>
HANDOFF_SECRET=<different long random secret>
CORS_ORIGIN=https://fitsense-web.onrender.com
```

`HANDOFF_SECRET` is **required** in production and **must differ** from `AUTH_SECRET`.
Render Blueprint keeps `autoDeployTrigger: off` until branch protection is enabled
(see [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md)).

`CORS_ORIGIN` must be the **exact** public URL of `fitsense-web` (no trailing slash).
After the static site deploys, copy its URL from the Render dashboard and paste it
here, then redeploy the API if needed.

The API service already sets:

```env
NODE_ENV=production
SYNC_STORE=postgres
HANDOFF_STORE=postgres
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

Build command (must match CI `render-api-build`):

```bash
npm ci --include=dev && npm run build
```

Later product phases: [ROADMAP.md](./ROADMAP.md).

### fitsense-web

`VITE_API_BASE_URL` is wired from the API service's `RENDER_EXTERNAL_URL` in
`render.yaml`.

## 3. Auth + handoff

Cloud sync uses **device challenge-response** (`AUTH_SECRET`). Handoff sessions use
**separate** publish/consume tokens signed with `HANDOFF_SECRET`.

### Staging Blueprint services

After syncing the Blueprint, set secrets on **`fitsense-api-staging`** (separate
Neon DB) and point `CORS_ORIGIN` at `fitsense-web-staging`. Then:

```bash
STAGING_API_BASE_URL=https://fitsense-api-staging.onrender.com \
STAGING_SMOKE_RECORD=docs/records/staging-smoke-latest.json \
  npm run staging:smoke --prefix backend
```

Set GitHub repo variable `STAGING_API_BASE_URL` so CI job `staging-smoke` runs
and uploads `staging-smoke-record`.

Until the staging hostname is live, smoke may target the existing API origin
from the web bundle (for example `https://fitsense-api-1rne.onrender.com`) —
record which URL was used.

## 4. Verify

After deploy, open:

```text
https://fitsense-api-staging.onrender.com/health
```

Expected storage fields:

```json
{
  "handoffStore": "postgres",
  "syncStore": "postgres",
  "syncReady": true,
  "postgres": true
}
```

Then open the static site URL and confirm the app loads.
