#!/usr/bin/env node
/**
 * Staging smoke: health + device auth + sync + secure handoff against a live API.
 *
 * Usage:
 *   STAGING_API_BASE_URL=https://fitsense-api-staging.onrender.com node scripts/staging-smoke.mjs
 *
 * Optional:
 *   STAGING_SMOKE_RECORD=./staging-smoke-record.json  — write machine-readable results
 */
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const base = (process.env.STAGING_API_BASE_URL ?? "").replace(/\/+$/, "");
const recordPath = process.env.STAGING_SMOKE_RECORD?.trim() || "";
const startedAt = new Date().toISOString();

if (!base) {
  console.error(
    "Set STAGING_API_BASE_URL to the deployed API origin (no trailing slash).",
  );
  process.exit(1);
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function json(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function writeRecord(record) {
  if (!recordPath) return;
  const absolute = resolve(recordPath);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`smoke record → ${absolute}`);
}

async function main() {
  const steps = [];
  const record = {
    baseUrl: base,
    startedAt,
    finishedAt: null,
    ok: false,
    steps,
    health: null,
    error: null,
  };

  try {
    console.log(`health → ${base}/health`);
    const health = await fetch(`${base}/health`);
    const healthBody = await json(health);
    record.health = healthBody;
    steps.push({ name: "health", ok: health.ok, status: health.status });
    if (!health.ok) {
      throw new Error(`health failed: ${health.status} ${JSON.stringify(healthBody)}`);
    }
    console.log("health ok", healthBody);

    const register = await fetch(`${base}/v1/auth/devices/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const device = await json(register);
    steps.push({
      name: "register",
      ok: register.status === 201,
      status: register.status,
    });
    if (register.status !== 201) {
      throw new Error(`register failed: ${register.status} ${JSON.stringify(device)}`);
    }

    const challengeRes = await fetch(`${base}/v1/auth/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId: device.deviceId }),
    });
    const challenge = await json(challengeRes);
    steps.push({
      name: "challenge",
      ok: challengeRes.ok,
      status: challengeRes.status,
    });
    if (!challengeRes.ok) {
      throw new Error(
        `challenge failed: ${challengeRes.status} ${JSON.stringify(challenge)}`,
      );
    }

    const proof = sha256Hex(`${sha256Hex(device.deviceSecret)}:${challenge.nonce}`);
    const tokenRes = await fetch(`${base}/v1/auth/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deviceId: device.deviceId,
        challengeId: challenge.challengeId,
        nonce: challenge.nonce,
        proof,
      }),
    });
    const tokens = await json(tokenRes);
    steps.push({ name: "token", ok: tokenRes.ok, status: tokenRes.status });
    if (!tokenRes.ok) {
      throw new Error(`token failed: ${tokenRes.status} ${JSON.stringify(tokens)}`);
    }

    const sync = await fetch(`${base}/v1/sync`, {
      headers: { authorization: `Bearer ${tokens.accessToken}` },
    });
    const syncBody = await json(sync);
    steps.push({ name: "sync", ok: sync.ok, status: sync.status });
    if (!sync.ok) {
      throw new Error(`sync failed: ${sync.status} ${JSON.stringify(syncBody)}`);
    }
    console.log("sync ok");

    // Full round-trip: PUT scan with both feet → GET pull preserves millimetres.
    const scanId = `smoke-scan-${randomBytes(4).toString("hex")}`;
    const now = Date.now();
    const scanPayload = {
      scanId,
      userId: device.deviceId,
      createdAtEpochMs: now,
      updatedAtEpochMs: now,
      revision: 1,
      arcoreUsed: false,
      leftFoot: {
        lengthMm: 255.5,
        widthMm: 96.2,
        confidence: 0.88,
        foot: "left",
        calibration: "a4_paper",
        pixelsPerMm: 3.1,
      },
      rightFoot: {
        lengthMm: 257.0,
        widthMm: 97.0,
        confidence: 0.9,
        foot: "right",
        calibration: "a4_paper",
        pixelsPerMm: 3.1,
      },
    };
    const putScan = await fetch(`${base}/v1/sync/scans/${scanId}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${tokens.accessToken}`,
        "content-type": "application/json",
        "idempotency-key": `smoke-${scanId}`,
      },
      body: JSON.stringify(scanPayload),
    });
    steps.push({
      name: "sync_put_scan",
      ok: putScan.status === 200 || putScan.status === 201 || putScan.status === 204,
      status: putScan.status,
    });
    if (!(putScan.status === 200 || putScan.status === 201 || putScan.status === 204)) {
      const putBody = await json(putScan);
      throw new Error(
        `sync put scan failed: ${putScan.status} ${JSON.stringify(putBody)}`,
      );
    }

    const pull = await fetch(`${base}/v1/sync`, {
      headers: { authorization: `Bearer ${tokens.accessToken}` },
    });
    const pullBody = await json(pull);
    steps.push({ name: "sync_pull_roundtrip", ok: pull.ok, status: pull.status });
    if (!pull.ok) {
      throw new Error(`sync pull failed: ${pull.status} ${JSON.stringify(pullBody)}`);
    }
    const pulledScans = Array.isArray(pullBody?.scans) ? pullBody.scans : [];
    const found = pulledScans.find((s) => s && s.scanId === scanId);
    if (!found?.leftFoot || !found?.rightFoot) {
      throw new Error(
        `round-trip missing feet: ${JSON.stringify(found ?? pulledScans.slice(0, 1))}`,
      );
    }
    if (Math.abs(found.leftFoot.lengthMm - 255.5) > 0.01) {
      throw new Error(`left length mismatch: ${found.leftFoot.lengthMm}`);
    }
    if (Math.abs(found.rightFoot.lengthMm - 257.0) > 0.01) {
      throw new Error(`right length mismatch: ${found.rightFoot.lengthMm}`);
    }
    console.log("sync round-trip ok", scanId);

    const sessionRes = await fetch(`${base}/v1/handoff/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const session = await json(sessionRes);
    steps.push({
      name: "handoff_session",
      ok: sessionRes.status === 201,
      status: sessionRes.status,
    });
    if (sessionRes.status !== 201) {
      throw new Error(
        `handoff session failed: ${sessionRes.status} ${JSON.stringify(session)}`,
      );
    }

    const payload = {
      v: 1,
      completedAtEpochMs: Date.now(),
      size: {
        uk: "9",
        us: "10",
        eu: "43",
        mondopointMm: 270,
        fitScore: 0.9,
        preferred: "uk",
        recommendationConfidence: 0.8,
      },
      scan: {
        scanId: `smoke-${randomBytes(4).toString("hex")}`,
        lengthMm: 264,
        widthMm: 99,
        widthToLengthRatio: 0.375,
        capturedAtEpochMs: Date.now(),
        measurementConfidence: 0.9,
      },
    };

    const put = await fetch(`${base}/v1/handoff/${session.sessionId}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.publishToken}`,
      },
      body: JSON.stringify({ payload }),
    });
    steps.push({ name: "handoff_publish", ok: put.status === 204, status: put.status });
    if (put.status !== 204) {
      throw new Error(`handoff publish failed: ${put.status} ${await put.text()}`);
    }

    const consume = await fetch(`${base}/v1/handoff/${session.sessionId}/consume`, {
      method: "POST",
      headers: { authorization: `Bearer ${session.consumeToken}` },
    });
    const consumed = await json(consume);
    const consumeOk = Boolean(consume.ok && consumed?.payload);
    steps.push({ name: "handoff_consume", ok: consumeOk, status: consume.status });
    if (!consumeOk) {
      throw new Error(
        `handoff consume failed: ${consume.status} ${JSON.stringify(consumed)}`,
      );
    }

    const unsigned = await fetch(`${base}/v1/handoff/${session.sessionId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload }),
    });
    // Session already consumed/deleted — expect 401/404/410, never open write.
    const unsignedOk = unsigned.status !== 204;
    steps.push({
      name: "handoff_unsigned_rejected",
      ok: unsignedOk,
      status: unsigned.status,
    });
    if (!unsignedOk) {
      throw new Error("unsigned handoff publish unexpectedly succeeded");
    }

    console.log("handoff ok");
    console.log("staging smoke passed");
    record.ok = true;
  } catch (err) {
    record.error = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    record.finishedAt = new Date().toISOString();
    writeRecord(record);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
