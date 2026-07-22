# Priority 0 — Deployed platform checklist

Operating mode: **push directly to `main`**. Production Render auto-deploy stays
**off** until the four CI jobs are green on the commit you ship.

## Environments

| Env        | API service            | Web service            | Database                | Secrets                                  |
| ---------- | ---------------------- | ---------------------- | ----------------------- | ---------------------------------------- |
| Production | `fitsense-api`         | `fitsense-web`         | Neon prod               | Distinct `AUTH_SECRET`, `HANDOFF_SECRET` |
| Staging    | `fitsense-api-staging` | `fitsense-web-staging` | Neon staging (separate) | Distinct pair — never reuse prod         |

Blueprint: repo-root `render.yaml` (`autoDeployTrigger: off` on all four).

## Operator steps (Render + Neon)

1. Sync Blueprint so staging services exist.
2. Attach **separate** Neon `DATABASE_URL` to staging vs production.
3. Set staging `AUTH_SECRET` / `HANDOFF_SECRET` (different from prod).
4. Set `CORS_ORIGIN` to each web origin.
5. Confirm `/health` on both APIs.
6. Set GitHub Actions variable `STAGING_API_BASE_URL` to the staging API URL.
7. Run `npm run staging:smoke --prefix backend` and keep
   `docs/records/staging-smoke-latest.json` (CI also uploads the artifact).

## Handoff verification (manual)

Web → QR → Android → web against **staging** `VITE_API_BASE_URL` /
`fitsense.api.baseUrl`. Record device models and pass/fail in the pilot log.

## CI evidence

On every `main` push: four required jobs + optional `staging-smoke`.
Artifacts: `app-debug-apk`, `android-unit-test-reports`, `staging-smoke-record`.
