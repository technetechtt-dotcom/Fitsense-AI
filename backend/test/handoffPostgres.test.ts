import "./env.js";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { createApp } from "../src/app.js";
import { config } from "../src/config.js";
import {
  PostgresHandoffStore,
  generateHandoffSessionId,
  mintHandoffSessionTokens,
} from "../src/services/handoffStore.js";
import { isPostgresConfigured } from "../src/services/postgres.js";
import type { HandoffPayload } from "../src/types.js";

function requirePostgresHandoff(): void {
  assert.ok(
    isPostgresConfigured(),
    "DATABASE_URL is required for Postgres handoff tests — do not skip",
  );
  assert.equal(
    config.handoffStore,
    "postgres",
    "HANDOFF_STORE must be postgres for these tests (set in CI)",
  );
}

const payload: HandoffPayload = {
  v: 1,
  completedAtEpochMs: 1_735_000_000_000,
  size: {
    uk: "9",
    us: "10",
    eu: "43",
    mondopointMm: 270,
    fitScore: 0.92,
    preferred: "uk",
  },
  scan: {
    scanId: "scan-pg-123",
    lengthMm: 264.3,
    widthMm: 99.1,
    widthToLengthRatio: 0.375,
    capturedAtEpochMs: 1_735_000_000_000,
  },
};

test("postgres handoff store expires and rejects duplicate publishes", async () => {
  requirePostgresHandoff();
  const store = new PostgresHandoffStore();
  const sessionId = generateHandoffSessionId();
  const tokens = mintHandoffSessionTokens(sessionId);
  // Use a long TTL — Neon round-trips can exceed tens of ms.
  await store.createSession({
    sessionId,
    publishTokenHash: tokens.publishTokenHash,
    consumeTokenHash: tokens.consumeTokenHash,
    expiresAt: new Date(Date.now() + 120_000),
  });
  assert.equal(
    await store.publish(sessionId, tokens.publishTokenHash, payload),
    "stored",
  );
  assert.equal(
    await store.publish(sessionId, tokens.publishTokenHash, payload),
    "exists",
  );
  assert.deepEqual(await store.consume(sessionId, tokens.consumeTokenHash), payload);

  // Already-expired rows are pruned before publish — surface as missing.
  const expiredId = generateHandoffSessionId();
  const expiredTokens = mintHandoffSessionTokens(expiredId);
  await store.createSession({
    sessionId: expiredId,
    publishTokenHash: expiredTokens.publishTokenHash,
    consumeTokenHash: expiredTokens.consumeTokenHash,
    expiresAt: new Date(Date.now() - 1_000),
  });
  assert.equal(
    await store.publish(expiredId, expiredTokens.publishTokenHash, payload),
    "missing",
  );
});

let server: Server;
let baseUrl: string;

before(async () => {
  requirePostgresHandoff();
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

test("HTTP handoff publish/consume against Postgres store", async () => {
  requirePostgresHandoff();
  const sessionRes = await fetch(`${baseUrl}/v1/handoff/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(sessionRes.status, 201);
  const session = (await sessionRes.json()) as {
    sessionId: string;
    publishToken: string;
    consumeToken: string;
  };

  const put = await fetch(`${baseUrl}/v1/handoff/${session.sessionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.publishToken}`,
    },
    body: JSON.stringify({ payload }),
  });
  assert.equal(put.status, 204);

  const consume = await fetch(`${baseUrl}/v1/handoff/${session.sessionId}/consume`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.consumeToken}` },
  });
  assert.equal(consume.status, 200);
  assert.deepEqual(await consume.json(), { payload });
});
