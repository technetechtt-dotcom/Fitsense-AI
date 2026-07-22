# Database backup and restore

## Neon / Postgres

1. Enable automated backups / PITR in the Neon console for production.
2. Staging should use a **separate** database (never restore prod into staging
   without anonymisation).

## Application-level drill (CI)

`backend/test/backupRestore.test.ts` seeds sync rows, snapshots via
`pullUserData`, erases, reinstate, and asserts equality. This validates the
same path used after importing a logical export.

## Operator restore drill

1. Create a Neon branch from a backup point-in-time.
2. Point a staging API `DATABASE_URL` at the branch.
3. Run `npm run staging:smoke --prefix backend`.
4. Confirm `/health` shows `syncReady: true` and sync CRUD still works.

Document RPO/RTO targets with your hosting plan; default product goal is
daily backups and ≤ 24h RPO for pilot.
