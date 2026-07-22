# Secret key rotation

## Secrets

| Secret           | Used for                                         |
| ---------------- | ------------------------------------------------ |
| `AUTH_SECRET`    | Device access/refresh token HMAC                 |
| `HANDOFF_SECRET` | Handoff publish/consume token HMAC (must differ) |

## Rotation steps

1. Generate a new secret (≥ 32 random bytes, URL-safe).
2. Deploy API with the new value (Render env → manual deploy).
3. Expect existing access tokens and refresh tokens signed with the old
   secret to fail — clients re-register / re-challenge automatically.
4. Active handoff sessions become invalid; users restart QR handoff.
5. Record rotation time in the ops log; do not commit secrets.

Optional: introduce `AUTH_KID` / `HANDOFF_KID` dual-key verification before
hard cutover if zero-downtime rotation is required.
