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

async function authToken(baseUrl: string): Promise<{
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
  return { accessToken: body.accessToken, deviceId: device.deviceId };
}

let server: Server;
let baseUrl = "";

before(async () => {
  requireDb();
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("no port");
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("catalogue token is read-only and cannot mint or ingest", async () => {
  requireDb();
  const { accessToken } = await authToken(baseUrl);
  const orgRes = await fetch(`${baseUrl}/v1/merchants/orgs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Token Boundary Org", region: "ZA-NC" }),
  });
  assert.equal(orgRes.status, 201);
  const org = (await orgRes.json()) as { orgId: string };

  const mint = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/catalogue-token`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  assert.equal(mint.status, 201);
  const { token } = (await mint.json()) as { token: string };

  const catalogue = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/catalogue`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(catalogue.status, 200);

  const remint = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/catalogue-token`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  assert.equal(remint.status, 403);

  const ingest = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/catalogue/ingest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: [
          {
            productId: "blocked-sku",
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
  assert.equal(ingest.status, 403);

  const outcomes = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/outcomes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ kind: "purchase", productId: "blocked-sku" }),
  });
  assert.equal(outcomes.status, 403);

  // Wrong org must not accept the token.
  const other = await fetch(`${baseUrl}/v1/merchants/orgs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Other Org", region: "ZA-NC" }),
  });
  const otherOrg = (await other.json()) as { orgId: string };
  const cross = await fetch(
    `${baseUrl}/v1/merchants/orgs/${otherOrg.orgId}/catalogue`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  assert.equal(cross.status, 403);
});

test("purchase then return can share commercial order_line_id", async () => {
  requireDb();
  const { accessToken } = await authToken(baseUrl);
  const orgRes = await fetch(`${baseUrl}/v1/merchants/orgs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Line Kind Org", region: "ZA-NC" }),
  });
  const org = (await orgRes.json()) as { orgId: string };
  const keyRes = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/api-keys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ label: "pos" }),
  });
  const keyBody = (await keyRes.json()) as { apiKey: string };
  const line = "ORD-9|sku-1|uk|5";

  const purchase = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/outcomes`, {
    method: "POST",
    headers: {
      "X-Api-Key": keyBody.apiKey,
      "Content-Type": "application/json",
      "Idempotency-Key": "evt-purchase-1",
    },
    body: JSON.stringify({
      kind: "purchase",
      productId: "sku-1",
      sizeLabel: "5",
      sizeSystem: "uk",
      orderId: "ORD-9",
      orderLineId: line,
    }),
  });
  assert.equal(purchase.status, 201);

  const ret = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/outcomes`, {
    method: "POST",
    headers: {
      "X-Api-Key": keyBody.apiKey,
      "Content-Type": "application/json",
      "Idempotency-Key": "evt-return-1",
    },
    body: JSON.stringify({
      kind: "return",
      productId: "sku-1",
      sizeLabel: "5",
      sizeSystem: "uk",
      orderId: "ORD-9",
      orderLineId: line,
      reason: "too_small",
    }),
  });
  assert.equal(ret.status, 201);

  const dupPurchase = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/outcomes`,
    {
      method: "POST",
      headers: {
        "X-Api-Key": keyBody.apiKey,
        "Content-Type": "application/json",
        "Idempotency-Key": "evt-purchase-1",
      },
      body: JSON.stringify({
        kind: "purchase",
        productId: "sku-1",
        orderLineId: line,
      }),
    },
  );
  assert.equal(dupPurchase.status, 200);
  const dupBody = (await dupPurchase.json()) as { reused: boolean };
  assert.equal(dupBody.reused, true);
});
