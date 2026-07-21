import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { createApp } from "../src/app.js";
import { MemoryHandoffStore } from "../src/services/handoffStore.js";
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
  assert.equal(await store.set("ABCDEFGHIJKLMNOP", payload), "stored");
  assert.equal(await store.set("ABCDEFGHIJKLMNOP", payload), "exists");
  assert.deepEqual(await store.get("ABCDEFGHIJKLMNOP"), payload);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(await store.get("ABCDEFGHIJKLMNOP"), null);
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

test("handoff route stores, reads, blocks overwrite, and deletes payloads", async () => {
  const sessionId = "ABCDEFGHIJKLMNOPQRSTUV";
  const url = `${baseUrl}/v1/handoff/${sessionId}`;

  const put = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
  });
  assert.equal(put.status, 204);

  const duplicate = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
  });
  assert.equal(duplicate.status, 409);

  const get = await fetch(url);
  assert.equal(get.status, 200);
  assert.deepEqual(await get.json(), { payload });

  const del = await fetch(url, { method: "DELETE" });
  assert.equal(del.status, 204);

  const empty = await fetch(url);
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), { payload: null });
});

test("handoff route rejects invalid session ids and oversized shapes", async () => {
  const invalidId = await fetch(`${baseUrl}/v1/handoff/short`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
  });
  assert.equal(invalidId.status, 400);

  const invalidPayload = await fetch(`${baseUrl}/v1/handoff/ZYXWVUTSRQPONMLK`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload: { ...payload, extra: true } }),
  });
  assert.equal(invalidPayload.status, 400);
});
