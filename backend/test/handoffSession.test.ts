import "./env.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generateHandoffSessionId,
  mintHandoffSessionTokens,
  verifyHandoffOpToken,
} from "../src/services/handoffStore.js";

test("handoff publish tokens are bound to session ids and op", () => {
  const sessionId = generateHandoffSessionId();
  const { publishToken, consumeToken } = mintHandoffSessionTokens(sessionId);
  assert.ok(publishToken.includes("."));
  assert.equal(verifyHandoffOpToken(publishToken, sessionId, "publish"), true);
  assert.equal(verifyHandoffOpToken(consumeToken, sessionId, "consume"), true);
  assert.equal(verifyHandoffOpToken(publishToken, sessionId, "consume"), false);
});
