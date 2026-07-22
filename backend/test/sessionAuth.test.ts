import assert from "node:assert/strict";
import { test } from "node:test";
import { issueSessionToken, verifySessionToken } from "../src/services/sessionAuth.js";

const secret = "test-session-secret";

test("session tokens round-trip for a device uid", () => {
  const token = issueSessionToken("device-123", secret);
  const uid = verifySessionToken(token, secret);
  assert.equal(uid, "device-123");
});

test("session tokens reject tampered signatures", () => {
  const token = issueSessionToken("device-123", secret);
  const tampered = `${token}x`;
  assert.throws(() => verifySessionToken(tampered, secret), /Invalid token/);
});
