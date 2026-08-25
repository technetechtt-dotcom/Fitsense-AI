# Staging Neon — clean-database restoration drill

Date: 2026-08-25  
Operator: agent (automated provisioning)  
Neon project: `snowy-truth-81855391` (FitSense AI Staging)  
Branch: `br-quiet-bread-a6iarl84`  
Purpose: empty staging DB (not a prod clone) + full migration apply.

## Steps executed

1. Created dedicated Neon project (separate from production `weathered-mud-13816950`).
2. Applied migrations `001` … `010` via `npm run migrate` with staging `DATABASE_URL`.
3. Verified migrate output: `pending: []`, latest `010_reservation_lifecycle_webhook_enc.sql`.
4. Ran backend unit/integration tests against this database (see CI / local `npm test`).

## Not yet executed (needs Render)

- Point `fitsense-api-staging` `DATABASE_URL` at this project.
- `GET /health` on staging hostname → 200.
- `npm run staging:smoke` / `merchant:smoke` and dated records under `docs/records/`.

## RPO note

This drill validates **schema restore from migrations**, not PITR from production.
For production PITR, use Neon branch-from-timestamp per [BACKUP_RESTORE.md](./BACKUP_RESTORE.md).
