-- Split commercial order-line identity from outcome-event uniqueness.
-- Event retries: (org_id, idempotency_key)
-- One outcome kind per commercial line: (org_id, order_line_id, kind)

DROP INDEX IF EXISTS idx_merchant_outcomes_org_order_line;

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_outcomes_org_line_kind
  ON merchant_outcomes (org_id, order_line_id, kind)
  WHERE order_line_id IS NOT NULL;
