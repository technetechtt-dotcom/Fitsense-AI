# Render + Neon Deployment

This repo includes `render.yaml` for a Render Blueprint with:

- `fitsense-api`: Node/Express API from `backend/`
- `fitsense-web`: static Vite frontend from `dist/`

Neon is used through `DATABASE_URL`; the connection string is not committed.

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

Staging smoke after deploy:

```bash
STAGING_API_BASE_URL=https://<fitsense-api>.onrender.com npm run staging:smoke --prefix backend
```

## 4. Verify

After deploy, open:

```text
https://<fitsense-api>.onrender.com/health
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
