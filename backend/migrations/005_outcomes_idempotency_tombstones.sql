-- Outcome order-line / idempotency uniqueness + scan deletion tombstones.

ALTER TABLE merchant_outcomes
  ADD COLUMN IF NOT EXISTS order_line_id text;

ALTER TABLE merchant_outcomes
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_outcomes_org_idempotency
  ON merchant_outcomes (org_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_outcomes_org_order_line
  ON merchant_outcomes (org_id, order_line_id)
  WHERE order_line_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS scan_tombstones (
  uid text NOT NULL,
  scan_id text NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (uid, scan_id)
);

CREATE INDEX IF NOT EXISTS idx_scan_tombstones_uid_deleted
  ON scan_tombstones (uid, deleted_at DESC);
