import { createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { requireMigrationsApplied } from "./migrate.js";

async function ensureSchema(): Promise<void> {
  if (!isPostgresConfigured()) {
    throw new Error("DATABASE_URL is required for Fit Identity share grants.");
  }
  await requireMigrationsApplied();
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function mintShareToken(): string {
  return `FSMS1.${randomBytes(24).toString("base64url")}`;
}

function newGrantId(): string {
  return `fsg_${randomBytes(12).toString("hex")}`;
}

export async function createShareGrant(input: {
  deviceId: string;
  orgId: string;
  fitProfile: { fitId: string } & Record<string, unknown>;
  purpose?: string;
  ttlMs?: number;
}): Promise<{
  grantId: string;
  shareToken: string;
  expiresAtEpochMs: number;
  fitId: string;
  orgId: string;
  purpose: string;
}> {
  await ensureSchema();
  const org = await getPostgresPool().query(
    "SELECT org_id FROM merchant_orgs WHERE org_id = $1",
    [input.orgId],
  );
  if (!org.rows[0]) {
    return Promise.reject(
      Object.assign(new Error("merchant_org_not_found"), { status: 404 }),
    );
  }

  const grantId = newGrantId();
  const shareToken = mintShareToken();
  const ttl = Math.min(
    Math.max(input.ttlMs ?? config.fitShareTtlMs, 60_000),
    config.fitShareTtlMs,
  );
  const expiresAtEpochMs = Date.now() + ttl;
  const purpose = (input.purpose ?? "sizing").trim().slice(0, 64) || "sizing";

  await getPostgresPool().query(
    `
      INSERT INTO fit_share_grants (
        grant_id, device_id, org_id, fit_id, profile_json, token_hash, purpose, expires_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
    `,
    [
      grantId,
      input.deviceId,
      input.orgId,
      input.fitProfile.fitId,
      JSON.stringify(input.fitProfile),
      sha256Hex(shareToken),
      purpose,
      new Date(expiresAtEpochMs),
    ],
  );

  return {
    grantId,
    shareToken,
    expiresAtEpochMs,
    fitId: input.fitProfile.fitId,
    orgId: input.orgId,
    purpose,
  };
}

export async function listShareGrants(deviceId: string): Promise<
  Array<{
    grantId: string;
    orgId: string;
    fitId: string;
    purpose: string;
    createdAtEpochMs: number;
    expiresAtEpochMs: number;
    revoked: boolean;
    redeemed: boolean;
  }>
> {
  await ensureSchema();
  const result = await getPostgresPool().query<{
    grant_id: string;
    org_id: string;
    fit_id: string;
    purpose: string;
    created_at: Date;
    expires_at: Date;
    revoked_at: Date | null;
    redeemed_at: Date | null;
  }>(
    `
      SELECT grant_id, org_id, fit_id, purpose, created_at, expires_at, revoked_at, redeemed_at
      FROM fit_share_grants
      WHERE device_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `,
    [deviceId],
  );
  return result.rows.map((r) => ({
    grantId: r.grant_id,
    orgId: r.org_id,
    fitId: r.fit_id,
    purpose: r.purpose,
    createdAtEpochMs: r.created_at.getTime(),
    expiresAtEpochMs: r.expires_at.getTime(),
    revoked: r.revoked_at != null,
    redeemed: r.redeemed_at != null,
  }));
}

export async function revokeShareGrant(input: {
  deviceId: string;
  grantId: string;
}): Promise<boolean> {
  await ensureSchema();
  const result = await getPostgresPool().query(
    `
      UPDATE fit_share_grants
      SET revoked_at = now()
      WHERE grant_id = $1
        AND device_id = $2
        AND revoked_at IS NULL
      RETURNING grant_id
    `,
    [input.grantId, input.deviceId],
  );
  return Boolean(result.rows[0]);
}

/**
 * Merchant redeems a user-issued share token with their org API key.
 * One-time consume; org must match the grant.
 */
export async function redeemShareGrant(input: {
  orgId: string;
  shareToken: string;
}): Promise<{ fitId: string; fitProfile: unknown; purpose: string } | null> {
  await ensureSchema();
  await getPostgresPool().query(
    "DELETE FROM fit_share_grants WHERE expires_at <= now() AND redeemed_at IS NULL AND revoked_at IS NULL",
  );
  const result = await getPostgresPool().query<{
    fit_id: string;
    profile_json: unknown;
    purpose: string;
  }>(
    `
      UPDATE fit_share_grants
      SET redeemed_at = now()
      WHERE token_hash = $1
        AND org_id = $2
        AND revoked_at IS NULL
        AND redeemed_at IS NULL
        AND expires_at > now()
      RETURNING fit_id, profile_json, purpose
    `,
    [sha256Hex(input.shareToken.trim()), input.orgId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    fitId: row.fit_id,
    fitProfile: row.profile_json,
    purpose: row.purpose,
  };
}
