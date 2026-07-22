import { config } from "../config.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

export interface CloudPullResult {
  fitProfile: unknown | null;
  fitEvents: unknown[];
  scans: unknown[];
}

export interface SyncStore {
  readonly name: "postgres";
  init(): Promise<void>;
  isReady(): boolean;
  pullUserData(uid: string): Promise<CloudPullResult>;
  upsertFitProfile(uid: string, profile: unknown): Promise<void>;
  upsertScan(uid: string, scanId: string, scan: unknown): Promise<void>;
  deleteScan(uid: string, scanId: string): Promise<void>;
  upsertFitEvent(uid: string, eventId: string, event: unknown): Promise<void>;
  eraseUserData(uid: string): Promise<void>;
}

class PostgresSyncStore implements SyncStore {
  readonly name = "postgres" as const;
  private ready = false;

  async init(): Promise<void> {
    if (!isPostgresConfigured()) {
      console.warn("[fitsense-api] Postgres sync disabled — DATABASE_URL is not set.");
      return;
    }
    await getPostgresPool().query(`
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
    `);
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  async pullUserData(uid: string): Promise<CloudPullResult> {
    const pool = getPostgresPool();
    const [profile, events, scans] = await Promise.all([
      pool.query<{ data: unknown }>("SELECT data FROM fit_profiles WHERE uid = $1", [
        uid,
      ]),
      pool.query<{ data: unknown }>(
        `
          SELECT data
          FROM fit_events
          WHERE uid = $1
          ORDER BY epoch_ms DESC NULLS LAST, updated_at DESC
        `,
        [uid],
      ),
      pool.query<{ data: unknown }>(
        `
          SELECT data
          FROM scans
          WHERE uid = $1
          ORDER BY created_at_epoch_ms DESC NULLS LAST, updated_at DESC
        `,
        [uid],
      ),
    ]);

    return {
      fitProfile: profile.rows[0]?.data ?? null,
      fitEvents: events.rows.map((row) => row.data),
      scans: scans.rows.map((row) => row.data),
    };
  }

  async upsertFitProfile(uid: string, profile: unknown): Promise<void> {
    const body = profile as { fitId?: string };
    await getPostgresPool().query(
      `
        INSERT INTO fit_profiles (uid, fit_id, data, updated_at)
        VALUES ($1, $2, $3::jsonb, now())
        ON CONFLICT (uid) DO UPDATE SET
          fit_id = EXCLUDED.fit_id,
          data = EXCLUDED.data,
          updated_at = now()
      `,
      [uid, body.fitId ?? "", JSON.stringify(profile)],
    );
  }

  async upsertScan(uid: string, scanId: string, scan: unknown): Promise<void> {
    const body = scan as { createdAtEpochMs?: number };
    await getPostgresPool().query(
      `
        INSERT INTO scans (uid, scan_id, data, created_at_epoch_ms, updated_at)
        VALUES ($1, $2, $3::jsonb, $4, now())
        ON CONFLICT (uid, scan_id) DO UPDATE SET
          data = EXCLUDED.data,
          created_at_epoch_ms = EXCLUDED.created_at_epoch_ms,
          updated_at = now()
      `,
      [uid, scanId, JSON.stringify(scan), body.createdAtEpochMs ?? null],
    );
  }

  async deleteScan(uid: string, scanId: string): Promise<void> {
    await getPostgresPool().query("DELETE FROM scans WHERE uid = $1 AND scan_id = $2", [
      uid,
      scanId,
    ]);
  }

  async upsertFitEvent(uid: string, eventId: string, event: unknown): Promise<void> {
    const body = event as { fitId?: string; epochMs?: number };
    await getPostgresPool().query(
      `
        INSERT INTO fit_events (uid, event_id, fit_id, data, epoch_ms, updated_at)
        VALUES ($1, $2, $3, $4::jsonb, $5, now())
        ON CONFLICT (uid, event_id) DO UPDATE SET
          fit_id = EXCLUDED.fit_id,
          data = EXCLUDED.data,
          epoch_ms = EXCLUDED.epoch_ms,
          updated_at = now()
      `,
      [uid, eventId, body.fitId ?? null, JSON.stringify(event), body.epochMs ?? null],
    );
  }

  async eraseUserData(uid: string): Promise<void> {
    const pool = getPostgresPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM fit_events WHERE uid = $1", [uid]);
      await client.query("DELETE FROM scans WHERE uid = $1", [uid]);
      await client.query("DELETE FROM fit_profiles WHERE uid = $1", [uid]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

const store: SyncStore = new PostgresSyncStore();

export function getSyncStore(): SyncStore {
  return store;
}

export async function initSyncStore(): Promise<void> {
  if (config.syncStore !== "postgres") {
    throw new Error(`Unsupported SYNC_STORE: ${config.syncStore}`);
  }
  await store.init();
}
