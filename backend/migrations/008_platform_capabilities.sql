-- Platform capabilities: multi-store, orders, pricing, webhooks, invitations,
-- customer accounts / WebAuthn, support, metering, audit chain, DSARs.

-- ---------------------------------------------------------------------------
-- Retailer locations (stores + warehouses) and inventory by location
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_locations (
  location_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('store', 'warehouse', 'region')),
  region text,
  parent_location_id text REFERENCES merchant_locations(location_id) ON DELETE SET NULL,
  timezone text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_merchant_locations_org
  ON merchant_locations (org_id);

ALTER TABLE catalogue_inventory
  ADD COLUMN IF NOT EXISTS location_id text NOT NULL DEFAULT 'default';

ALTER TABLE catalogue_inventory
  DROP CONSTRAINT IF EXISTS catalogue_inventory_pkey;

ALTER TABLE catalogue_inventory
  ADD PRIMARY KEY (org_id, location_id, product_id, size_system, size_label, width_label);

CREATE INDEX IF NOT EXISTS idx_catalogue_inventory_location
  ON catalogue_inventory (org_id, location_id);

-- ---------------------------------------------------------------------------
-- Price & promotion sync
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_prices (
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  product_id text NOT NULL,
  currency text NOT NULL DEFAULT 'ZAR',
  amount_cents integer NOT NULL,
  location_id text NOT NULL DEFAULT 'default',
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, product_id, currency, location_id)
);

CREATE TABLE IF NOT EXISTS merchant_promotions (
  promotion_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  percent_off double precision,
  amount_off_cents integer,
  product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  location_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, code)
);

-- ---------------------------------------------------------------------------
-- Orders, returns / exchanges (OMS domain; outcomes remain attribution events)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_orders (
  order_id text NOT NULL,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  external_order_id text NOT NULL,
  location_id text,
  status text NOT NULL DEFAULT 'open',
  currency text NOT NULL DEFAULT 'ZAR',
  customer_ref text,
  fulfillment text CHECK (fulfillment IS NULL OR fulfillment IN (
    'ship', 'click_and_collect', 'reserve', 'in_store'
  )),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, order_id),
  UNIQUE (org_id, external_order_id)
);

CREATE TABLE IF NOT EXISTS merchant_order_lines (
  org_id text NOT NULL,
  order_id text NOT NULL,
  line_id text NOT NULL,
  product_id text,
  sku text,
  size_system text,
  size_label text,
  width_label text DEFAULT 'standard',
  quantity integer NOT NULL DEFAULT 1,
  unit_amount_cents integer,
  status text NOT NULL DEFAULT 'open',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (org_id, order_id, line_id),
  FOREIGN KEY (org_id, order_id) REFERENCES merchant_orders(org_id, order_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS merchant_returns (
  return_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  order_id text NOT NULL,
  line_id text,
  kind text NOT NULL CHECK (kind IN ('return', 'exchange')),
  reason text,
  status text NOT NULL DEFAULT 'requested',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_returns_org
  ON merchant_returns (org_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Webhooks: endpoints, deliveries with retries + dead-letter
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_webhook_endpoints (
  endpoint_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  url text NOT NULL,
  secret_hash text NOT NULL,
  secret_prefix text NOT NULL,
  -- Outbound HMAC key (rotate via credential rotation API). Prefer KMS/vault in production.
  signing_secret text NOT NULL,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchant_webhook_deliveries (
  delivery_id text PRIMARY KEY,
  endpoint_id text NOT NULL REFERENCES merchant_webhook_endpoints(endpoint_id) ON DELETE CASCADE,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivering', 'delivered', 'retrying', 'dead_letter')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_status_code integer,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_due
  ON merchant_webhook_deliveries (status, next_attempt_at)
  WHERE status IN ('pending', 'retrying');

-- ---------------------------------------------------------------------------
-- Staff invitations + credential rotation tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_invitations (
  invitation_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
  token_hash text NOT NULL UNIQUE,
  invited_by_device_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

CREATE TABLE IF NOT EXISTS merchant_credential_rotations (
  rotation_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  kind text NOT NULL,
  actor_device_id text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Integration health monitoring
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_integration_checks (
  check_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  integration_kind text NOT NULL,
  status text NOT NULL CHECK (status IN ('ok', 'degraded', 'error')),
  latency_ms integer,
  detail text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_checks_org
  ON merchant_integration_checks (org_id, checked_at DESC);

-- ---------------------------------------------------------------------------
-- Reconciliation reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_reconciliation_runs (
  run_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Usage metering + invoice stubs (real Stripe when STRIPE_* configured)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_usage_events (
  event_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  metric text NOT NULL,
  quantity double precision NOT NULL DEFAULT 1,
  period_key text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_org_period
  ON merchant_usage_events (org_id, period_key, metric);

CREATE TABLE IF NOT EXISTS merchant_invoices (
  invoice_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  period_key text NOT NULL,
  currency text NOT NULL DEFAULT 'ZAR',
  amount_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  external_ref text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  UNIQUE (org_id, period_key)
);

ALTER TABLE merchant_billing
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS entitlement_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contract_ref text;

-- ---------------------------------------------------------------------------
-- Support tickets + SLA
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  ticket_id text PRIMARY KEY,
  org_id text REFERENCES merchant_orgs(org_id) ON DELETE SET NULL,
  account_id text,
  subject text NOT NULL,
  body text NOT NULL,
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'pending', 'escalated', 'resolved', 'closed')),
  sla_due_at timestamptz,
  escalated_at timestamptz,
  resolved_at timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_ticket_events (
  event_id text PRIMARY KEY,
  ticket_id text NOT NULL REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
  kind text NOT NULL,
  note text,
  actor text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Tamper-resistant audit log (hash chain)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  seq bigserial PRIMARY KEY,
  org_id text,
  actor_id text,
  action text NOT NULL,
  resource text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  prev_hash text,
  entry_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_org_created
  ON audit_log (org_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Consumer durable accounts, passkeys, dependants, consent
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_accounts (
  account_id text PRIMARY KEY,
  email text UNIQUE,
  display_name text,
  primary_device_id text,
  locale text NOT NULL DEFAULT 'en-ZA',
  recovery_email text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_account_devices (
  account_id text NOT NULL REFERENCES customer_accounts(account_id) ON DELETE CASCADE,
  device_id text NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, device_id)
);

CREATE TABLE IF NOT EXISTS webauthn_credentials (
  credential_id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES customer_accounts(account_id) ON DELETE CASCADE,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports jsonb NOT NULL DEFAULT '[]'::jsonb,
  device_type text,
  backed_up boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webauthn_challenges (
  challenge_id text PRIMARY KEY,
  account_id text,
  device_id text,
  type text NOT NULL CHECK (type IN ('registration', 'authentication')),
  challenge text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dependant_profiles (
  dependant_id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES customer_accounts(account_id) ON DELETE CASCADE,
  display_name text NOT NULL,
  relationship text,
  fit_id text,
  consent_given boolean NOT NULL DEFAULT false,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consent_records (
  consent_id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES customer_accounts(account_id) ON DELETE CASCADE,
  purpose text NOT NULL,
  granted boolean NOT NULL,
  version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_recovery_tokens (
  token_hash text PRIMARY KEY,
  account_id text NOT NULL REFERENCES customer_accounts(account_id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Reservations / click-and-collect handoff
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_reservations (
  reservation_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  location_id text NOT NULL,
  account_id text,
  device_id text,
  product_id text NOT NULL,
  size_system text NOT NULL,
  size_label text NOT NULL,
  width_label text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'held'
    CHECK (status IN ('held', 'ready', 'collected', 'cancelled', 'expired')),
  hold_until timestamptz NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_org_loc
  ON store_reservations (org_id, location_id, status);

-- ---------------------------------------------------------------------------
-- Compliance: DSAR, processing register, breach log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dsar_requests (
  request_id text PRIMARY KEY,
  account_id text,
  email text,
  device_id text,
  type text NOT NULL CHECK (type IN ('access', 'export', 'erasure', 'rectification')),
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'in_progress', 'completed', 'rejected')),
  result_ref text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS processing_register (
  entry_id text PRIMARY KEY,
  purpose text NOT NULL,
  legal_basis text NOT NULL,
  data_categories text NOT NULL,
  recipients text,
  retention text NOT NULL,
  transfer text,
  security_measures text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS breach_incidents (
  incident_id text PRIMARY KEY,
  title text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'contained', 'notified', 'closed')),
  discovered_at timestamptz NOT NULL,
  notified_regulator_at timestamptz,
  notified_subjects_at timestamptz,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operator_agreements (
  agreement_id text PRIMARY KEY,
  org_id text REFERENCES merchant_orgs(org_id) ON DELETE SET NULL,
  counterparty text NOT NULL,
  kind text NOT NULL,
  version text NOT NULL,
  signed_at timestamptz,
  document_ref text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_certifications (
  cert_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  connector text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'certified', 'revoked')),
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  certified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, connector)
);

CREATE TABLE IF NOT EXISTS pilot_contracts (
  contract_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  title text NOT NULL,
  success_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  pricing_notes text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
