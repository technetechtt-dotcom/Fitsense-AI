import "./env.js";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { createApp } from "../src/app.js";
import { isPostgresConfigured } from "../src/services/postgres.js";
import { sha256Hex } from "../src/services/sessionAuth.js";

function requireDb(): void {
  assert.ok(isPostgresConfigured(), "DATABASE_URL required — do not skip");
}

async function authToken(baseUrl: string): Promise<string> {
  const register = await fetch(`${baseUrl}/v1/auth/devices/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(register.status, 201);
  const device = (await register.json()) as {
    deviceId: string;
    deviceSecret: string;
  };
  const challenge = await fetch(`${baseUrl}/v1/auth/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: device.deviceId }),
  });
  const ch = (await challenge.json()) as { challengeId: string; nonce: string };
  const proof = sha256Hex(`${sha256Hex(device.deviceSecret)}:${ch.nonce}`);
  const token = await fetch(`${baseUrl}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId: device.deviceId,
      challengeId: ch.challengeId,
      nonce: ch.nonce,
      proof,
    }),
  });
  const body = (await token.json()) as { accessToken: string };
  return body.accessToken;
}

let server: Server;
let baseUrl: string;

before(async () => {
  requireDb();
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("Fit Identity recovery code issues and redeems once", async () => {
  requireDb();
  const accessToken = await authToken(baseUrl);
  const now = Date.now();
  const fitProfile = {
    fitId: `fit_rec_${now}`,
    userId: `user_${now}`,
    version: 1,
    createdAtEpochMs: now,
    updatedAtEpochMs: now,
    widthClass: "regular",
    archHeight: "medium",
    toeShape: "egyptian",
    comfortFit: "standard",
    preferredMidsoleFeel: "balanced",
    favouriteBrands: [],
  };

  const issue = await fetch(`${baseUrl}/v1/fit-identity/recovery-codes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fitProfile }),
  });
  assert.equal(issue.status, 201);
  const issued = (await issue.json()) as { recoveryCode: string; fitId: string };
  assert.ok(issued.recoveryCode.startsWith("FSIR1."));

  const recover = await fetch(`${baseUrl}/v1/fit-identity/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recoveryCode: issued.recoveryCode }),
  });
  assert.equal(recover.status, 200);
  const recovered = (await recover.json()) as {
    fitId: string;
    fitProfile: { fitId: string };
  };
  assert.equal(recovered.fitId, fitProfile.fitId);
  assert.equal(recovered.fitProfile.fitId, fitProfile.fitId);

  const second = await fetch(`${baseUrl}/v1/fit-identity/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recoveryCode: issued.recoveryCode }),
  });
  assert.equal(second.status, 404);
});

test("sync export returns authenticated user payload", async () => {
  requireDb();
  const accessToken = await authToken(baseUrl);
  const res = await fetch(`${baseUrl}/v1/sync/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    exportedAtEpochMs: number;
    fitProfile: unknown;
    scans: unknown[];
  };
  assert.ok(body.exportedAtEpochMs > 0);
  assert.ok(Array.isArray(body.scans));
});
