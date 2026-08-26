# Staging deploy + evidence (issue #9)

Target tip of `main` after blockers land (migrations through `011`).

Production hostname `fitsense-api-1rne.onrender.com` is **not** staging.

## Neon staging (already provisioned)

| Field         | Value                                          |
| ------------- | ---------------------------------------------- |
| Neon project  | `FitSense AI Staging` (`snowy-truth-81855391`) |
| Branch        | `main` (`br-quiet-bread-a6iarl84`)             |
| Database      | `neondb`                                       |
| GitHub secret | `STAGING_DATABASE_URL`                         |
| Must not use  | production project `weathered-mud-13816950`    |

## Render Blueprint (operator — blocks #9)

`RENDER_API_KEY` is not available to the agent. Complete in the dashboard:

1. Blueprints → sync repo `render.yaml`.
2. Confirm services exist:
   - `fitsense-api-staging`
   - `fitsense-web-staging`
   - `fitsense-retention-staging`
   - `fitsense-webhooks-staging`
   - `fitsense-reservations-staging`
3. On `fitsense-api-staging` set (from GitHub secrets / password manager):
   - `DATABASE_URL` = `STAGING_DATABASE_URL`
   - `AUTH_SECRET` = `STAGING_AUTH_SECRET` (≠ production)
   - `HANDOFF_SECRET` = `STAGING_HANDOFF_SECRET` (≠ AUTH_SECRET)
   - `WEBHOOK_SEAL_SECRET` = `STAGING_WEBHOOK_SEAL_SECRET`
   - `CORS_ORIGIN` = staging web URL (after web service exists)
   - `WEBAUTHN_RP_ID` / `WEBAUTHN_ORIGIN` = staging web hostname / origin (HTTPS)
4. Deploy commit matching `main` tip.
5. Confirm `GET /health` → 200 with:
   - `migrationVersion` containing `011_`
   - `deploymentSha` matching the deploy
   - `migrations.pending` = `[]`
6. Optional: `node scripts/provision-render-staging.mjs` after `RENDER_API_KEY` is set; store service IDs as `RENDER_STAGING_*_SERVICE_ID`.
7. Only then: `gh variable set STAGING_SMOKE_ENABLED --body true`

## Smoke (issue #10)

```bash
STAGING_API_BASE_URL=https://fitsense-api-staging.onrender.com \
  npm run staging:smoke --prefix backend
STAGING_API_BASE_URL=https://fitsense-api-staging.onrender.com \
  npm run merchant:smoke --prefix backend
```

Commit dated JSON under `docs/records/` — never reuse production hostname records.
