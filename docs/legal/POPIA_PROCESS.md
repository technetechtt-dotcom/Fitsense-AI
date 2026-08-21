# POPIA operating process (Phase 4)

Companion to the contract template [POPIA_DPA_TEMPLATE.md](./POPIA_DPA_TEMPLATE.md).

## Before pilot go-live

1. Legal counsel reviews and signs DPA with each merchant.
2. Confirm lawful basis + purpose limitation text in Privacy UI matches DPA.
3. Schedule `npm run retention:run --prefix backend` (or Render cron) for scans/events/outcomes.
4. Train store staff on consent, erase (`DELETE .../outcomes?deviceId=`), and export paths.
5. Record DPA signed date + org id in merchant billing `data.popiaSignedAt` (portal).

## Ongoing

| Cadence   | Action                                                          |
| --------- | --------------------------------------------------------------- |
| Weekly    | Spot-check consent banners + erase drill on staging             |
| Monthly   | Retention job dry-run; review outcome retention days            |
| Quarterly | Access review of merchant API keys; revoke unused               |
| On exit   | Erase device-attributed outcomes; revoke keys; close org access |

## Data subject requests

1. Verify identity via merchant + FitSense ops.
2. Export: sync pull / Fit Identity export (no invented mm).
3. Erase: cloud sync erase + outcomes by `deviceId` + local Settings clear.
4. Log request id and completion time in ops notes.
