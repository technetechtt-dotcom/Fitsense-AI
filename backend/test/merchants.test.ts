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

test("merchant org, catalogue ingest, brand fit, outcomes, pilot metrics", async () => {
  requireDb();
  const accessToken = await authToken(baseUrl);

  const create = await fetch(`${baseUrl}/v1/merchants/orgs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `Kimberley Pilot ${Date.now()}`,
      region: "Northern Cape",
    }),
  });
  assert.equal(create.status, 201);
  const org = (await create.json()) as { orgId: string };

  const keyRes = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/api-keys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ label: "pos" }),
  });
  assert.equal(keyRes.status, 201);
  const keyBody = (await keyRes.json()) as { apiKey: string; keyId: string };
  assert.ok(keyBody.apiKey.startsWith("fs_live_"));
  assert.ok(typeof keyBody.keyId === "string" && keyBody.keyId.startsWith("key_"));

  const ingest = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/catalogue/ingest`,
    {
      method: "POST",
      headers: {
        "X-Api-Key": keyBody.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: [
          {
            productId: "bata-power-school-01",
            brand: "Bata Power",
            model: "School Runner",
            category: "school",
            fitType: "standard",
            sizeRangeEu: { min: 30, max: 42, step: 1 },
            priceUsd: 35,
            description: "NC school footwear pilot SKU",
            colorways: ["Black"],
            dataQuality: "verified",
          },
        ],
      }),
    },
  );
  assert.equal(ingest.status, 200);

  const brandFit = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/brand-fit`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      brand: "Bata Power",
      model: "School Runner",
      euSizeDelta: 0,
      toeBoxWidth: "regular",
      midsoleFeel: "firm",
      note: "Pilot model — true to size",
    }),
  });
  assert.equal(brandFit.status, 204);

  const inventory = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/inventory`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          productId: "bata-power-school-01",
          sizeSystem: "uk",
          sizeLabel: "5",
          widthLabel: "standard",
          quantity: 12,
        },
        {
          productId: "bata-power-school-02",
          sizeSystem: "uk",
          sizeLabel: "5",
          widthLabel: "wide",
          quantity: 4,
        },
      ],
    }),
  });
  assert.equal(inventory.status, 200);

  const invList = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/inventory`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(invList.status, 200);
  const invBody = (await invList.json()) as {
    items: Array<{ productId: string; quantity: number; widthLabel?: string }>;
  };
  assert.ok(invBody.items.some((i) => i.productId === "bata-power-school-01"));
  assert.ok(
    invBody.items.some(
      (i) => i.productId === "bata-power-school-02" && i.widthLabel === "wide",
    ),
  );

  for (const [idx, kind] of (
    ["purchase", "purchase", "return", "exchange"] as const
  ).entries()) {
    const outcome = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/outcomes`, {
      method: "POST",
      headers: {
        "X-Api-Key": keyBody.apiKey,
        "Content-Type": "application/json",
        "Idempotency-Key": `kim-pilot-${kind}-${idx}`,
      },
      body: JSON.stringify({
        kind,
        productId: "bata-power-school-01",
        brand: "Bata Power",
        sizeLabel: "5",
        sizeSystem: "uk",
        reason: kind === "return" ? "too_small" : undefined,
        orderId: "KIM-ORD-1001",
        orderLineId: `KIM-ORD-1001-${kind}-${idx}`,
      }),
    });
    assert.equal(outcome.status, 201);
  }

  // Idempotent replay returns the same outcome id.
  const replay = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/outcomes`, {
    method: "POST",
    headers: {
      "X-Api-Key": keyBody.apiKey,
      "Content-Type": "application/json",
      "Idempotency-Key": "kim-pilot-purchase-0",
    },
    body: JSON.stringify({
      kind: "purchase",
      productId: "bata-power-school-01",
      brand: "Bata Power",
      sizeLabel: "5",
      sizeSystem: "uk",
      orderId: "KIM-ORD-1001",
      orderLineId: "KIM-ORD-1001-purchase-0",
    }),
  });
  assert.equal(replay.status, 200);
  const replayBody = (await replay.json()) as { outcomeId: string; reused: boolean };
  assert.equal(replayBody.reused, true);

  // Client-supplied deviceId must not be trusted for API-key posts.
  const spoof = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/outcomes`, {
    method: "POST",
    headers: {
      "X-Api-Key": keyBody.apiKey,
      "Content-Type": "application/json",
      "Idempotency-Key": "kim-spoof-device",
    },
    body: JSON.stringify({
      kind: "purchase",
      productId: "bata-power-school-01",
      orderLineId: "KIM-ORD-spoof-1",
      data: { deviceId: "dev_attacker_spoof" },
    }),
  });
  assert.equal(spoof.status, 201);

  const bySpoofDevice = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/outcomes?deviceId=dev_attacker_spoof`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  assert.equal(bySpoofDevice.status, 200);
  const spoofBody = (await bySpoofDevice.json()) as { outcomes: unknown[] };
  assert.equal(spoofBody.outcomes.length, 0);

  const catToken = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/catalogue-token`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  assert.equal(catToken.status, 201);
  const catBody = (await catToken.json()) as { token: string; scope: string };
  assert.equal(catBody.scope, "merchant:catalogue:read");
  const catList = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/catalogue`, {
    headers: { Authorization: `Bearer ${catBody.token}` },
  });
  assert.equal(catList.status, 200);
  const catIngestDenied = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/catalogue/ingest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${catBody.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: [
          {
            productId: "should-fail",
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
  assert.equal(catIngestDenied.status, 403);

  const metrics = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/pilot-metrics`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  assert.equal(metrics.status, 200);
  const body = (await metrics.json()) as {
    purchases: number;
    returns: number;
    exchanges: number;
    returnRate: number | null;
  };
  assert.equal(body.purchases, 3);
  assert.equal(body.returns, 1);
  assert.equal(body.exchanges, 1);
  assert.equal(body.returnRate, 1 / 3);
  assert.equal(body.exchangeRate, 1 / 3);
  assert.equal(body.sizeRelatedRate, 2 / 3);

  const outcomesList = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/outcomes?limit=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  assert.equal(outcomesList.status, 200);
  const outcomesBody = (await outcomesList.json()) as {
    outcomes: Array<{ kind: string; orderId: string | null }>;
  };
  assert.ok(outcomesBody.outcomes.length >= 4);
  assert.ok(outcomesBody.outcomes.some((o) => o.orderId === "KIM-ORD-1001"));

  const byOrder = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/outcomes?orderId=KIM-ORD-1001`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  assert.equal(byOrder.status, 200);
  const byOrderBody = (await byOrder.json()) as {
    outcomes: Array<{ orderId: string | null }>;
  };
  assert.ok(byOrderBody.outcomes.length >= 1);
  assert.ok(byOrderBody.outcomes.every((o) => o.orderId === "KIM-ORD-1001"));

  const outcomesCsv = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/outcomes?format=csv`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  assert.equal(outcomesCsv.status, 200);
  const csvText = await outcomesCsv.text();
  assert.ok(csvText.includes("outcomeId,kind"));
  assert.ok(csvText.includes("KIM-ORD-1001"));

  const listKeys = await fetch(`${baseUrl}/v1/merchants/orgs/${org.orgId}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(listKeys.status, 200);
  const keysBody = (await listKeys.json()) as {
    keys: Array<{ keyId: string; revoked: boolean }>;
  };
  assert.ok(keysBody.keys.some((k) => k.keyId === keyBody.keyId));

  const revoke = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/api-keys/${keyBody.keyId}/revoke`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  assert.equal(revoke.status, 204);

  const afterRevoke = await fetch(
    `${baseUrl}/v1/merchants/orgs/${org.orgId}/catalogue`,
    {
      headers: { "X-Api-Key": keyBody.apiKey },
    },
  );
  assert.equal(afterRevoke.status, 401);
});
