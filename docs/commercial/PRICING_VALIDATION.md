# Pricing validation with retailers

Platform metering (`scan_sync`, `order_ingest`) and invoice generation are scaffolding until commercial terms are countersigned.

## Validation steps

1. Present draft plans (pilot / growth / enterprise) to ≥ 3 retailers.
2. Record willingness-to-pay, must-have integrations, and SLA expectations.
3. Store agreed success criteria on `PUT .../pilot-contracts`.
4. Capture signed commercial notes in `operator_agreements` + `pricingNotes`.
5. File summary in `docs/records/pricing-validation-YYYY-MM.md`.

## Guardrails

- Do not bill production orgs until Stripe (or equivalent) customer + subscription IDs are set on `merchant_billing`.
- Entitlement checks must fail closed for `canceled` / `unpaid` status.
