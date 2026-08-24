-- Atomic click-and-collect holds: available stock = on-hand minus active holds.
-- Webhook deliveries: claim/lock column for concurrent workers.

ALTER TABLE store_reservations
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1
    CHECK (quantity > 0);

CREATE INDEX IF NOT EXISTS idx_reservations_sku_active
  ON store_reservations (org_id, location_id, product_id, size_system, size_label, width_label)
  WHERE status IN ('held', 'ready');

ALTER TABLE merchant_webhook_deliveries
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_claim
  ON merchant_webhook_deliveries (status, next_attempt_at, claimed_at);
