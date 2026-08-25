import assert from "node:assert/strict";
import test from "node:test";
import { createOrg, upsertInventory } from "../src/services/merchantStore.js";
import { upsertLocation } from "../src/services/platformRetail.js";
import {
  cancelReservation,
  collectReservation,
  confirmReservation,
  createReservation,
} from "../src/services/customerAccounts.js";
import { runMigrations } from "../src/services/migrate.js";
import { getPostgresPool, isPostgresConfigured } from "../src/services/postgres.js";
import { openSecret, sealSecret } from "../src/services/secretSeal.js";

const hasDb = isPostgresConfigured();

test("reservation idempotency returns same id", { skip: !hasDb }, async () => {
  await runMigrations();
  const org = await createOrg({
    name: `Idem ${Date.now()}`,
    region: "Northern Cape",
    ownerDeviceId: `dev_idem_${Date.now()}`,
  });
  const loc = await upsertLocation({
    orgId: org.orgId,
    code: "KIM-IDEM",
    name: "Idem Store",
    kind: "store",
    region: "Northern Cape",
  });
  await upsertInventory(org.orgId, [
    {
      productId: "prod_idem",
      sizeSystem: "uk",
      sizeLabel: "6",
      widthLabel: "standard",
      locationId: loc.locationId,
      quantity: 5,
    },
  ]);
  const key = `idem-${Date.now()}`;
  const a = await createReservation({
    orgId: org.orgId,
    locationId: loc.locationId,
    productId: "prod_idem",
    sizeSystem: "uk",
    sizeLabel: "6",
    idempotencyKey: key,
  });
  const b = await createReservation({
    orgId: org.orgId,
    locationId: loc.locationId,
    productId: "prod_idem",
    sizeSystem: "uk",
    sizeLabel: "6",
    idempotencyKey: key,
  });
  assert.equal(a.reservationId, b.reservationId);
  assert.equal(b.replayed, true);
});

test("confirm cancel collect lifecycle sells inventory", { skip: !hasDb }, async () => {
  await runMigrations();
  const org = await createOrg({
    name: `Life ${Date.now()}`,
    region: "Northern Cape",
    ownerDeviceId: `dev_life_${Date.now()}`,
  });
  const loc = await upsertLocation({
    orgId: org.orgId,
    code: "KIM-LIFE",
    name: "Life Store",
    kind: "store",
    region: "Northern Cape",
  });
  await upsertInventory(org.orgId, [
    {
      productId: "prod_life",
      sizeSystem: "uk",
      sizeLabel: "7",
      widthLabel: "standard",
      locationId: loc.locationId,
      quantity: 3,
    },
  ]);
  const held = await createReservation({
    orgId: org.orgId,
    locationId: loc.locationId,
    productId: "prod_life",
    sizeSystem: "uk",
    sizeLabel: "7",
  });
  const confirmed = await confirmReservation({
    reservationId: held.reservationId,
    orgId: org.orgId,
  });
  assert.equal(confirmed.status, "ready");
  const sold = await collectReservation({
    reservationId: held.reservationId,
    orgId: org.orgId,
  });
  assert.equal(sold.status, "collected");
  assert.equal(sold.quantitySold, 1);
  const qty = await getPostgresPool().query<{ quantity: number }>(
    `
      SELECT quantity FROM catalogue_inventory
      WHERE org_id = $1 AND product_id = $2 AND size_label = $3
    `,
    [org.orgId, "prod_life", "7"],
  );
  assert.equal(qty.rows[0]?.quantity, 2);

  const other = await createReservation({
    orgId: org.orgId,
    locationId: loc.locationId,
    productId: "prod_life",
    sizeSystem: "uk",
    sizeLabel: "7",
  });
  const cancelled = await cancelReservation({
    reservationId: other.reservationId,
    orgId: org.orgId,
  });
  assert.equal(cancelled.status, "cancelled");
});

test("secretSeal round-trips webhook secrets", () => {
  const sealed = sealSecret("whsec_test_plain");
  assert.match(sealed, /^fsenc1:/);
  assert.equal(openSecret(sealed), "whsec_test_plain");
  assert.equal(openSecret("legacy_plaintext"), "legacy_plaintext");
});
