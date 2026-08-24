#!/usr/bin/env node
/**
 * Merchant + sync hardening smoke against a live API.
 * Usage:
 *   STAGING_API_BASE_URL=https://… node scripts/merchant-smoke.mjs
 */
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const base = (process.env.STAGING_API_BASE_URL ?? "").replace(/\/+$/, "");
const recordPath =
  process.env.MERCHANT_SMOKE_RECORD?.trim() ||
  resolve("../docs/records/merchant-smoke-latest.json");

if (!base) {
  console.error("Set STAGING_API_BASE_URL");
  process.exit(1);
}

if (/fitsense-api-1rne\.onrender\.com/i.test(base)) {
  console.error(
    "STAGING_API_BASE_URL points at production (fitsense-api-1rne). Set it to the staging service.",
  );
  process.exit(2);
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

async function registerDevice() {
  const register = await fetch(`${base}/v1/auth/devices/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  const device = await json(register);
  if (register.status !== 201) throw new Error(`register ${register.status}`);
  const challenge = await fetch(`${base}/v1/auth/challenge`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId: device.deviceId }),
  });
  const ch = await json(challenge);
  const proof = sha256Hex(`${sha256Hex(device.deviceSecret)}:${ch.nonce}`);
  const tokenRes = await fetch(`${base}/v1/auth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      deviceId: device.deviceId,
      challengeId: ch.challengeId,
      nonce: ch.nonce,
      proof,
    }),
  });
  const tokens = await json(tokenRes);
  if (tokenRes.status !== 200) throw new Error(`token ${tokenRes.status}`);
  return { accessToken: tokens.accessToken, deviceId: device.deviceId };
}

async function main() {
  const startedAt = new Date().toISOString();
  const steps = [];
  const record = { baseUrl: base, startedAt, ok: false, steps };

  try {
    const health = await fetch(`${base}/health`);
    steps.push({ name: "health", ok: health.ok, status: health.status });
    if (!health.ok) throw new Error("health failed");

    const { accessToken } = await registerDevice();
    steps.push({ name: "auth", ok: true });

    const orgRes = await fetch(`${base}/v1/merchants/orgs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: `Smoke ${randomBytes(3).toString("hex")}`,
        region: "ZA-NC",
      }),
    });
    const org = await json(orgRes);
    steps.push({
      name: "create_org",
      ok: orgRes.status === 201,
      status: orgRes.status,
      body: org,
    });
    if (orgRes.status !== 201) {
      throw new Error(`create org failed: ${orgRes.status} ${JSON.stringify(org)}`);
    }

    const mint = await fetch(`${base}/v1/merchants/orgs/${org.orgId}/catalogue-token`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const catTok = await json(mint);
    steps.push({
      name: "catalogue_token_mint",
      ok: mint.status === 201,
      status: mint.status,
    });
    if (mint.status !== 201) throw new Error("catalogue-token mint failed");

    const catGet = await fetch(`${base}/v1/merchants/orgs/${org.orgId}/catalogue`, {
      headers: { authorization: `Bearer ${catTok.token}` },
    });
    steps.push({
      name: "catalogue_token_read",
      ok: catGet.status === 200,
      status: catGet.status,
    });

    const ingestDenied = await fetch(
      `${base}/v1/merchants/orgs/${org.orgId}/catalogue/ingest`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${catTok.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          products: [
            {
              productId: "nope",
              brand: "X",
              model: "Y",
              category: "school",
              fitType: "standard",
              sizeRangeEu: { min: 30, max: 40, step: 1 },
            },
          ],
        }),
      },
    );
    steps.push({
      name: "catalogue_token_ingest_denied",
      ok: ingestDenied.status === 403,
      status: ingestDenied.status,
    });
    if (ingestDenied.status !== 403) throw new Error("token should be read-only");

    const scanId = `smoke-tomb-${randomBytes(4).toString("hex")}`;
    const putScan = await fetch(`${base}/v1/sync/scans/${scanId}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scanId,
        userId: "smoke",
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
      }),
    });
    steps.push({
      name: "sync_put_scan",
      ok: putScan.status === 204,
      status: putScan.status,
    });

    const delScan = await fetch(`${base}/v1/sync/scans/${scanId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    steps.push({
      name: "sync_delete_scan",
      ok: delScan.status === 204,
      status: delScan.status,
    });

    const pull = await fetch(`${base}/v1/sync`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const pullBody = await json(pull);
    const hasTombstone = Array.isArray(pullBody?.deletedScanIds)
      ? pullBody.deletedScanIds.includes(scanId)
      : false;
    steps.push({
      name: "sync_tombstone",
      ok: pull.status === 200 && hasTombstone,
      status: pull.status,
      deletedScanIds: pullBody?.deletedScanIds?.length ?? 0,
    });
    if (!hasTombstone) {
      throw new Error(
        "deletedScanIds missing — deploy migration 005+ and latest syncStore",
      );
    }

    record.ok = steps.every((s) => s.ok);
    record.finishedAt = new Date().toISOString();
    mkdirSync(dirname(recordPath), { recursive: true });
    writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
    console.log(record.ok ? "merchant smoke passed" : "merchant smoke failed");
    console.log(`record → ${recordPath}`);
    process.exit(record.ok ? 0 : 1);
  } catch (err) {
    record.error = err instanceof Error ? err.message : String(err);
    record.finishedAt = new Date().toISOString();
    mkdirSync(dirname(recordPath), { recursive: true });
    writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
    console.error(record.error);
    process.exit(1);
  }
}

main();
