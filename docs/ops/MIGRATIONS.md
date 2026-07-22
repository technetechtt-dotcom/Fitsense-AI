# Database migrations

## Framework

- SQL files: `backend/migrations/NNN_name.sql` (sorted by filename)
- Ledger: `schema_migrations (id, applied_at)`
- Runner: `backend/src/services/migrate.ts`
- Boot: `index.ts` runs migrations and **exits** if any remain pending
- Health: `GET /health` includes `migrations` and returns **503** when pending
- CLI: `npm run migrate --prefix backend` (after `npm run build` or via tsx)

Request paths no longer run `CREATE TABLE`; they call `requireMigrationsApplied()`.

## Deploy

1. `npm run migrate --prefix backend` (or rely on process boot)
2. Confirm `/health` → `ok: true`, `migrations.pending: []`
3. Deploy app

Render: keep migrate in the **start** path via boot, or add a release command:
`node dist/…` / `npm run migrate`.

## Rollback

SQL migrations are forward-only by default. Emergency options:

1. **Restore Neon/Postgres from backup** to a point before the bad migration
   (see [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)).
2. Add a new numbered migration that reverses the change (preferred over editing
   applied files).
3. Never delete rows from `schema_migrations` unless recovering from a failed
   partial apply after fixing the SQL.

## Emergency recovery

1. Take the API offline (`autoDeployTrigger` already off — scale to 0 / suspend).
2. Snapshot or branch the Neon database.
3. Inspect `SELECT * FROM schema_migrations ORDER BY id`.
4. If a migration failed mid-transaction it should have rolled back; fix SQL and
   re-run `npm run migrate`.
5. If schema drifted manually, create a new migration that brings production to
   the intended shape; do not rewrite `001_baseline.sql` after it has shipped.
6. Restore from backup if data loss occurred; document the incident.

## Testing

- CI applies migrations via store bootstraps (`requireMigrationsApplied`).
- `backend/test/schemaMigration.test.ts` asserts tables/columns after migrate.
- Test upgrades against a Neon branch cloned from production-like data before
  shipping destructive migrations.
