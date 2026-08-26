# Webhook signing-secret encryption

## At rest

- Column `signing_secret_enc` holds AES-256-GCM ciphertext (`fsenc1:` prefix).
- Column `signing_secret` is a non-secret placeholder (`sealed`) after migration `011`.
- Key material: env `WEBHOOK_SEAL_SECRET` (required in production).
- Key version: `WEBHOOK_SEAL_KEY_VERSION` (default `v1`), stored on each endpoint row.

## Rotate

```bash
cd backend
WEBHOOK_SEAL_SECRET=... WEBHOOK_SEAL_KEY_VERSION=v2 npm run webhooks:rotate-secrets
```

Then set `WEBHOOK_SEAL_KEY_VERSION=v2` on the API service. Keep the previous
seal secret available until all rows are re-sealed (script re-seals with the
current env key — bump version first only after dual-key support if needed).

Legacy plaintext rows are accepted by `openSecret` until rotated; do not log
raw or sealed values.

## Production startup

`assertProductionConfig` fails closed if `WEBHOOK_SEAL_SECRET` is missing.
