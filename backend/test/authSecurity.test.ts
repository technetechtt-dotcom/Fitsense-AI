import "./env.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp } from "../src/app.js";
import { config } from "../src/config.js";
import { isPostgresConfigured } from "../src/services/postgres.js";
import { sha256Hex } from "../src/services/sessionAuth.js";

function requireDb(): void {
  assert.equal(config.skipAuth, false, "SKIP_AUTH must be false");
  assert.ok(config.authSecret, "AUTH_SECRET required");
  assert.ok(isPostgresConfigured(), "DATABASE_URL required — do not skip");
}

async function listen(): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const addr = server.address();
  assert.ok(addr && typeof addr === "object");
  return {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

async function registerDevice(baseUrl: string): Promise<{
  deviceId: string;
  accessToken: string;
  refreshToken: string;
}> {
  const reg = await fetch(`${baseUrl}/v1/auth/devices/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(reg.status, 201);
  const device = (await reg.json()) as { deviceId: string; deviceSecret: string };

  const challengeRes = await fetch(`${baseUrl}/v1/auth/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: device.deviceId }),
  });
  assert.equal(challengeRes.status, 200);
  const challenge = (await challengeRes.json()) as {
    challengeId: string;
    nonce: string;
  };
  const proof = sha256Hex(`${sha256Hex(device.deviceSecret)}:${challenge.nonce}`);
  const tokenRes = await fetch(`${baseUrl}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId: device.deviceId,
      challengeId: challenge.challengeId,
      nonce: challenge.nonce,
      proof,
    }),
  });
  assert.equal(tokenRes.status, 200);
  const tokens = (await tokenRes.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  return { deviceId: device.deviceId, ...tokens };
}

test("refresh token rotation and replay revokes token family", async () => {
  requireDb();
  const { baseUrl, close } = await listen();
  try {
    const first = await registerDevice(baseUrl);
    const rotate = await fetch(`${baseUrl}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: first.refreshToken }),
    });
    assert.equal(rotate.status, 200);
    const next = (await rotate.json()) as { refreshToken: string };

    const replay = await fetch(`${baseUrl}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: first.refreshToken }),
    });
    assert.equal(replay.status, 401);

    const afterReplay = await fetch(`${baseUrl}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: next.refreshToken }),
    });
    assert.equal(
      afterReplay.status,
      401,
      "rotated refresh should be revoked after parent replay",
    );
  } finally {
    await close();
  }
});

test("device logout revokes access token", async () => {
  requireDb();
  const { baseUrl, close } = await listen();
  try {
    const session = await registerDevice(baseUrl);
    const logout = await fetch(`${baseUrl}/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: session.refreshToken,
        accessToken: session.accessToken,
      }),
    });
    assert.equal(logout.status, 204);

    const sync = await fetch(`${baseUrl}/v1/sync`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    assert.equal(sync.status, 401);
  } finally {
    await close();
  }
});

test("concurrent refresh attempts yield a single winner", async () => {
  requireDb();
  const { baseUrl, close } = await listen();
  try {
    const session = await registerDevice(baseUrl);
    const attempts = await Promise.all(
      Array.from({ length: 8 }, () =>
        fetch(`${baseUrl}/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        }).then(async (res) => ({
          status: res.status,
          body: await res.json().catch(() => null),
        })),
      ),
    );
    const wins = attempts.filter((a) => a.status === 200);
    const losses = attempts.filter((a) => a.status === 401);
    assert.equal(wins.length, 1);
    assert.equal(losses.length, 7);
  } finally {
    await close();
  }
});

test("oversized JSON body is rejected", async () => {
  requireDb();
  const { baseUrl, close } = await listen();
  try {
    const huge = "x".repeat(2_000_000);
    const res = await fetch(`${baseUrl}/v1/auth/devices/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pad: huge }),
    });
    assert.ok(res.status === 413 || res.status === 400);
  } finally {
    await close();
  }
});
