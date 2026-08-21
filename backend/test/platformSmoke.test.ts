/**
 * Platform capability integration smoke (Postgres).
 * Covers locations, prices, orders, webhooks enqueue, invitations, audit chain.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runMigrations } from "../src/services/migrate.js";
import { isPostgresConfigured } from "../src/services/postgres.js";
import { createOrg } from "../src/services/merchantStore.js";
import {
  createInvitation,
  acceptInvitation,
  ingestOrder,
  listLocations,
  runReconciliation,
  upsertLocation,
  upsertPrices,
} from "../src/services/platformRetail.js";
import {
  createWebhookEndpoint,
  enqueueWebhookEvent,
  listWebhookDeliveries,
  verifyWebhookSignature,
} from "../src/services/webhooks.js";
import { appendAudit, verifyAuditChain } from "../src/services/auditLog.js";
import {
  createCustomerAccount,
  recordConsent,
  upsertDependant,
} from "../src/services/customerAccounts.js";
import {
  checkEntitlement,
  recordUsage,
  generateInvoice,
} from "../src/services/commercial.js";
import {
  listProcessingRegister,
  createDsarRequest,
} from "../src/services/compliance.js";

const hasDb = isPostgresConfigured();

test("platform: retailer + consumer + compliance smoke", { skip: !hasDb }, async () => {
  await runMigrations();
  const ownerDevice = `dev_owner_${Date.now()}`;
  const org = await createOrg({
    name: `Platform Smoke ${Date.now()}`,
    region: "Northern Cape",
    ownerDeviceId: ownerDevice,
  });

  const loc = await upsertLocation({
    orgId: org.orgId,
    code: "KIM-01",
    name: "Kimberley Flagship",
    kind: "store",
    region: "Northern Cape",
    actorId: ownerDevice,
  });
  const locations = await listLocations(org.orgId);
  assert.ok(locations.some((l) => l.locationId === loc.locationId));

  await upsertPrices(org.orgId, [
    {
      productId: "prod_smoke_1",
      amountCents: 129900,
      currency: "ZAR",
      locationId: loc.locationId,
    },
  ]);

  const order = await ingestOrder({
    orgId: org.orgId,
    externalOrderId: `ext-${Date.now()}`,
    locationId: loc.locationId,
    fulfillment: "click_and_collect",
    lines: [
      {
        lineId: "line-1",
        productId: "prod_smoke_1",
        sizeSystem: "uk",
        sizeLabel: "5",
        quantity: 1,
        unitAmountCents: 129900,
      },
    ],
    actorId: ownerDevice,
  });
  assert.ok(order.orderId.startsWith("ord_"));

  const wh = await createWebhookEndpoint({
    orgId: org.orgId,
    url: "https://example.com/hooks/fitsense",
    events: ["order.ingested", "*"],
    actorId: ownerDevice,
  });
  assert.ok(wh.secret.startsWith("whsec_"));
  const enq = await enqueueWebhookEvent({
    orgId: org.orgId,
    eventType: "order.ingested",
    payload: { orderId: order.orderId },
  });
  assert.ok(enq.enqueued >= 1);
  const deliveries = await listWebhookDeliveries(org.orgId);
  assert.ok(deliveries.length >= 1);
  assert.equal(
    verifyWebhookSignature({
      secret: wh.secret,
      timestamp: "1",
      body: "{}",
      signatureHeader: "v1=nope",
    }),
    false,
  );

  const invite = await createInvitation({
    orgId: org.orgId,
    email: "staff@example.com",
    role: "operator",
    invitedByDeviceId: ownerDevice,
  });
  const staffDevice = `dev_staff_${Date.now()}`;
  const accepted = await acceptInvitation({
    token: invite.token,
    deviceId: staffDevice,
  });
  assert.equal(accepted.orgId, org.orgId);
  assert.equal(accepted.role, "operator");

  const recon = await runReconciliation(org.orgId);
  assert.ok(recon.runId.startsWith("recon_"));
  assert.ok((recon.summary.orders as number) >= 1);

  await appendAudit({
    orgId: org.orgId,
    actorId: ownerDevice,
    action: "test.ping",
    resource: org.orgId,
  });
  const chain = await verifyAuditChain(500);
  assert.equal(chain.ok, true);

  const acct = await createCustomerAccount({
    deviceId: `dev_cust_${Date.now()}`,
    email: `cust_${Date.now()}@example.com`,
    locale: "af-ZA",
  });
  await recordConsent({
    accountId: acct.accountId,
    purpose: "scan_history",
    granted: true,
    version: "1.0",
  });
  await upsertDependant({
    accountId: acct.accountId,
    displayName: "Kind",
    relationship: "child",
    consentGiven: true,
  });

  await recordUsage({ orgId: org.orgId, metric: "scan_sync", quantity: 3 });
  const ent = await checkEntitlement(org.orgId, "catalogue");
  assert.equal(ent.allowed, true);
  const inv = await generateInvoice(org.orgId);
  assert.ok(inv.invoiceId.startsWith("inv_"));

  const register = await listProcessingRegister();
  assert.ok(register.length >= 1);
  const dsar = await createDsarRequest({
    type: "access",
    accountId: acct.accountId,
    deviceId: ownerDevice,
  });
  assert.ok(dsar.requestId.startsWith("dsar_"));
});
