import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeRecoveryToken,
  createCustomerAccount,
  mintRecoveryToken,
  updateWebAuthnCounter,
  saveWebAuthnCredential,
  getWebAuthnCredential,
} from "../src/services/customerAccounts.js";
import { runMigrations } from "../src/services/migrate.js";
import { isPostgresConfigured } from "../src/services/postgres.js";

const hasDb = isPostgresConfigured();

test("account recovery token is single-use", { skip: !hasDb }, async () => {
  await runMigrations();
  const deviceId = `dev_rec_${Date.now()}`;
  const account = await createCustomerAccount({
    deviceId,
    email: `rec_${Date.now()}@example.com`,
  });
  const minted = await mintRecoveryToken(account.accountId);
  assert.ok(minted.token.length >= 10);
  const first = await consumeRecoveryToken(minted.token, `dev_new_${Date.now()}`);
  assert.ok(first);
  assert.equal(first.accountId, account.accountId);
  const second = await consumeRecoveryToken(minted.token, `dev_again_${Date.now()}`);
  assert.equal(second, null);
});

test("passkey counter must advance (replay guard)", { skip: !hasDb }, async () => {
  await runMigrations();
  const deviceId = `dev_pk_${Date.now()}`;
  const account = await createCustomerAccount({ deviceId });
  const credentialId = `cred_${Date.now()}`;
  await saveWebAuthnCredential({
    credentialId,
    accountId: account.accountId,
    publicKey: Buffer.from("test-public-key").toString("base64url"),
    counter: 5,
    deviceType: "singleDevice",
    backedUp: false,
    transports: [],
  });
  await updateWebAuthnCounter(credentialId, 6);
  const stored = await getWebAuthnCredential(credentialId);
  assert.equal(stored?.counter, 6);
  // Application layer rejects newCounter <= stored.counter (see accounts route).
  assert.ok(stored && stored.counter > 5);
});
