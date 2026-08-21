# Disaster recovery testing

## Objectives

- RPO: ≤ 24h for Postgres (Neon PITR / backups)
- RTO: ≤ 4h for API restore on Render

## Quarterly drill checklist

1. Confirm latest Neon backup / PITR window.
2. Restore a branch or staging DB from backup.
3. Run `npm run migrate` against restored DB.
4. Point staging API at restored DB; run `npm run staging:smoke` and `npm run merchant:smoke`.
5. Verify retention job and `GET /v1/compliance/retention/verify`.
6. Verify audit chain `GET /v1/compliance/audit/verify`.
7. Record results in `docs/records/dr-drill-YYYY-MM.md` (pass/fail, time to restore, gaps).

## Failover notes

- Handoff may use Postgres or Upstash; document which store is live in env.
- Webhook DLQ must be drained after restore (`npm run webhooks:process`).
- Rotate `AUTH_SECRET` / `HANDOFF_SECRET` only with coordinated cutover (see KEY_ROTATION.md).
