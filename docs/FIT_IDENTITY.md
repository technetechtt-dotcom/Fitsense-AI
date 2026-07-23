# Portable Fit Identity (Priority 7)

FitSense separates **portable measurement identity** from **durable account login**.

| Mechanism | Prefix | Trust | Use |
| --------- | ------ | ----- | --- |
| Local share token | `FSP1.` | Unsigned snapshot | Paste / QR between own devices |
| Recovery code | `FSIR1.` | Server one-time | Device loss; multi-device restore |
| Merchant share | `FSMS1.` | User consent + org API key | In-store / partner sizing |

## Multi-device today

1. Export FSP1 from web Fit Profile or Android Settings, or
2. Issue a recovery code while signed in (device auth), redeem on the new device.

There is **no** automatic merge of anonymous device sync uids. Recovery restores the Fit profile snapshot onto the new device session.

## Merchant consent share

1. User creates a grant for a real `orgId` (`POST /v1/fit-identity/share-grants`).
2. Receives one-time `FSMS1.` token.
3. Merchant redeems with `X-Api-Key` (`POST /v1/fit-identity/share/redeem`).
4. User can list and revoke grants before redeem.

Without consent (no grant) or without the matching org API key, partners cannot read the Fit profile.

## Passkeys

WebAuthn / passkeys are **not implemented yet**. Do not invent client-side stub credentials. When added, they will link durable accounts across devices without replacing geometric measurement trust.

## Surfaces

- Web: `/fit-profile` portable card
- Android: Settings → Portable Fit Identity
- API: `/v1/fit-identity/*`
- Migration: `002_fit_share_grants.sql`
