import "./env.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import { getPostgresPool, isPostgresConfigured } from "../src/services/postgres.js";
import { initSyncStore, getSyncStore } from "../src/services/syncStore.js";

/**
 * Logical backup/restore drill without pg_dump:
 * seed rows → snapshot via pull → erase → re-insert snapshot → verify.
 * Documents the app-level restore path used after a Neon branch restore.
 */
test("database backup restore drill: snapshot erase reinstate", async () => {
  assert.ok(
    isPostgresConfigured(),
    "DATABASE_URL required for backup/restore drill — do not skip",
  );
  await initSyncStore();
  const store = getSyncStore();
  const uid = `backup_drill_${Date.now()}`;
  const profile = {
    fitId: `fit_${uid}`,
    userId: uid,
    version: 1,
    createdAtEpochMs: Date.now(),
    updatedAtEpochMs: Date.now(),
    widthClass: "regular",
    archHeight: "medium",
    toeShape: "roman",
    comfortFit: "standard",
    preferredMidsoleFeel: "balanced",
    favouriteBrands: ["FitSense"],
  };
  const scanId = `scan_${uid}`;
  const scan = {
    scanId,
    userId: uid,
    createdAtEpochMs: Date.now(),
    arcoreUsed: false,
    leftFoot: {
      lengthMm: 260,
      widthMm: 98,
      confidence: 0.9,
      foot: "left",
      calibration: "a4_paper",
      pixelsPerMm: 2.4,
    },
  };

  await store.upsertFitProfile(uid, profile);
  await store.upsertScan(uid, scanId, scan);
  const snapshot = await store.pullUserData(uid);
  assert.equal(
    (snapshot.fitProfile as { fitId?: string } | null)?.fitId,
    profile.fitId,
  );
  assert.equal(snapshot.scans.length, 1);

  await store.eraseUserData(uid);
  const empty = await store.pullUserData(uid);
  assert.equal(empty.fitProfile, null);
  assert.deepEqual(empty.scans, []);

  // Reinstate from snapshot (simulates restore from backup export).
  await store.upsertFitProfile(uid, snapshot.fitProfile);
  const restoredScan = snapshot.scans[0] as { scanId: string };
  await store.upsertScan(uid, restoredScan.scanId, snapshot.scans[0]);
  const restored = await store.pullUserData(uid);
  assert.equal(
    (restored.fitProfile as { fitId?: string } | null)?.fitId,
    profile.fitId,
  );
  assert.equal(restored.scans.length, 1);

  // Cleanup
  await store.eraseUserData(uid);
  const pool = getPostgresPool();
  assert.ok(pool);
});
