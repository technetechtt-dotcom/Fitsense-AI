import { createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (!isPostgresConfigured()) {
    throw new Error("DATABASE_URL is required for Fit Identity recovery.");
  }
  schemaReady ??= getPostgresPool()
    .query(
      `
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
      `,
    )
    .then(() => undefined);
  await schemaReady;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function mintRecoveryCode(): string {
  return `FSIR1.${randomBytes(24).toString("base64url")}`;
}

export async function issueRecoveryCode(input: {
  deviceId: string;
  fitProfile: { fitId: string } & Record<string, unknown>;
}): Promise<{ recoveryCode: string; expiresAtEpochMs: number; fitId: string }> {
  await ensureSchema();
  const recoveryCode = mintRecoveryCode();
  const expiresAtEpochMs = Date.now() + config.fitRecoveryTtlMs;
  await getPostgresPool().query(
    `
      INSERT INTO fit_recovery_codes (code_hash, device_id, fit_id, profile_json, expires_at)
      VALUES ($1, $2, $3, $4::jsonb, $5)
    `,
    [
      sha256Hex(recoveryCode),
      input.deviceId,
      input.fitProfile.fitId,
      JSON.stringify(input.fitProfile),
      new Date(expiresAtEpochMs),
    ],
  );
  return {
    recoveryCode,
    expiresAtEpochMs,
    fitId: input.fitProfile.fitId,
  };
}

export async function recoverFitIdentity(recoveryCode: string): Promise<{
  fitId: string;
  fitProfile: unknown;
} | null> {
  await ensureSchema();
  await getPostgresPool().query(
    "DELETE FROM fit_recovery_codes WHERE expires_at <= now() OR consumed_at IS NOT NULL",
  );
  const result = await getPostgresPool().query<{
    fit_id: string;
    profile_json: unknown;
  }>(
    `
      UPDATE fit_recovery_codes
      SET consumed_at = now()
      WHERE code_hash = $1
        AND consumed_at IS NULL
        AND expires_at > now()
      RETURNING fit_id, profile_json
    `,
    [sha256Hex(recoveryCode.trim())],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { fitId: row.fit_id, fitProfile: row.profile_json };
}
