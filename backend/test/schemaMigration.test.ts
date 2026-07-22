import "./env.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import { ensureAuthSchema } from "../src/services/deviceAuthStore.js";
import { PostgresHandoffStore } from "../src/services/handoffStore.js";
import { getPostgresPool, isPostgresConfigured } from "../src/services/postgres.js";
import { initSyncStore } from "../src/services/syncStore.js";

function requireDb(): void {
  assert.ok(
    isPostgresConfigured(),
    "DATABASE_URL is required for schema migration tests — do not skip",
  );
}

async function columns(table: string): Promise<Set<string>> {
  const result = await getPostgresPool().query<{ column_name: string }>(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `,
    [table],
  );
  return new Set(result.rows.map((r) => r.column_name));
}

async function indexes(table: string): Promise<Set<string>> {
  const result = await getPostgresPool().query<{ indexname: string }>(
    `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = $1
    `,
    [table],
  );
  return new Set(result.rows.map((r) => r.indexname));
}

test("sync schema bootstrap is idempotent and creates expected columns", async () => {
  requireDb();
  await initSyncStore();
  await initSyncStore();

  const profiles = await columns("fit_profiles");
  for (const col of ["uid", "fit_id", "data", "updated_at"]) {
    assert.ok(profiles.has(col), `fit_profiles missing ${col}`);
  }

  const scans = await columns("scans");
  for (const col of ["uid", "scan_id", "data", "created_at_epoch_ms", "updated_at"]) {
    assert.ok(scans.has(col), `scans missing ${col}`);
  }

  const events = await columns("fit_events");
  for (const col of ["uid", "event_id", "fit_id", "data", "epoch_ms", "updated_at"]) {
    assert.ok(events.has(col), `fit_events missing ${col}`);
  }

  const scanIdx = await indexes("scans");
  assert.ok(scanIdx.has("idx_scans_uid_created_at_epoch_ms"));
  const eventIdx = await indexes("fit_events");
  assert.ok(eventIdx.has("idx_fit_events_uid_epoch_ms"));
});

test("auth schema bootstrap is idempotent and creates expected tables", async () => {
  requireDb();
  await ensureAuthSchema();
  await ensureAuthSchema();

  for (const table of [
    "devices",
    "auth_challenges",
    "refresh_tokens",
    "revoked_access_jtis",
    "security_events",
  ]) {
    const cols = await columns(table);
    assert.ok(cols.size > 0, `expected table ${table}`);
  }

  const devices = await columns("devices");
  for (const col of ["device_id", "secret_hash", "created_at", "revoked_at"]) {
    assert.ok(devices.has(col), `devices missing ${col}`);
  }
});

test("handoff schema migrates legacy table missing token columns", async () => {
  requireDb();
  const pool = getPostgresPool();
  const legacy = `handoff_sessions_legacy_${Date.now()}`;

  // Simulate a pre-token handoff table, then apply the same ALTER path used in production.
  await pool.query(`DROP TABLE IF EXISTS ${legacy}`);
  await pool.query(`
    CREATE TABLE ${legacy} (
      session_id text PRIMARY KEY,
      payload jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL
    )
  `);

  await pool.query(`
    ALTER TABLE ${legacy}
      ADD COLUMN IF NOT EXISTS publish_token_hash text,
      ADD COLUMN IF NOT EXISTS consume_token_hash text,
      ADD COLUMN IF NOT EXISTS consumed_at timestamptz,
      ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
    ALTER TABLE ${legacy} ALTER COLUMN payload DROP NOT NULL;
  `);

  const cols = await columns(legacy);
  for (const col of [
    "session_id",
    "payload",
    "publish_token_hash",
    "consume_token_hash",
    "consumed_at",
    "cancelled_at",
    "expires_at",
  ]) {
    assert.ok(cols.has(col), `${legacy} missing ${col}`);
  }

  await pool.query(`DROP TABLE IF EXISTS ${legacy}`);

  // Production ensureSchema path on the real table (idempotent).
  const store = new PostgresHandoffStore();
  await store.createSession({
    sessionId: `MIGTEST${Date.now()}XXXXXXXX`.slice(0, 24),
    publishTokenHash: "a".repeat(64),
    consumeTokenHash: "b".repeat(64),
    expiresAt: new Date(Date.now() + 60_000),
  });
  const handoffCols = await columns("handoff_sessions");
  for (const col of [
    "session_id",
    "publish_token_hash",
    "consume_token_hash",
    "payload",
    "consumed_at",
    "cancelled_at",
    "expires_at",
  ]) {
    assert.ok(handoffCols.has(col), `handoff_sessions missing ${col}`);
  }
});
