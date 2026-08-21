-- Pilot cohorts, merchant billing/onboarding, outcome fit insights support.

ALTER TABLE merchant_outcomes
  ADD COLUMN IF NOT EXISTS cohort text;

CREATE INDEX IF NOT EXISTS idx_merchant_outcomes_org_cohort
  ON merchant_outcomes (org_id, cohort)
  WHERE cohort IS NOT NULL;

CREATE TABLE IF NOT EXISTS merchant_billing (
  org_id text PRIMARY KEY REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'pilot',
  status text NOT NULL DEFAULT 'trialing',
  billing_email text,
  region text,
  onboarding_step text NOT NULL DEFAULT 'org_created',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchant_integrations (
  org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  external_ref text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, provider)
);
