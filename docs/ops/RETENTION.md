# Retention schedule and monitoring

POPIA retention job: `backend` → `npm run retention:run` (`src/jobs/retention.ts`).

## Schedule (Render Blueprint)

`render.yaml` defines cron services:

| Service                      | Schedule (UTC) | Database                                |
| ---------------------------- | -------------- | --------------------------------------- |
| `fitsense-retention-staging` | `0 3 * * *`    | staging Neon via `fitsense-api-staging` |
| `fitsense-retention`         | `30 3 * * *`   | production Neon via `fitsense-api`      |

Sync the Blueprint on Render after merge. Cron plans require a paid starter slot —
if unavailable, schedule the same command on an external runner with `DATABASE_URL`.

## Manual / local

```bash
cd backend
DATABASE_URL=... npm run retention:run
```

## What is deleted

| Store                   | Cutoff env               | Default |
| ----------------------- | ------------------------ | ------- |
| `scans`                 | `RETENTION_SCAN_DAYS`    | 730     |
| `fit_events`            | `RETENTION_EVENT_DAYS`   | 730     |
| `fit_profiles`          | `RETENTION_PROFILE_DAYS` | 730     |
| `merchant_outcomes`     | `RETENTION_OUTCOME_DAYS` | 730     |
| Handoff sessions        | fixed 7d / expired       | —       |
| Consumed recovery codes | expired/consumed         | —       |

## Monitoring

1. After each cron run, open Render logs for the retention service.
2. Expect a JSON summary: `scansDeleted`, `eventsDeleted`, `outcomesDeleted`, etc.
3. Alert if deletes are unexpectedly large (possible clock/config mis-set).
4. Monthly: dry-run on staging with a short `RETENTION_*_DAYS` override, then restore from Neon branch if needed ([BACKUP_RESTORE.md](./BACKUP_RESTORE.md)).
