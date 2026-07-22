import "./env.js";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { createApp } from "../src/app.js";
import { config } from "../src/config.js";
import { isPostgresConfigured } from "../src/services/postgres.js";
import { sha256Hex } from "../src/services/sessionAuth.js";

function requireSyncDb(): void {
  assert.equal(config.skipAuth, false, "SKIP_AUTH must be false for sync tests");
  assert.ok(config.authSecret, "AUTH_SECRET is required");
  assert.ok(
    isPostgresConfigured(),
    "DATABASE_URL (Postgres) is required for sync CRUD tests — do not skip",
  );
}

async function registerAndToken(baseUrl: string): Promise<{
  accessToken: string;
  deviceId: string;
}> {
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
  assert.equal(challenge.status, 200);
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
  assert.equal(token.status, 200);
  const body = (await token.json()) as { accessToken: string };
  assert.ok(body.accessToken);
  return { accessToken: body.accessToken, deviceId: device.deviceId };
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

let server: Server;
let baseUrl: string;

before(async () => {
  requireSyncDb();
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

test("sync CRUD: profile, scan, event, pull, delete scan, erase", async () => {
  requireSyncDb();
  const { accessToken, deviceId } = await registerAndToken(baseUrl);
  const now = Date.now();
  const fitId = `fit_${deviceId.slice(0, 16)}`;
  const scanId = `scan_${now}`;
  const eventId = `evt_${now}`;

  const profile = {
    fitId,
    userId: deviceId,
    version: 1,
    createdAtEpochMs: now,
    updatedAtEpochMs: now,
    widthClass: "regular",
    archHeight: "medium",
    toeShape: "egyptian",
    comfortFit: "standard",
    preferredMidsoleFeel: "balanced",
    favouriteBrands: ["FitSense"],
  };

  const putProfile = await fetch(`${baseUrl}/v1/sync/fit-profile`, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify(profile),
  });
  assert.equal(putProfile.status, 204);

  const scan = {
    scanId,
    userId: deviceId,
    createdAtEpochMs: now,
    arcoreUsed: false,
    leftFoot: {
      lengthMm: 264,
      widthMm: 99,
      confidence: 0.91,
      foot: "left",
      calibration: "a4_paper",
      pixelsPerMm: 2.5,
    },
  };

  const putScan = await fetch(`${baseUrl}/v1/sync/scans/${scanId}`, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify(scan),
  });
  assert.equal(putScan.status, 204);

  const event = {
    eventId,
    fitId,
    epochMs: now,
    kind: "scan",
  };

  const putEvent = await fetch(`${baseUrl}/v1/sync/fit-events/${eventId}`, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify(event),
  });
  assert.equal(putEvent.status, 204);

  const pull = await fetch(`${baseUrl}/v1/sync`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(pull.status, 200);
  const data = (await pull.json()) as {
    fitProfile: { fitId?: string } | null;
    scans: { scanId?: string }[];
    fitEvents: { eventId?: string }[];
  };
  assert.equal(data.fitProfile?.fitId, fitId);
  assert.ok(data.scans.some((s) => s.scanId === scanId));
  assert.ok(data.fitEvents.some((e) => e.eventId === eventId));

  const updatedScan = { ...scan, leftFoot: { ...scan.leftFoot, lengthMm: 265 } };
  const putScan2 = await fetch(`${baseUrl}/v1/sync/scans/${scanId}`, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify(updatedScan),
  });
  assert.equal(putScan2.status, 204);

  const pull2 = await fetch(`${baseUrl}/v1/sync`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data2 = (await pull2.json()) as {
    scans: { scanId?: string; leftFoot?: { lengthMm?: number } }[];
  };
  const stored = data2.scans.find((s) => s.scanId === scanId);
  assert.equal(stored?.leftFoot?.lengthMm, 265);

  const delScan = await fetch(`${baseUrl}/v1/sync/scans/${scanId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(delScan.status, 204);

  const pull3 = await fetch(`${baseUrl}/v1/sync`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data3 = (await pull3.json()) as { scans: { scanId?: string }[] };
  assert.equal(
    data3.scans.some((s) => s.scanId === scanId),
    false,
  );

  const erase = await fetch(`${baseUrl}/v1/sync`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(erase.status, 204);

  const pull4 = await fetch(`${baseUrl}/v1/sync`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data4 = (await pull4.json()) as {
    fitProfile: unknown;
    scans: unknown[];
    fitEvents: unknown[];
  };
  assert.equal(data4.fitProfile, null);
  assert.deepEqual(data4.scans, []);
  assert.deepEqual(data4.fitEvents, []);
});

test("sync rejects unauthenticated CRUD", async () => {
  requireSyncDb();
  const res = await fetch(`${baseUrl}/v1/sync/fit-profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fitId: "x" }),
  });
  assert.equal(res.status, 401);
});
