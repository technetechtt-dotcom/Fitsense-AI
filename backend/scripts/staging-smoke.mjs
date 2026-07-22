#!/usr/bin/env node
/**
 * Staging smoke: health + device auth + sync + secure handoff against a live API.
 *
 * Usage:
 *   STAGING_API_BASE_URL=https://fitsense-api.onrender.com node scripts/staging-smoke.mjs
 */
import { createHash, randomBytes } from "node:crypto";

const base = (process.env.STAGING_API_BASE_URL ?? "").replace(/\/+$/, "");
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

async function main() {
  console.log(`health → ${base}/health`);
  const health = await fetch(`${base}/health`);
  const healthBody = await json(health);
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
  if (register.status !== 201) {
    throw new Error(`register failed: ${register.status} ${JSON.stringify(device)}`);
  }

  const challengeRes = await fetch(`${base}/v1/auth/challenge`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId: device.deviceId }),
  });
  const challenge = await json(challengeRes);
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
  if (!tokenRes.ok) {
    throw new Error(`token failed: ${tokenRes.status} ${JSON.stringify(tokens)}`);
  }

  const sync = await fetch(`${base}/v1/sync`, {
    headers: { authorization: `Bearer ${tokens.accessToken}` },
  });
  const syncBody = await json(sync);
  if (!sync.ok) {
    throw new Error(`sync failed: ${sync.status} ${JSON.stringify(syncBody)}`);
  }
  console.log("sync ok");

  const sessionRes = await fetch(`${base}/v1/handoff/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  const session = await json(sessionRes);
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
  if (put.status !== 204) {
    throw new Error(`handoff publish failed: ${put.status} ${await put.text()}`);
  }

  const consume = await fetch(`${base}/v1/handoff/${session.sessionId}/consume`, {
    method: "POST",
    headers: { authorization: `Bearer ${session.consumeToken}` },
  });
  const consumed = await json(consume);
  if (!consume.ok || !consumed?.payload) {
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
  if (unsigned.status === 204) {
    throw new Error("unsigned handoff publish unexpectedly succeeded");
  }

  console.log("handoff ok");
  console.log("staging smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
