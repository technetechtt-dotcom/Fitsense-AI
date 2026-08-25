# Staging deploy + evidence

Target: tip of `main` after blockers land (migrations through `010`).

Production hostname `fitsense-api-1rne.onrender.com` is **not** staging. Smoke scripts refuse it.

## Neon staging (provisioned)

| Field              | Value                                               |
| ------------------ | --------------------------------------------------- |
| Neon project       | `FitSense AI Staging` (`snowy-truth-81855391`)      |
| Branch             | `main` (`br-quiet-bread-a6iarl84`)                  |
| Database           | `neondb`                                            |
| Region             | aws-us-west-2                                       |
| Migrations applied | `001` … `010_reservation_lifecycle_webhook_enc.sql` |

Connection string is stored as GitHub secret `STAGING_DATABASE_URL` (never commit it).
Paste the same value into Render → `fitsense-api-staging` → `DATABASE_URL`.

Generate distinct staging secrets (do **not** reuse production):

```bash
# Example only — generate fresh values in the dashboard / secret manager
openssl rand -base64 48   # AUTH_SECRET
openssl rand -base64 48   # HANDOFF_SECRET (must differ from AUTH_SECRET)
```

## Why merchant smoke may fail on old deploys

`POST /v1/merchants/orgs` calls `ensureMerchantSchema` → `requireMigrationsApplied`.
If Neon is behind the repo migrations, org create returns 500 until deploy runs migrate.

`render.yaml` start command is:

```text
npm run migrate && npm start
```

## Operator steps (Render) — required to finish issue #9

`RENDER_API_KEY` is not available in local agent environments. Complete in the
[Render Dashboard](https://dashboard.render.com):

1. Blueprint → sync repo `render.yaml` so these services exist:
   - `fitsense-api-staging`
   - `fitsense-web-staging`
   - `fitsense-retention-staging` (cron; needs starter plan)
2. On `fitsense-api-staging`, set env vars (sync: false in blueprint):
   - `DATABASE_URL` = Neon staging URI (`STAGING_DATABASE_URL`)
   - `AUTH_SECRET` / `HANDOFF_SECRET` = distinct staging pair
   - `CORS_ORIGIN` = staging web origin (after web service URL is known)
   - `DATABASE_SSL=true`, `DATABASE_SSL_REJECT_UNAUTHORIZED=true`
3. Deploy commit on `main` (or current tip after merge). Start command applies migrations.
4. Confirm `GET https://fitsense-api-staging.onrender.com/health` returns **200** with:
   - `ok: true`
   - `migrationVersion` ending in `010_…`
   - `deploymentSha` present (Render injects `RENDER_GIT_COMMIT`)
5. GitHub Actions:
   - Variable `STAGING_API_BASE_URL` = `https://fitsense-api-staging.onrender.com` ✅ already set
   - Variable `STAGING_SMOKE_ENABLED` = `true` **only after** step 4 succeeds
   - Optional secrets: `RENDER_API_KEY`, `RENDER_STAGING_API_SERVICE_ID`, `RENDER_STAGING_WEB_SERVICE_ID`

## Smoke (issue #10)

```bash
STAGING_API_BASE_URL=https://fitsense-api-staging.onrender.com \
  npm run staging:smoke --prefix backend

STAGING_API_BASE_URL=https://fitsense-api-staging.onrender.com \
  npm run merchant:smoke --prefix backend
```

Copy dated JSON under `docs/records/` (see `docs/records/staging-YYYY-MM-DD.json`).

Passkeys require the staging **web** origin over HTTPS (`fitsense-web-staging`).
Webhook delivery/retry: `POST /v1/merchants/orgs/:orgId/webhooks/process` or cron `fitsense-webhooks`.

## Local migrate against staging Neon

```bash
cd backend
# Use STAGING_DATABASE_URL from secrets manager — never paste into git
npm run migrate
```
