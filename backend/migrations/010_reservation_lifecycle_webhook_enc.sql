-- Reservation idempotency + confirm/cancel/collect lifecycle.

ALTER TABLE store_reservations
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_reservations_idempotency
  ON store_reservations (org_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Encrypt webhook signing secrets at rest (ciphertext replaces plaintext).
ALTER TABLE merchant_webhook_endpoints
  ADD COLUMN IF NOT EXISTS signing_secret_enc text;

-- Backfill: existing plaintext stays readable until next rotation; prefer enc when set.
UPDATE merchant_webhook_endpoints
SET signing_secret_enc = signing_secret
WHERE signing_secret_enc IS NULL AND signing_secret IS NOT NULL;
