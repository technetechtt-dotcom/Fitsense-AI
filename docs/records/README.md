# Staging smoke records

Latest automated smoke against the live API used for staging verification.

- File: [staging-smoke-latest.json](./staging-smoke-latest.json)
- Until Blueprint services `fitsense-api-staging` / `fitsense-web-staging` are
  provisioned on Render with a dedicated Neon DB, this record may point at the
  interim API hostname wired into `fitsense-web` (see `baseUrl` in the JSON).

Regenerate:

```bash
STAGING_API_BASE_URL=https://<staging-api> \
STAGING_SMOKE_RECORD=docs/records/staging-smoke-latest.json \
  npm run staging:smoke --prefix backend
```
