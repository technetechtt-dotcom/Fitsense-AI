-- FitSense baseline schema (auth, sync, handoff, fit identity, merchants).
-- Idempotent CREATE IF NOT EXISTS for greenfield and existing environments.

CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devices (
  device_id text PRIMARY KEY,
  secret_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS auth_challenges (
  challenge_id text PRIMARY KEY,
  device_id text NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  nonce_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires_at
  ON auth_challenges (expires_at);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_hash text PRIMARY KEY,
  device_id text NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  replaced_by_hash text
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_device_id
  ON refresh_tokens (device_id);

CREATE TABLE IF NOT EXISTS revoked_access_jtis (
  jti text PRIMARY KEY,
  device_id text NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revoked_access_jtis_expires_at
  ON revoked_access_jtis (expires_at);

CREATE TABLE IF NOT EXISTS security_events (
  id bigserial PRIMARY KEY,
  event_type text NOT NULL,
  device_id text,
  ip text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fit_profiles (
  uid text PRIMARY KEY,
  fit_id text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scans (
  uid text NOT NULL,
  scan_id text NOT NULL,
  data jsonb NOT NULL,
  created_at_epoch_ms bigint,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (uid, scan_id)
);

CREATE INDEX IF NOT EXISTS idx_scans_uid_created_at_epoch_ms
  ON scans (uid, created_at_epoch_ms DESC);

CREATE TABLE IF NOT EXISTS fit_events (
  uid text NOT NULL,
  event_id text NOT NULL,
  fit_id text,
  data jsonb NOT NULL,
  epoch_ms bigint,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (uid, event_id)
);

CREATE INDEX IF NOT EXISTS idx_fit_events_uid_epoch_ms
  ON fit_events (uid, epoch_ms DESC);

CREATE TABLE IF NOT EXISTS handoff_sessions (
  session_id text PRIMARY KEY,
  publish_token_hash text NOT NULL,
  consume_token_hash text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  cancelled_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_handoff_sessions_expires_at
  ON handoff_sessions (expires_at);

-- Legacy handoff column upgrades (no-op when already present).
ALTER TABLE handoff_sessions
  ADD COLUMN IF NOT EXISTS publish_token_hash text,
  ADD COLUMN IF NOT EXISTS consume_token_hash text,
  ADD COLUMN IF NOT EXISTS consumed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE handoff_sessions ALTER COLUMN payload DROP NOT NULL;

CREATE TABLE IF NOT EXISTS fit_recovery_codes (
  code_hash text PRIMARY KEY,
  device_id text NOT NULL,
  fit_id text NOT NULL,
  profile_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_fit_recovery_codes_expires_at
  ON fit_recovery_codes (expires_at);

CREATE TABLE IF NOT EXISTS merchant_orgs (
  org_id text PRIMARY KEY,
  name text NOT NULL,
  region text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchant_members (
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  device_id text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, device_id)
);

CREATE TABLE IF NOT EXISTS merchant_api_keys (
  key_hash text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_merchant_api_keys_org
  ON merchant_api_keys (org_id);

CREATE TABLE IF NOT EXISTS catalogue_products (
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  product_id text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, product_id)
);

CREATE TABLE IF NOT EXISTS catalogue_inventory (
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  product_id text NOT NULL,
  size_system text NOT NULL,
  size_label text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, product_id, size_system, size_label)
);

CREATE TABLE IF NOT EXISTS brand_fit_profiles (
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  brand text NOT NULL,
  model text NOT NULL DEFAULT '',
  eu_size_delta double precision NOT NULL DEFAULT 0,
  toe_box_width text NOT NULL DEFAULT 'regular',
  midsole_feel text NOT NULL DEFAULT 'balanced',
  note text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, brand, model)
);

CREATE TABLE IF NOT EXISTS merchant_outcomes (
  outcome_id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  kind text NOT NULL,
  product_id text,
  brand text,
  size_label text,
  size_system text,
  fit_id text,
  reason text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_outcomes_org_created
  ON merchant_outcomes (org_id, created_at DESC);
