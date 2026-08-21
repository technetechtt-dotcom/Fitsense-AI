# Incident response playbook

## Severity

| Level | Examples                                      | Response time |
| ----- | --------------------------------------------- | ------------- |
| SEV1  | Auth secret leak, mass data exposure, outage  | Immediate     |
| SEV2  | Sync/handoff degraded, merchant ingest down   | ≤ 4 hours     |
| SEV3  | Single-store catalogue glitch, non-PII bug    | Next business |

## First 30 minutes (SEV1/2)

1. Acknowledge in ops channel; assign incident commander.
2. Preserve evidence (Render logs, Neon query insights, smoke record).
3. If secrets exposed: rotate `AUTH_SECRET` / `HANDOFF_SECRET` / API keys per [KEY_ROTATION.md](../security/KEY_ROTATION.md).
4. If measurement path invents or mislabels mm: **disable** recommendations for affected release; never ship silent fake sizes.
5. POPIA: if personal data at risk, follow [POPIA_DPA_TEMPLATE.md](../legal/POPIA_DPA_TEMPLATE.md) breach notification clause.

## Containment

- Render: pause auto-deploy (already `off`); pin last known-good deploy.
- Revoke compromised merchant API keys via portal / `POST .../api-keys/:id/revoke`.
- Erase device-attributed outcomes if required (`DELETE .../outcomes?deviceId=`).

## Recovery

1. Run `npm run staging:smoke --prefix backend` against staging after fix.
2. Neon restore drill: [BACKUP_RESTORE.md](./BACKUP_RESTORE.md).
3. Re-run CI on `main`; promote only with green `web-and-sdk`, `backend`, `render-api-build`, `android-build`.

## Post-incident

Write `docs/records/incident-YYYYMMDD.md` with timeline, root cause, and follow-ups.
Schedule external pen-test if SEV1 auth/data boundary failed ([PENTEST_SCOPE.md](../security/PENTEST_SCOPE.md)).
