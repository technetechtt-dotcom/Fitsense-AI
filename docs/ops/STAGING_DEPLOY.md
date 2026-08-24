# Staging deploy + evidence

Target commit: tip of `main` (migrations through `009`).

Production hostname `fitsense-api-1rne.onrender.com` is **not** staging. Smoke scripts refuse it.

## Why merchant smoke may fail on old deploys

`POST /v1/merchants/orgs` calls `ensureMerchantSchema` → `requireMigrationsApplied`.
If Neon is behind the repo migrations, org create returns 500 until deploy runs migrate.

`render.yaml` start command is now:

```text
npm run migrate && npm start
```

## Operator steps (Render)

1. Merge the fix PR into `main` (CI green).
2. In Render Dashboard → Blueprint → sync / manual deploy **`fitsense-api-staging`**
   (and **`fitsense-web-staging`**) at that commit SHA.
3. Confirm staging Neon is **not** production.
4. Set GitHub Actions variable `STAGING_API_BASE_URL` to **`fitsense-api-staging`** (never production).
5. Optional secrets for Actions deploy: `RENDER_API_KEY`, `RENDER_STAGING_API_SERVICE_ID`, `RENDER_STAGING_WEB_SERVICE_ID`.
6. After deploy: `npm run migrate` is already in the API start command. Then:

```bash
STAGING_API_BASE_URL=https://fitsense-api-staging.onrender.com \
  npm run staging:smoke --prefix backend

STAGING_API_BASE_URL=https://fitsense-api-staging.onrender.com \
  npm run merchant:smoke --prefix backend

STAGING_API_BASE_URL=https://fitsense-api-staging.onrender.com \
  npm run pilot:begin --prefix backend
```

6. Keep records under `docs/records/staging-smoke-latest.json` and
   `docs/records/merchant-smoke-latest.json`.

## Local migrate

```bash
cd backend && npm run migrate
```
