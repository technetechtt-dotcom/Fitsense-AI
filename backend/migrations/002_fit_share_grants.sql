-- Merchant Fit ID share grants under explicit user consent.
CREATE TABLE IF NOT EXISTS fit_share_grants (
  grant_id text PRIMARY KEY,
  device_id text NOT NULL,
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  fit_id text NOT NULL,
  profile_json jsonb NOT NULL,
  token_hash text NOT NULL UNIQUE,
  purpose text NOT NULL DEFAULT 'sizing',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  redeemed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_fit_share_grants_device
  ON fit_share_grants (device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fit_share_grants_org
  ON fit_share_grants (org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fit_share_grants_expires
  ON fit_share_grants (expires_at);
