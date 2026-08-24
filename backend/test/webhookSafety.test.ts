import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSafeWebhookUrl,
  isPrivateOrReservedIp,
} from "../src/services/webhookSafety.js";

test("blocks loopback and RFC1918", () => {
  assert.equal(isPrivateOrReservedIp("127.0.0.1"), true);
  assert.equal(isPrivateOrReservedIp("10.0.0.5"), true);
  assert.equal(isPrivateOrReservedIp("192.168.1.9"), true);
  assert.equal(isPrivateOrReservedIp("8.8.8.8"), false);
});

test("rejects webhook URLs aimed at private IPs", async () => {
  await assert.rejects(
    () => assertSafeWebhookUrl("https://127.0.0.1/hooks"),
    /webhook_private_ip/,
  );
  await assert.rejects(
    () => assertSafeWebhookUrl("https://169.254.169.254/latest"),
    /webhook_private_ip/,
  );
});
