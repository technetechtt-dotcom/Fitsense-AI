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

| Method  | Path                                               | Auth                                                        |
| ------- | -------------------------------------------------- | ----------------------------------------------------------- |
| POST    | `/v1/merchants/orgs`                               | device Bearer                                               |
| GET     | `/v1/merchants/orgs`                               | device Bearer                                               |
| PUT     | `/v1/merchants/orgs/:orgId/members`                | admin+                                                      |
| POST    | `/v1/merchants/orgs/:orgId/api-keys`               | admin+                                                      |
| GET     | `/v1/merchants/orgs/:orgId/api-keys`               | admin+                                                      |
| POST    | `/v1/merchants/orgs/:orgId/api-keys/:keyId/revoke` | admin+                                                      |
| POST    | `/v1/merchants/orgs/:orgId/catalogue/ingest`       | operator+ or API key                                        |
| GET     | `/v1/merchants/orgs/:orgId/catalogue`              | viewer+                                                     |
| PUT     | `/v1/merchants/orgs/:orgId/inventory`              | operator+                                                   |
| GET     | `/v1/merchants/orgs/:orgId/inventory`              | viewer+                                                     |
| PUT/GET | `/v1/merchants/orgs/:orgId/brand-fit`              | operator+ / viewer+                                         |
| POST    | `/v1/merchants/orgs/:orgId/outcomes`               | operator+ or API key (`purchase` \| `return` \| `exchange`) |
| GET     | `/v1/merchants/orgs/:orgId/pilot-metrics`          | viewer+                                                     |

Catalogue ingest accepts ≤ 200 products per request. Inventory ≤ 500 rows.

### Outcomes + orders

Optional `orderId` on POST outcomes is stored in `data.orderId` for retail attribution. Return rate = `returns ÷ purchases` (not diluted by mixing kinds).

## Web portal

In-app route: **`/merchant`** (also linked from Home + Settings).

- Create / select org (persisted in `localStorage` as `fitsense:merchantOrgId`)
- Ingest sample Kimberley feed (`public/samples/kimberley-catalogue-feed.json`, mirrored under `docs/samples/`) including inventory rows
- Upsert brand-fit profiles; seed / list inventory by size
- Record outcomes with optional order id
- Create / list / revoke API keys
- View pilot metrics
- Loaded merchant catalogue replaces the built-in demo shelf for recommendations (`src/lib/catalogueRuntime.ts`)

Requires `VITE_API_BASE_URL` and device cloud auth. Optional `VITE_MERCHANT_ORG_ID` / `VITE_MERCHANT_API_KEY` for kiosk brand-fit bootstrap.

## Client notes

- Web: `exchange` fit events + offline sync outbox; locales in `src/lib/i18n/locale.ts`.
- Brand deltas: static `src/data/brandFit.ts` + merchant overrides via `registerMerchantBrandFits`.
- Web bootstrap loads org profiles when `VITE_MERCHANT_ORG_ID` (+ optional `VITE_MERCHANT_API_KEY`) is set.
- Pilot runbook: [docs/ops/PILOT_KIMBERLEY.md](ops/PILOT_KIMBERLEY.md).
- Retention: `RETENTION_OUTCOME_DAYS` (default 730) purges `merchant_outcomes` in the POPIA retention job.
