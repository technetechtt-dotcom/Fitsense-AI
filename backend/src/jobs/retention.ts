import { getPostgresPool, isPostgresConfigured } from "../services/postgres.js";
import { config } from "../config.js";

/**
 * POPIA-aligned retention: delete sync + handoff rows older than configured days.
 * Run via `npm run retention:run` or a scheduled job.
 */
export async function runRetentionSweep(now = new Date()): Promise<{
  scansDeleted: number;
  eventsDeleted: number;
  profilesDeleted: number;
  handoffDeleted: number;
  recoveryDeleted: number;
}> {
  if (!isPostgresConfigured()) {
    throw new Error("DATABASE_URL required for retention sweep");
  }
  const pool = getPostgresPool();
  const scanCutoff = new Date(
    now.getTime() - config.retention.scanDays * 24 * 60 * 60 * 1000,
  );
  const eventCutoff = new Date(
    now.getTime() - config.retention.eventDays * 24 * 60 * 60 * 1000,
  );
  const profileCutoff = new Date(
    now.getTime() - config.retention.profileDays * 24 * 60 * 60 * 1000,
  );

  const scans = await pool.query("DELETE FROM scans WHERE updated_at < $1", [
    scanCutoff,
  ]);
  const events = await pool.query("DELETE FROM fit_events WHERE updated_at < $1", [
    eventCutoff,
  ]);
  const profiles = await pool.query("DELETE FROM fit_profiles WHERE updated_at < $1", [
    profileCutoff,
  ]);
  const handoff = await pool.query(
    "DELETE FROM handoff_sessions WHERE expires_at < now() OR created_at < $1",
    [new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)],
  );
  const recovery = await pool.query(
    "DELETE FROM fit_recovery_codes WHERE expires_at < now() OR consumed_at IS NOT NULL",
  );

  return {
    scansDeleted: scans.rowCount ?? 0,
    eventsDeleted: events.rowCount ?? 0,
    profilesDeleted: profiles.rowCount ?? 0,
    handoffDeleted: handoff.rowCount ?? 0,
    recoveryDeleted: recovery.rowCount ?? 0,
  };
}
