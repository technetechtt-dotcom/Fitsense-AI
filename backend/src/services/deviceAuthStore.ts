import { config } from "../config.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import {
  generateDeviceId,
  generateOpaqueToken,
  sha256Hex,
  timingSafeEqualString,
} from "./sessionAuth.js";

export interface DeviceRecord {
  deviceId: string;
  secretHash: string;
  createdAt: Date;
  revokedAt: Date | null;
}

let schemaReady: Promise<void> | null = null;

export async function ensureAuthSchema(): Promise<void> {
  if (!isPostgresConfigured()) {
    throw new Error("DATABASE_URL is required for device authentication.");
  }
  schemaReady ??= getPostgresPool()
    .query(
      `
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
      `,
    )
    .then(() => undefined);
  await schemaReady;
}

export async function recordSecurityEvent(input: {
  eventType: string;
  deviceId?: string;
  ip?: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  if (!isPostgresConfigured()) return;
  try {
    await ensureAuthSchema();
    await getPostgresPool().query(
      `
        INSERT INTO security_events (event_type, device_id, ip, detail)
        VALUES ($1, $2, $3, $4::jsonb)
      `,
      [
        input.eventType,
        input.deviceId ?? null,
        input.ip ?? null,
        JSON.stringify(input.detail ?? {}),
      ],
    );
  } catch {
    // Never fail the request path because of audit logging.
  }
}

export async function registerDevice(): Promise<{
  deviceId: string;
  deviceSecret: string;
}> {
  await ensureAuthSchema();
  const deviceId = generateDeviceId();
  const deviceSecret = generateOpaqueToken(32);
  await getPostgresPool().query(
    `
      INSERT INTO devices (device_id, secret_hash)
      VALUES ($1, $2)
    `,
    [deviceId, sha256Hex(deviceSecret)],
  );
  return { deviceId, deviceSecret };
}

export async function getActiveDevice(deviceId: string): Promise<DeviceRecord | null> {
  await ensureAuthSchema();
  const result = await getPostgresPool().query<{
    device_id: string;
    secret_hash: string;
    created_at: Date;
    revoked_at: Date | null;
  }>(
    `
      SELECT device_id, secret_hash, created_at, revoked_at
      FROM devices
      WHERE device_id = $1
    `,
    [deviceId],
  );
  const row = result.rows[0];
  if (!row || row.revoked_at) return null;
  return {
    deviceId: row.device_id,
    secretHash: row.secret_hash,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  };
}

export async function createChallenge(deviceId: string): Promise<{
  challengeId: string;
  nonce: string;
  expiresAtEpochMs: number;
}> {
  await ensureAuthSchema();
  await getPostgresPool().query(
    "DELETE FROM auth_challenges WHERE expires_at <= now() OR consumed_at IS NOT NULL",
  );
  const challengeId = generateOpaqueToken(16);
  const nonce = generateOpaqueToken(24);
  const expiresAtEpochMs = Date.now() + config.challengeTtlMs;
  await getPostgresPool().query(
    `
      INSERT INTO auth_challenges (challenge_id, device_id, nonce_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [challengeId, deviceId, sha256Hex(nonce), new Date(expiresAtEpochMs)],
  );
  return { challengeId, nonce, expiresAtEpochMs };
}

export async function consumeChallenge(input: {
  challengeId: string;
  deviceId: string;
  nonce: string;
}): Promise<boolean> {
  await ensureAuthSchema();
  const result = await getPostgresPool().query<{
    nonce_hash: string;
    device_id: string;
  }>(
    `
      UPDATE auth_challenges
      SET consumed_at = now()
      WHERE challenge_id = $1
        AND device_id = $2
        AND consumed_at IS NULL
        AND expires_at > now()
      RETURNING nonce_hash, device_id
    `,
    [input.challengeId, input.deviceId],
  );
  const row = result.rows[0];
  if (!row) return false;
  return timingSafeEqualString(row.nonce_hash, sha256Hex(input.nonce));
}

export async function storeRefreshToken(
  deviceId: string,
  refreshToken: string,
): Promise<void> {
  await ensureAuthSchema();
  await getPostgresPool().query(
    `
      INSERT INTO refresh_tokens (token_hash, device_id, expires_at)
      VALUES ($1, $2, $3)
    `,
    [
      sha256Hex(refreshToken),
      deviceId,
      new Date(Date.now() + config.refreshTokenTtlMs),
    ],
  );
}

export async function rotateRefreshToken(input: {
  refreshToken: string;
  nextRefreshToken: string;
}): Promise<string | null> {
  await ensureAuthSchema();
  const client = await getPostgresPool().connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{
      device_id: string;
      revoked_at: Date | null;
      expires_at: Date;
    }>(
      `
        SELECT device_id, revoked_at, expires_at
        FROM refresh_tokens
        WHERE token_hash = $1
        FOR UPDATE
      `,
      [sha256Hex(input.refreshToken)],
    );
    const row = existing.rows[0];
    if (!row || row.revoked_at || row.expires_at.getTime() <= Date.now()) {
      await client.query("ROLLBACK");
      return null;
    }
    const nextHash = sha256Hex(input.nextRefreshToken);
    await client.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = now(), replaced_by_hash = $2
        WHERE token_hash = $1
      `,
      [sha256Hex(input.refreshToken), nextHash],
    );
    await client.query(
      `
        INSERT INTO refresh_tokens (token_hash, device_id, expires_at)
        VALUES ($1, $2, $3)
      `,
      [nextHash, row.device_id, new Date(Date.now() + config.refreshTokenTtlMs)],
    );
    await client.query("COMMIT");
    return row.device_id;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function revokeRefreshToken(refreshToken: string): Promise<string | null> {
  await ensureAuthSchema();
  const result = await getPostgresPool().query<{ device_id: string }>(
    `
      UPDATE refresh_tokens
      SET revoked_at = now()
      WHERE token_hash = $1 AND revoked_at IS NULL
      RETURNING device_id
    `,
    [sha256Hex(refreshToken)],
  );
  return result.rows[0]?.device_id ?? null;
}

export async function revokeAllRefreshTokens(deviceId: string): Promise<void> {
  await ensureAuthSchema();
  await getPostgresPool().query(
    `
      UPDATE refresh_tokens
      SET revoked_at = now()
      WHERE device_id = $1 AND revoked_at IS NULL
    `,
    [deviceId],
  );
}

export async function revokeAccessJti(
  jti: string,
  deviceId: string,
  expiresAtEpochMs: number,
): Promise<void> {
  await ensureAuthSchema();
  await getPostgresPool().query(
    `
      INSERT INTO revoked_access_jtis (jti, device_id, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (jti) DO NOTHING
    `,
    [jti, deviceId, new Date(expiresAtEpochMs)],
  );
}

export async function isAccessJtiRevoked(jti: string): Promise<boolean> {
  await ensureAuthSchema();
  await getPostgresPool().query(
    "DELETE FROM revoked_access_jtis WHERE expires_at <= now()",
  );
  const result = await getPostgresPool().query(
    "SELECT 1 FROM revoked_access_jtis WHERE jti = $1",
    [jti],
  );
  return (result.rowCount ?? 0) > 0;
}
