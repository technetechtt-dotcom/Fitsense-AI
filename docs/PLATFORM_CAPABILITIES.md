# FitSense platform capabilities

Operational map for retailer, consumer, security, and commercial features shipped in migration `008_platform_capabilities.sql`.

## Retailer

| Capability                   | API surface                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Catalogue ingest             | `POST .../catalogue/ingest` + `POST .../csv/catalogue`                                                          |
| Inventory by store/warehouse | `PUT/GET .../inventory` (`locationId`); locations via `PUT/GET .../locations`                                   |
| Price & promo sync           | `PUT/GET .../prices`, `PUT/GET .../promotions`, CSV `.../csv/prices`                                            |
| Order ingestion              | `POST/GET .../orders`                                                                                           |
| Returns / exchanges          | `POST/GET .../returns` (+ outcomes attribution)                                                                 |
| Webhooks + retries + DLQ     | `POST/GET .../webhooks`, deliveries, `.../retry`, `POST .../webhooks/process` / `POST /v1/ops/webhooks/process` |
| Reconciliation               | `POST .../reconciliation`                                                                                       |
| Staff roles & invitations    | members + `POST/GET .../invitations`, `POST /merchants/invitations/accept`                                      |
| Multi-store hierarchy        | `merchant_locations` (`store` / `warehouse` / `region`, `parentLocationId`)                                     |
| Regional / store analytics   | `GET .../analytics/stores?region=`                                                                              |
| CSV fallback                 | `POST .../csv/{catalogue\|inventory\|prices}`                                                                   |
| Integration monitoring       | `POST/GET .../integrations/health`                                                                              |
| Credential rotation          | `POST .../credentials/rotate` (+ API key revoke)                                                                |

Webhook verify: `HMAC-SHA256(secret, `${timestamp}.${body}`)` → header `X-FitSense-Signature: v1=<hex>` with `X-FitSense-Timestamp`.

## Consumer

| Capability                  | API / UI                                                            |
| --------------------------- | ------------------------------------------------------------------- |
| Durable accounts            | `POST/GET /v1/accounts`, `/accounts/me`                             |
| Passkeys (WebAuthn)         | `/v1/accounts/webauthn/register                                     | authenticate/{options,verify}`— set`WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN` |
| Consent                     | `POST/GET /v1/accounts/consent`                                     |
| Dependants                  | `PUT/GET /v1/accounts/dependants` (consent required)                |
| Recovery                    | `POST /v1/accounts/recovery/mint                                    | consume`                                                               |
| Measurement export / delete | sync erase + `GET /accounts/export`, `DELETE /accounts/me` (+ DSAR) |
| Local store availability    | `GET /v1/stores/availability`                                       |
| Reserve / click & collect   | `POST /v1/stores/reservations`; orders `fulfillment`                |
| Recommendation confidence   | client labels confidence % / band (never invents mm)                |
| Unsupported-device guidance | Scan AR-unsupported phase + `docs/SUPPORTED_DEVICES.md`             |
| en / af localization        | `src/lib/i18n/locale.ts` (`en-ZA`, `af-ZA`)                         |
| Accessibility testing       | `docs/a11y/ACCESSIBILITY_TESTING.md`                                |

## Security & compliance

| Item                          | Location                                                                 |
| ----------------------------- | ------------------------------------------------------------------------ |
| Pen-test engagement           | `docs/security/PENTEST_SCOPE.md`, findings template                      |
| Threat model + data flow      | `docs/security/THREAT_MODEL.md`                                          |
| POPIA processing register     | `GET /v1/compliance/processing-register` + `docs/legal/POPIA_PROCESS.md` |
| Operator agreements           | `PUT /v1/compliance/operator-agreements` + DPA template                  |
| Retention verification        | `GET /v1/compliance/retention/verify` + retention job                    |
| DSAR workflow                 | `POST/GET/PATCH /v1/compliance/dsar`                                     |
| Breach response               | `POST/GET/PATCH /v1/compliance/breaches` + IR doc                        |
| Secret rotation               | `docs/security/KEY_ROTATION.md` + credential rotate API                  |
| Audit log hash chain          | `GET /v1/compliance/audit/verify`                                        |
| Rate limiting                 | `middleware/rateLimit.ts`                                                |
| Dependency / container scan   | CI `security-scan` job                                                   |
| DR testing                    | `docs/ops/DISASTER_RECOVERY.md`                                          |
| Security contact / disclosure | `SECURITY.md`                                                            |

## Commercial

| Capability                         | API                                                                   |
| ---------------------------------- | --------------------------------------------------------------------- |
| Subscriptions / billing metadata   | existing `merchant_billing` + Stripe ids columns                      |
| Entitlements                       | `GET .../entitlements/:feature`                                       |
| Usage metering                     | `POST/GET .../usage`                                                  |
| Invoice + payment reconcile        | `.../invoices/generate`, `.../invoices/reconcile`, `GET .../invoices` |
| Onboarding                         | `POST .../onboarding/step`                                            |
| Support + escalation               | `.../support/tickets` (+ escalate/resolve)                            |
| SLA reporting                      | `GET .../support/sla`                                                 |
| Integration certification          | `PUT .../certifications`                                              |
| Pilot contracts / success criteria | `PUT .../pilot-contracts`                                             |
| Pricing validation                 | `docs/commercial/PRICING_VALIDATION.md`                               |

Cron: `npm run webhooks:process` (backend) for delivery retries.
