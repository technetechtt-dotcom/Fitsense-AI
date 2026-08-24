# Physical validation & commercial roadmap checklist

Operational work that cannot be completed in code alone. Track progress here.

## Phase 1 — Engineering

| Item                               | Status                                                      |
| ---------------------------------- | ----------------------------------------------------------- |
| Android permanent API keys removed | Done                                                        |
| Catalogue tokens                   | Done                                                        |
| Exact size+width stock             | Done                                                        |
| Mandatory sizeRangeEu              | Done                                                        |
| Outcomes order-line + idempotency  | Done                                                        |
| Client deviceId stripped           | Done                                                        |
| Sync tombstones                    | Done                                                        |
| Catalogue validator in CI          | Done                                                        |
| Protected PR development           | Done (re-enabled)                                           |
| Staging smoke evidence             | Guarded — refuse production hostname; need real staging URL |

## Phase 2 — Accuracy (physical)

| Item                         | Status       | Notes                                             |
| ---------------------------- | ------------ | ------------------------------------------------- |
| Calibrated Brannock          | Open (ops)   | Protocol in ACCURACY_STUDY                        |
| ≥5 SA Android phones         | Open (ops)   | DEVICE_MATRIX + SUPPORTED_DEVICES candidates      |
| 30 internal participants     | Open (ops)   | Run sheet: BRANNOCK_STUDY_30; log CSV empty of mm |
| Fix measurement issues found | Scaffolded   | Quality gates remain; iterate from study          |
| 100–300 expansion            | Open (ops)   |                                                   |
| Publish accuracy report      | Fixed        | Nested mm metrics; sample JSONL not certified     |
| Certify phones               | Tooling done | Promote candidates → certified in JSON            |

## Phase 3 — Kimberley pilot

| Item                        | Status        | Notes                             |
| --------------------------- | ------------- | --------------------------------- |
| Secure real retailer        | Open (ops)    | Recruitment pack + pipeline table |
| Import real catalogue/stock | Scaffolded    | Schema + portal + sample          |
| Order/return integration    | Scaffolded    | Outcomes + orderId + cohort       |
| Assisted vs control         | Done (API/UI) | `cohort` field + metrics split    |
| Measure conversion/returns  | Done (API/UI) | pilot-metrics + CSV               |
| Merchant ROI                | Done (API/UI) | pilot-roi estimates               |
| Improve model from outcomes | Done (API/UI) | outcome-fit-insights → brand ΔEU  |

## Phase 4 — Commercialisation

| Item                                | Status            | Notes                                    |
| ----------------------------------- | ----------------- | ---------------------------------------- |
| POPIA agreements                    | Partial           | Template + PROCESS; counsel signing open |
| Onboarding / billing / integrations | Scaffolded        | billing + integrations tables/API        |
| Monitoring / backup / IR            | Done (docs+hooks) | INCIDENT_RESPONSE + BACKUP_RESTORE       |
| External pen-test                   | Open (ops)        | PENTEST_SCOPE ready                      |
| Limited supported-device launch     | Scaffolded        | supported-devices.json                   |
| NC → national expand                | Open (ops)        | Pilot runbook expansion path             |
