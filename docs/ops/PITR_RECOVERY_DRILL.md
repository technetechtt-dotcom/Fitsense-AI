# Production PITR recovery drill (template)

The 2026-08-25 staging migration apply is **not** a production recovery test.

## Checklist

- [ ] Neon production PITR / backups enabled; retention days recorded: ____
- [ ] Create recovery branch from timestamp T=____
- [ ] Point disposable API at recovery `DATABASE_URL`
- [ ] Row counts: accounts ____ scans ____ outcomes ____ reservations ____
- [ ] Checksums / spot checks for critical tables
- [ ] App boots; `/health` ok; smoke suite pass
- [ ] Measured RTO: ____ minutes
- [ ] Measured RPO: ____ minutes
- [ ] Failed-migration rollback tested: ____
- [ ] Restore authority: ____
- [ ] Tabletop exercise date: ____

Do not restore production into staging without anonymisation.
