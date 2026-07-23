# Physical validation & commercial roadmap checklist

Operational work that cannot be completed in code alone. Track progress here.

## Physical validation

| Item | Status | Notes |
| ---- | ------ | ----- |
| Obtain 5–10 representative Android phones | Open | Fill [DEVICE_MATRIX.md](./DEVICE_MATRIX.md) |
| Obtain Brannock / calibrated tool | Open | Required for P6 accuracy study |
| Recruit 100–300 pilot participants | Open | Kimberley runbook: [ops/PILOT_KIMBERLEY.md](./ops/PILOT_KIMBERLEY.md) |
| Record both feet separately | Supported in app | Dual-foot scan path |
| Repeated scans | Open | Operator protocol |
| Lighting / floors / operators | Open | Matrix cohorts |
| Replace sample accuracy records | Open | Export JSONL from Settings; analyze with `scripts/analyze-accuracy-dataset.mjs` |
| Publish internal accuracy + failure rates | Open | Write to `docs/records/` |

## Commercial development

| Item | Status | Notes |
| ---- | ------ | ----- |
| Merchant portal UI | Open | APIs exist under `/v1/merchants/*` |
| Real footwear retailer catalogue | Open | Ingest endpoints ready |
| Variants, sizes, widths, inventory | Partial | Catalogue + inventory APIs |
| Outcomes ↔ real orders | Open | Outcomes API exists; order linkage TBD |
| Passkey customer accounts | Open | Explicitly deferred — no stubs |
| Complete POPIA implementation | Partial | Privacy copy + retention job; expand |
| Controlled Kimberley pilot | Open | Runbook ready |
| Prove reduced returns / conversions | Open | Fixed return-rate = returns÷purchases |

## Engineering fixes landed (this batch)

- Android cloud scan foot deserialization + merge
- Encrypted sync outbox
- FSP1 distrust for sizing
- Scan revision / conflict merge
- Merchant return-rate + API-key list/revoke
- Staging smoke PUT→GET round-trip
- Protected PR policy documented
