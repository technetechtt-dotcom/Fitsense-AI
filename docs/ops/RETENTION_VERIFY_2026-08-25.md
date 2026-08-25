# Retention cron verification checklist

Date opened: 2026-08-25

## Staging (`fitsense-retention-staging`)

- [ ] Blueprint synced; cron service exists on Render
- [ ] Schedule `0 3 * * *` UTC visible in dashboard
- [ ] `DATABASE_URL` inherited from `fitsense-api-staging` (staging Neon only)
- [ ] After first successful run, paste log JSON summary below

```json
{ "pending": "awaiting Render cron after staging API is live" }
```

## Production (`fitsense-retention`)

- [ ] Confirm last successful run in Render logs
- [ ] Alert if no run within 36h

Manual dry-run:

```bash
cd backend
DATABASE_URL=... RETENTION_SCAN_DAYS=1 npm run retention:run
```

Do not point a short retention window at production without a Neon branch first.
