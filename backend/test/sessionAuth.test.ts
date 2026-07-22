import "./env.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  issueAccessToken,
  issueSessionToken,
  sha256Hex,
  verifyAccessToken,
  verifySessionToken,
} from "../src/services/sessionAuth.js";
import {
  generateHandoffSessionId,
  mintHandoffSessionTokens,
  verifyHandoffOpToken,
} from "../src/services/handoffStore.js";

const secret = "test-session-secret";

test("access tokens round-trip for a device uid", () => {
  const issued = issueAccessToken("device-123", { secret, ttlMs: 60_000 });
  const payload = verifyAccessToken(issued.token, { secret });
  assert.equal(payload.uid, "device-123");
  assert.equal(payload.typ, "access");
  assert.ok(payload.jti);
});

test("access tokens reject tampered signatures", () => {
  const issued = issueAccessToken("device-123", { secret });
  assert.throws(
    () => verifyAccessToken(`${issued.token}x`, { secret }),
    /Invalid token/,
  );
});

test("deprecated session helpers still verify", () => {
  const token = issueSessionToken("device-123", secret);
  assert.equal(verifySessionToken(token, secret), "device-123");
});

test("device proof shape matches auth route expectation", () => {
  const deviceSecret = "dev-secret";
  const nonce = "nonce-1";
  const secretHash = sha256Hex(deviceSecret);
  const proof = sha256Hex(`${secretHash}:${nonce}`);
  assert.equal(proof.length, 64);
});

test("handoff tokens reject cross-session reuse", () => {
  const a = generateHandoffSessionId();
  const b = generateHandoffSessionId();
  const tokens = mintHandoffSessionTokens(a);
  assert.equal(verifyHandoffOpToken(tokens.publishToken, b, "publish"), false);
});
