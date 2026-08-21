# Threat model and data-flow inventory

## Assets

- Foot measurements (mm) and Fit IDs
- Device auth material (keys, refresh tokens)
- Merchant catalogue, inventory, orders, API keys, webhook secrets
- Customer accounts, passkeys, dependant profiles, consent records
- Billing / usage / invoices

## Trust boundaries

```
[Phone app / Web] --TLS--> [FitSense API] --TLS--> [Postgres]
        |                         |
        |                         +--> [Webhook endpoints (retailer)]
        +--> [ARKit/ARCore / WebXR] (on-device only)
```

## Data flows (summary)

| Flow                | Data                            | Purpose            | Controls                           |
| ------------------- | ------------------------------- | ------------------ | ---------------------------------- |
| Scan → sync         | measurements, scan ids          | Durable history    | Device auth, tombstones, retention |
| Handoff             | short-lived Fit share           | In-store / partner | TTL, secrets, rate limit           |
| Merchant ingest     | products, stock, prices, orders | Retail ops         | Roles / API keys, audit            |
| Webhooks out        | order/return events             | Partner sync       | HMAC, retries, DLQ                 |
| Accounts / WebAuthn | credentials                     | Passwordless login | RP ID binding, challenge TTL       |
| DSAR / erase        | PII export/delete               | POPIA              | Logged requests, retention verify  |

## STRIDE highlights

| Threat            | Mitigations                                             |
| ----------------- | ------------------------------------------------------- |
| Spoofed device    | Challenge-response device auth                          |
| Tampered audit    | Hash-chained `audit_log`                                |
| Stolen API key    | Revoke + rotation records; catalogue tokens short-lived |
| Webhook replay    | Timestamp + signature                                   |
| Measurement fraud | Quality gates; never invent mm; label demo              |
| Abuse             | Global + route rate limits                              |

## Inventory refresh

Update this file when adding processors, regions, or new PII categories. Mirror entries in the live processing register (`GET /v1/compliance/processing-register`).
