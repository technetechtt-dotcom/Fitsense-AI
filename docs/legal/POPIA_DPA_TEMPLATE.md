# POPIA data processing agreement template (pilot)

**Status:** Template for Kimberley / Northern Cape pilots — not legal advice.
Replace bracketed fields with counsel-approved terms before signing.

## Parties

| Role                           | Party                               |
| ------------------------------ | ----------------------------------- |
| Responsible party (controller) | [RETAILER / INSTITUTION LEGAL NAME] |
| Operator (processor)           | FitSense AI / [OPERATOR LEGAL NAME] |

## Purpose

Process foot measurement–derived size recommendations and merchant purchase /
return / exchange outcomes solely to improve footwear sizing and reduce
size-related returns during the agreed pilot. FitSense is **not** a medical
device and does not provide diagnostic services.

## Categories of personal information

- Device identifiers and sync account identifiers
- Foot length / width in millimetres derived on-device (not raw camera frames)
- Optional Fit Identity share tokens / recovery codes (hashed at rest where applicable)
- Merchant outcome rows (purchase / return / exchange) including optional `orderId`
  and `deviceId` for attribution and erase

## Retention

| Store                         | Default            | Override                                    |
| ----------------------------- | ------------------ | ------------------------------------------- |
| Scans / fit events / profiles | 730 days           | `RETENTION_SCAN_DAYS` / `EVENT` / `PROFILE` |
| Merchant outcomes             | 730 days           | `RETENTION_OUTCOME_DAYS`                    |
| Handoff sessions              | minutes / ≤ 7 days | server TTL                                  |
| Fit share grants              | 7 days             | `FIT_SHARE_TTL_MS`                          |

Retention jobs: `backend` `npm run retention:run`.

## Data subject rights

Access, correction, deletion, and withdrawal of consent via in-app Privacy /
Settings and merchant portal erase:

- `DELETE /v1/merchants/orgs/:orgId/outcomes?deviceId=` (admin+) removes
  outcomes attributed to that device (`data.deviceId`).
- Cloud sync erase removes the user’s scans / events / profiles.

## Security measures

- TLS in transit; encrypted Android sync outbox at rest
- API keys (`fs_live_…`) revocable; device Bearer auth for ownership
- Unsigned FSP1 imports are **not** treated as sizing truth

## Subprocessors

List hosting (e.g. Render API, Neon Postgres) and analytics only if consented.

## Pilot scope

Geography: Northern Cape / Kimberley stores listed in the pilot schedule.
Duration: [START] – [END]. Success metrics per `docs/ops/PILOT_KIMBERLEY.md`.

## Signatures

|                   | Name | Date |
| ----------------- | ---- | ---- |
| Responsible party |      |      |
| Operator          |      |      |
