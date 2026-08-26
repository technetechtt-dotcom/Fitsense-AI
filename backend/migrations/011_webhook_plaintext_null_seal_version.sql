-- Seal all webhook signing secrets; stop storing plaintext.

-- Prefer sealed ciphertext; clear legacy plaintext after backfill.
UPDATE merchant_webhook_endpoints
SET signing_secret_enc = signing_secret
WHERE signing_secret_enc IS NULL
  AND signing_secret IS NOT NULL
  AND signing_secret <> 'sealed'
  AND signing_secret NOT LIKE 'fsenc1:%';

UPDATE merchant_webhook_endpoints
SET signing_secret = 'sealed'
WHERE signing_secret IS DISTINCT FROM 'sealed'
  AND (
    signing_secret_enc LIKE 'fsenc1:%'
    OR signing_secret = 'sealed'
  );

ALTER TABLE merchant_webhook_endpoints
  ADD COLUMN IF NOT EXISTS seal_key_version text NOT NULL DEFAULT 'v1';

-- Reservation expiry audit helper column (last transition).
ALTER TABLE store_reservations
  ADD COLUMN IF NOT EXISTS last_transition_at timestamptz NOT NULL DEFAULT now();
