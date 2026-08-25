# Production monitoring and alerts

Minimum signal for FitSense API / web / retention after staging and production are live.

## Health

| Check                | Expect                                  |
| -------------------- | --------------------------------------- |
| `GET /health`        | HTTP 200, `ok: true`                    |
| `deploymentSha`      | Matches the commit you intended to ship |
| `migrationVersion`   | Latest applied SQL (currently `010_…`)  |
| `syncReady`          | `true` when Postgres sync store is up   |
| `migrations.pending` | `[]` — else treat as deploy failure     |

Poll staging and production every 1–5 minutes (UptimeRobot, Better Stack, Render
health checks already hit `/health`).

## Alert when

1. `/health` ≠ 200 for >2 minutes.
2. Retention cron (`fitsense-retention` / `-staging`) misses a daily run or logs an uncaught error.
3. Webhook cron (`fitsense-webhooks`) shows sustained `dead_letter` growth.
4. Render deploy fails after merge to `main`.
5. GitHub Actions required checks fail on `main`.

## Logs to watch

- Retention JSON summary: `scansDeleted`, `eventsDeleted`, `outcomesDeleted`, …
- Webhook process: `processed`, `delivered`, `deadLetter`
- Spike in `4xx`/`5xx` on `/v1/merchants/*` or `/v1/stores/*`

## Staging gate

Do not enable `STAGING_SMOKE_ENABLED=true` until staging `/health` is green.
Smoke scripts refuse the production hostname `fitsense-api-1rne`.
