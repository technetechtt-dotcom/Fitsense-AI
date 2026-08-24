import assert from "node:assert/strict";
import test from "node:test";
import { createOrg, upsertInventory } from "../src/services/merchantStore.js";
import { upsertLocation } from "../src/services/platformRetail.js";
import { createReservation } from "../src/services/customerAccounts.js";
import { runMigrations } from "../src/services/migrate.js";
import { isPostgresConfigured } from "../src/services/postgres.js";

const hasDb = isPostgresConfigured();

test("concurrent reservations cannot oversell one SKU", { skip: !hasDb }, async () => {
  await runMigrations();
  const org = await createOrg({
    name: `Rsv ${Date.now()}`,
    region: "Northern Cape",
    ownerDeviceId: `dev_rsv_${Date.now()}`,
  });
  const loc = await upsertLocation({
    orgId: org.orgId,
    code: "KIM-RSV",
    name: "Kimberley Reserve",
    kind: "store",
    region: "Northern Cape",
  });
  await upsertInventory(org.orgId, [
    {
      productId: "prod_rsv_1",
      sizeSystem: "uk",
      sizeLabel: "5",
      widthLabel: "standard",
      locationId: loc.locationId,
      quantity: 1,
    },
  ]);

  const input = {
    orgId: org.orgId,
    locationId: loc.locationId,
    productId: "prod_rsv_1",
    sizeSystem: "uk",
    sizeLabel: "5",
    holdMinutes: 30,
  };
  const results = await Promise.allSettled([
    createReservation(input),
    createReservation(input),
  ]);
  const ok = results.filter((r) => r.status === "fulfilled");
  const rejected = results.filter((r) => r.status === "rejected");
  assert.equal(ok.length, 1);
  assert.equal(rejected.length, 1);
  const err = rejected[0] as PromiseRejectedResult;
  assert.match(String(err.reason?.message ?? err.reason), /insufficient_stock/);
});
