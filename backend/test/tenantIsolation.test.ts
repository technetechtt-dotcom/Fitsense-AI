import assert from "node:assert/strict";
import test from "node:test";
import { createOrg, upsertInventory } from "../src/services/merchantStore.js";
import { upsertLocation, listLocations, ingestOrder } from "../src/services/platformRetail.js";
import { runMigrations } from "../src/services/migrate.js";
import { isPostgresConfigured } from "../src/services/postgres.js";

const hasDb = isPostgresConfigured();

test("tenant isolation: org A cannot read org B locations/orders", { skip: !hasDb }, async () => {
  await runMigrations();
  const a = await createOrg({
    name: `TenantA ${Date.now()}`,
    region: "Northern Cape",
    ownerDeviceId: `dev_a_${Date.now()}`,
  });
  const b = await createOrg({
    name: `TenantB ${Date.now()}`,
    region: "Northern Cape",
    ownerDeviceId: `dev_b_${Date.now()}`,
  });
  const locA = await upsertLocation({
    orgId: a.orgId,
    code: "A-01",
    name: "Store A",
    kind: "store",
    region: "Northern Cape",
  });
  await upsertLocation({
    orgId: b.orgId,
    code: "B-01",
    name: "Store B",
    kind: "store",
    region: "Northern Cape",
  });
  await upsertInventory(a.orgId, [
    {
      productId: "sku_a",
      sizeSystem: "uk",
      sizeLabel: "5",
      widthLabel: "standard",
      locationId: locA.locationId,
      quantity: 2,
    },
  ]);
  await ingestOrder({
    orgId: a.orgId,
    externalOrderId: `a-${Date.now()}`,
    locationId: locA.locationId,
    fulfillment: "click_and_collect",
    lines: [
      {
        lineId: "l1",
        productId: "sku_a",
        sizeSystem: "uk",
        sizeLabel: "5",
        quantity: 1,
        unitAmountCents: 10000,
      },
    ],
  });

  const locsForB = await listLocations(b.orgId);
  assert.equal(
    locsForB.some((l) => l.locationId === locA.locationId),
    false,
  );
  assert.ok(locsForB.every((l) => l.code !== "A-01"));
});
