import "./env.js";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { createApp } from "../src/app.js";
import { config } from "../src/config.js";
import { isPostgresConfigured } from "../src/services/postgres.js";
import { sha256Hex } from "../src/services/sessionAuth.js";

function requireAuthDb(): void {
  assert.equal(config.skipAuth, false, "SKIP_AUTH must be false for security tests");
  assert.ok(config.authSecret, "AUTH_SECRET is required for security tests");
  assert.ok(
    isPostgresConfigured(),
    "DATABASE_URL (Postgres) is required for device auth security tests — do not skip",
  );
}

let server: Server;
let baseUrl: string;

before(async () => {
  requireAuthDb();
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

test("legacy POST /auth/session is gone", async () => {
  const res = await fetch(`${baseUrl}/v1/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: "attacker-chosen-id" }),
  });
  assert.equal(res.status, 410);
});

test("register → challenge → token; forged deviceId rejected", async () => {
  requireAuthDb();

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
  const body = (await token.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  assert.ok(body.accessToken);
  assert.ok(body.refreshToken);

  const forged = await fetch(`${baseUrl}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId: "dev_forged_not_registered________",
      challengeId: ch.challengeId,
      nonce: ch.nonce,
      proof,
    }),
  });
  assert.equal(forged.status, 401);

  const refresh = await fetch(`${baseUrl}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: body.refreshToken }),
  });
  assert.equal(refresh.status, 200);
  const rotated = (await refresh.json()) as {
    refreshToken: string;
    accessToken: string;
  };
  assert.ok(rotated.refreshToken);
  assert.notEqual(rotated.refreshToken, body.refreshToken);

  const reuse = await fetch(`${baseUrl}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: body.refreshToken }),
  });
  assert.equal(reuse.status, 401);

  const sync = await fetch(`${baseUrl}/v1/sync`, {
    headers: { Authorization: `Bearer ${rotated.accessToken}` },
  });
  assert.equal(sync.status, 200);
});
