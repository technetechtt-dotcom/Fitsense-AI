import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { parseCsvTable } from "../src/services/platformRetail.js";
import { verifyWebhookSignature } from "../src/services/webhooks.js";

test("parseCsvTable handles quoted commas", () => {
  const rows = parseCsvTable(`productId,sizeLabel,note\n"sku,1",UK5,"wide, soft"\n`);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], ["productId", "sizeLabel", "note"]);
  assert.deepEqual(rows[1], ["sku,1", "UK5", "wide, soft"]);
});

test("verifyWebhookSignature matches HMAC v1", () => {
  const secret = "whsec_test_secret";
  const timestamp = "1700000000";
  const body = JSON.stringify({ hello: "world" });
  const sig = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  assert.equal(
    verifyWebhookSignature({
      secret,
      timestamp,
      body,
      signatureHeader: `v1=${sig}`,
    }),
    true,
  );
  assert.equal(
    verifyWebhookSignature({
      secret,
      timestamp,
      body,
      signatureHeader: "v1=deadbeef",
    }),
    false,
  );
});
