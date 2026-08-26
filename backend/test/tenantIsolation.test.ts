import assert from "node:assert/strict";
import test from "node:test";
import {
  createOrg,
  upsertInventory,
  createApiKey,
} from "../src/services/merchantStore.js";
import {
  upsertLocation,
  listLocations,
  ingestOrder,
  listOrders,
  upsertPrices,
  listPrices,
  createInvitation,
} from "../src/services/platformRetail.js";
import {
  createWebhookEndpoint,
  listWebhookEndpoints,
  listWebhookDeliveries,
  enqueueWebhookEvent,
} from "../src/services/webhooks.js";
import { runMigrations } from "../src/services/migrate.js";
import { isPostgresConfigured } from "../src/services/postgres.js";
import {
  createReservation,
  listLocalAvailability,
} from "../src/services/customerAccounts.js";

const hasDb = isPostgresConfigured();

async function seedOrg(label: string) {
  const owner = `dev_${label}_${Date.now()}`;
  const org = await createOrg({
    name: `Tenant ${label} ${Date.now()}`,
    region: "Northern Cape",
    ownerDeviceId: owner,
  });
  const loc = await upsertLocation({
    orgId: org.orgId,
    code: `${label}-01`,
    name: `Store ${label}`,
    kind: "store",
    region: "Northern Cape",
  });
  await upsertInventory(org.orgId, [
    {
      productId: `sku_${label}`,
      sizeSystem: "uk",
      sizeLabel: "5",
      widthLabel: "standard",
      locationId: loc.locationId,
      quantity: 4,
    },
  ]);
  await upsertPrices(org.orgId, [
    {
      productId: `sku_${label}`,
      amountCents: 99900,
      currency: "ZAR",
      locationId: loc.locationId,
    },
  ]);
  return { org, loc, owner };
}

test(
  "tenant isolation: org A cannot read org B platform data",
  { skip: !hasDb },
  async () => {
    await runMigrations();
    const a = await seedOrg("A");
    const b = await seedOrg("B");

    await ingestOrder({
      orgId: a.org.orgId,
      externalOrderId: `a-${Date.now()}`,
      locationId: a.loc.locationId,
      fulfillment: "click_and_collect",
      lines: [
        {
          lineId: "l1",
          productId: "sku_A",
          sizeSystem: "uk",
          sizeLabel: "5",
          quantity: 1,
          unitAmountCents: 99900,
        },
      ],
    });
    await createWebhookEndpoint({
      orgId: a.org.orgId,
      url: "https://example.com/hooks/a",
      events: ["*"],
      actorId: a.owner,
    });
    await enqueueWebhookEvent({
      orgId: a.org.orgId,
      eventType: "order.ingested",
      payload: { org: "A" },
    });
    await createReservation({
      orgId: a.org.orgId,
      locationId: a.loc.locationId,
      productId: "sku_A",
      sizeSystem: "uk",
      sizeLabel: "5",
    });
    await createInvitation({
      orgId: a.org.orgId,
      email: "a-staff@example.com",
      role: "viewer",
      invitedByDeviceId: a.owner,
    });
    const keyA = await createApiKey({
      orgId: a.org.orgId,
      label: "A key",
    });

    const locsB = await listLocations(b.org.orgId);
    assert.equal(
      locsB.some((l) => l.locationId === a.loc.locationId),
      false,
    );
    const ordersB = await listOrders(b.org.orgId);
    assert.equal(
      ordersB.some((o) => String(o.externalOrderId ?? "").startsWith("a-")),
      false,
    );
    const pricesB = await listPrices(b.org.orgId);
    assert.equal(
      pricesB.some((p) => p.productId === "sku_A"),
      false,
    );
    const whB = await listWebhookEndpoints(b.org.orgId);
    assert.equal(whB.length, 0);
    const delB = await listWebhookDeliveries(b.org.orgId);
    assert.equal(delB.length, 0);
    const availB = await listLocalAvailability({
      orgId: b.org.orgId,
      productId: "sku_A",
      sizeSystem: "uk",
      sizeLabel: "5",
    });
    assert.equal(availB.length, 0);

    assert.ok(keyA.apiKey.startsWith("fs_live_"));
    assert.notEqual(a.org.orgId, b.org.orgId);
  },
);
