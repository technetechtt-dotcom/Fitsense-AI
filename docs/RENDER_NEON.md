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

Set these secret values when Render prompts:

```env
DATABASE_URL=<your Neon pooled Postgres URL>
FIREBASE_SERVICE_ACCOUNT_JSON=<single-line Firebase service account JSON>
```

The API service already sets:

```env
NODE_ENV=production
SYNC_STORE=postgres
HANDOFF_STORE=postgres
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

The frontend service already receives `VITE_API_BASE_URL` from the API service's
`RENDER_EXTERNAL_URL`.

## 3. Firebase Auth

Cloud sync still uses Firebase anonymous-auth ID tokens for user identity. For
full production sync, set the public Firebase web variables on `fitsense-web`
and `FIREBASE_SERVICE_ACCOUNT_JSON` on `fitsense-api`.

If Firebase is not configured, the app still runs locally/offline and handoff
works, but authenticated `/v1/sync/*` calls will not succeed in production.

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
  "syncReady": true
}
```
