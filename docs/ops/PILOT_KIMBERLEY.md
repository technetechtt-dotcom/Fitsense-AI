# Kimberley / Northern Cape controlled pilot

## Goal

Prove FitSense improves sizing outcomes (fewer size-related returns/exchanges)
for school and retail footwear in Kimberley and surrounding Northern Cape
stores — without inventing millimetres or skipping reference calibration.

## Success criteria (from PRODUCT_DEFINITION)

| Metric                                                | Target                                 |
| ----------------------------------------------------- | -------------------------------------- |
| Scan completion (usable dual-foot or accepted single) | ≥ 80% of consented sessions            |
| Length error vs Brannock / known foot (median)        | ≤ 2 mm                                 |
| Size-related return / exchange rate vs baseline       | Relative reduction ≥ 15% after 6 weeks |
| Consent + erase path exercised                        | 100% of pilot stores trained           |

Track merchant KPIs via `GET /v1/merchants/orgs/:orgId/pilot-metrics`.

## Setup checklist

1. Create merchant org (`POST /v1/merchants/orgs`) with `region: "Northern Cape"`.
2. Issue store API key (`POST .../api-keys`) — POS / feed uses `X-Api-Key`.
3. Ingest catalogue + inventory (`.../catalogue/ingest`, `.../inventory`).
4. Upload brand/model fit profiles (`PUT .../brand-fit`) for local SKUs.
5. Wire embed with `locale=en-ZA` (or `af-ZA` / `xh-ZA` / `zu-ZA`) and UK sizing.
6. Enable low-data mode on mid/low-end Android phones (`fitsense:lowDataMode`).
7. POPIA: consent banners, export/erase runbooks, retention job scheduled.

## Store SOP (brief)

1. Consent on device / kiosk before camera.
2. A4 or bank-card on floor; confirm fallback landmarks if prompted.
3. Dual foot when possible; withhold recommendation if confidence low.
4. Apply size in till / embed; log purchase / exchange / return via outcomes API.
5. Weekly pull of `pilot-metrics` + accuracy JSONL sample.

## Expansion path (broader SA retailers)

1. Replicate org + catalogue feed contract per retailer chain.
2. Keep Mondopoint mm as canonical; present UK by default for SA.
3. Require verified `dataQuality` before raising recommendation confidence.
4. Compare return rates store-by-store before national rollout.

See also: [ACCURACY_STUDY.md](../ACCURACY_STUDY.md), [BACKUP_RESTORE.md](./BACKUP_RESTORE.md), merchant API in `backend/README.md`.
