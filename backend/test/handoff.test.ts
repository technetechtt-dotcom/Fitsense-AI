import "./env.js";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { createApp } from "../src/app.js";
import {
  MemoryHandoffStore,
  generateHandoffSessionId,
  mintHandoffSessionTokens,
  verifyHandoffOpToken,
} from "../src/services/handoffStore.js";
import { sha256Hex } from "../src/services/sessionAuth.js";
import type { HandoffPayload } from "../src/types.js";

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
    scanId: "scan-123",
    lengthMm: 264.3,
    widthMm: 99.1,
    widthToLengthRatio: 0.375,
    capturedAtEpochMs: 1_735_000_000_000,
  },
};

test("memory handoff store expires and rejects duplicate publishes", async () => {
  const store = new MemoryHandoffStore(15);
  const sessionId = generateHandoffSessionId();
  const tokens = mintHandoffSessionTokens(sessionId);
  await store.createSession({
    sessionId,
    publishTokenHash: tokens.publishTokenHash,
    consumeTokenHash: tokens.consumeTokenHash,
    expiresAt: new Date(Date.now() + 15),
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
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(await store.consume(sessionId, tokens.consumeTokenHash), "missing");
});

test("handoff op tokens bind session and operation", () => {
  const sessionId = generateHandoffSessionId();
  const tokens = mintHandoffSessionTokens(sessionId);
  assert.equal(verifyHandoffOpToken(tokens.publishToken, sessionId, "publish"), true);
  assert.equal(verifyHandoffOpToken(tokens.publishToken, sessionId, "consume"), false);
  assert.equal(verifyHandoffOpToken(tokens.consumeToken, sessionId, "consume"), true);
  assert.equal(
    verifyHandoffOpToken(tokens.consumeToken, "OTHERSESSIONID123456", "consume"),
    false,
  );
});

let server: Server;
let baseUrl: string;

before(async () => {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

async function createSession(): Promise<{
  sessionId: string;
  publishToken: string;
  consumeToken: string;
}> {
  const res = await fetch(`${baseUrl}/v1/handoff/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(res.status, 201);
  return (await res.json()) as {
    sessionId: string;
    publishToken: string;
    consumeToken: string;
  };
}

test("unsigned PUT is rejected", async () => {
  const { sessionId } = await createSession();
  const put = await fetch(`${baseUrl}/v1/handoff/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
  });
  assert.equal(put.status, 401);
});

test("handoff publish/consume is write-once and consume is one-time", async () => {
  const { sessionId, publishToken, consumeToken } = await createSession();
  const url = `${baseUrl}/v1/handoff/${sessionId}`;

  const empty = await fetch(`${url}/consume`, {
    method: "POST",
    headers: { Authorization: `Bearer ${consumeToken}` },
  });
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), { payload: null });

  const put = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publishToken}`,
    },
    body: JSON.stringify({ payload }),
  });
  assert.equal(put.status, 204);

  const duplicate = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publishToken}`,
    },
    body: JSON.stringify({ payload }),
  });
  assert.equal(duplicate.status, 409);

  const consume = await fetch(`${url}/consume`, {
    method: "POST",
    headers: { Authorization: `Bearer ${consumeToken}` },
  });
  assert.equal(consume.status, 200);
  assert.deepEqual(await consume.json(), { payload });

  const second = await fetch(`${url}/consume`, {
    method: "POST",
    headers: { Authorization: `Bearer ${consumeToken}` },
  });
  assert.ok(second.status === 404 || second.status === 409);
});

test("wrong publish token and open GET are rejected", async () => {
  const { sessionId, consumeToken } = await createSession();
  const badPut = await fetch(`${baseUrl}/v1/handoff/${sessionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${consumeToken}`,
    },
    body: JSON.stringify({ payload }),
  });
  assert.equal(badPut.status, 401);

  const get = await fetch(`${baseUrl}/v1/handoff/${sessionId}`);
  assert.equal(get.status, 410);
});

test("concurrent consume yields a single winner", async () => {
  const { sessionId, publishToken, consumeToken } = await createSession();
  const url = `${baseUrl}/v1/handoff/${sessionId}`;
  const put = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publishToken}`,
    },
    body: JSON.stringify({ payload }),
  });
  assert.equal(put.status, 204);

  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      fetch(`${url}/consume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${consumeToken}` },
      }).then(async (res) => ({
        status: res.status,
        body: await res.json().catch(() => null),
      })),
    ),
  );
  const winners = results.filter(
    (r) => r.status === 200 && (r.body as { payload?: unknown })?.payload,
  );
  assert.equal(winners.length, 1);
});

test("cancel requires consume token", async () => {
  const { sessionId, consumeToken } = await createSession();
  const unauthorized = await fetch(`${baseUrl}/v1/handoff/${sessionId}`, {
    method: "DELETE",
  });
  assert.equal(unauthorized.status, 401);

  const cancelled = await fetch(`${baseUrl}/v1/handoff/${sessionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${consumeToken}` },
  });
  assert.equal(cancelled.status, 204);
});

test("token hash helper matches store hashing", () => {
  const sessionId = generateHandoffSessionId();
  const tokens = mintHandoffSessionTokens(sessionId);
  assert.equal(sha256Hex(tokens.publishToken), tokens.publishTokenHash);
  assert.equal(sha256Hex(tokens.consumeToken), tokens.consumeTokenHash);
});
