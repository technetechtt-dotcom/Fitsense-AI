# Merchant platform (orgs, catalogue, outcomes)

## Roles

| Role       | Capabilities                                 |
| ---------- | -------------------------------------------- |
| `owner`    | Full control                                 |
| `admin`    | Members + API keys                           |
| `operator` | Catalogue / inventory / brand-fit / outcomes |
| `viewer`   | Read catalogue, brand-fit, pilot metrics     |

Partner **API keys** (`X-Api-Key: fs_live_…`) act as **operator**.

## Endpoints

| Method  | Path                                         | Auth                                                        |
| ------- | -------------------------------------------- | ----------------------------------------------------------- |
| POST    | `/v1/merchants/orgs`                         | device Bearer                                               |
| GET     | `/v1/merchants/orgs`                         | device Bearer                                               |
| PUT     | `/v1/merchants/orgs/:orgId/members`          | admin+                                                      |
| POST    | `/v1/merchants/orgs/:orgId/api-keys`         | admin+                                                      |
| POST    | `/v1/merchants/orgs/:orgId/catalogue/ingest` | operator+ or API key                                        |
| GET     | `/v1/merchants/orgs/:orgId/catalogue`        | viewer+                                                     |
| PUT     | `/v1/merchants/orgs/:orgId/inventory`        | operator+                                                   |
| PUT/GET | `/v1/merchants/orgs/:orgId/brand-fit`        | operator+ / viewer+                                         |
| POST    | `/v1/merchants/orgs/:orgId/outcomes`         | operator+ or API key (`purchase` \| `return` \| `exchange`) |
| GET     | `/v1/merchants/orgs/:orgId/pilot-metrics`    | viewer+                                                     |

Catalogue ingest accepts ≤ 200 products per request. Inventory ≤ 500 rows.

## Client notes

- Web: `exchange` fit events + offline sync outbox; locales in `src/lib/i18n/locale.ts`.
- Brand deltas: static `src/data/brandFit.ts` + merchant overrides via `registerMerchantBrandFits`.
- Web bootstrap loads org profiles when `VITE_MERCHANT_ORG_ID` (+ optional `VITE_MERCHANT_API_KEY`) is set.
- Pilot runbook: [docs/ops/PILOT_KIMBERLEY.md](ops/PILOT_KIMBERLEY.md).
