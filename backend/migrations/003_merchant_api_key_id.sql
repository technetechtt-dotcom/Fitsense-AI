-- Merchant API key lifecycle: stable key_id for list/revoke.
ALTER TABLE merchant_api_keys
  ADD COLUMN IF NOT EXISTS key_id text;

UPDATE merchant_api_keys
SET key_id = 'key_' || substr(key_hash, 1, 20)
WHERE key_id IS NULL OR key_id = '';

ALTER TABLE merchant_api_keys
  ALTER COLUMN key_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_api_keys_key_id
  ON merchant_api_keys (key_id);
