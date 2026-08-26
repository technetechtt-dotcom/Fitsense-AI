#!/usr/bin/env node
/**
 * Rotate / reseal all webhook signing secrets.
 * - Decrypts sealed or legacy plaintext values
 * - Writes fsenc1 ciphertext + seal_key_version
 * - Sets signing_secret column to placeholder 'sealed'
 *
 * Usage: cd backend && npm run webhooks:rotate-secrets
 */
import { getPostgresPool, isPostgresConfigured } from "../src/services/postgres.js";
import { requireMigrationsApplied } from "../src/services/migrate.js";
import { isSealedSecret, openSecret, sealSecret } from "../src/services/secretSeal.js";
import { config } from "../src/config.js";

async function main() {
  if (!isPostgresConfigured()) {
    throw new Error("DATABASE_URL required");
  }
  await requireMigrationsApplied();
  const pool = getPostgresPool();
  const rows = await pool.query<{
    endpoint_id: string;
    org_id: string;
    signing_secret: string;
    signing_secret_enc: string | null;
  }>(
    `
      SELECT endpoint_id, org_id, signing_secret, signing_secret_enc
      FROM merchant_webhook_endpoints
    `,
  );
  let rotated = 0;
  let already = 0;
  for (const row of rows.rows) {
    const source = row.signing_secret_enc || row.signing_secret;
    if (!source || source === "sealed") {
      console.warn(`skip ${row.endpoint_id}: no secret material`);
      continue;
    }
    const plain = openSecret(source);
    if (
      isSealedSecret(row.signing_secret_enc ?? "") &&
      row.signing_secret === "sealed"
    ) {
      // Re-seal under current key version (rotation).
    }
    const sealed = sealSecret(plain);
    await pool.query(
      `
        UPDATE merchant_webhook_endpoints
        SET signing_secret_enc = $2,
            signing_secret = 'sealed',
            seal_key_version = $3,
            updated_at = now()
        WHERE endpoint_id = $1
      `,
      [row.endpoint_id, sealed, config.webhookSealKeyVersion],
    );
    rotated += 1;
    // Never log plaintext or sealed ciphertext.
    console.log(`rotated ${row.endpoint_id} org=${row.org_id}`);
  }
  console.log(JSON.stringify({ rotated, already, keyVersion: config.webhookSealKeyVersion }));
  await pool.end();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
