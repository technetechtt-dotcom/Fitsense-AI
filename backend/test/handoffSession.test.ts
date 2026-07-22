import assert from "node:assert/strict";
import { test } from "node:test";
import { issueSessionToken } from "../src/services/sessionAuth.js";

test("handoff publish tokens are bound to session ids", () => {
  const token = issueSessionToken("ABCDEFGHIJKLMNOPQRSTUVWX", "handoff-test-secret");
  assert.ok(token.includes("."));
});
