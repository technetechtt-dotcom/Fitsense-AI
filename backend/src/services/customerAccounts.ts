import { createHash, randomBytes } from "node:crypto";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { requireMigrationsApplied } from "./migrate.js";
import { appendAudit, hashToken, newPlatformId } from "./auditLog.js";

async function ensure(): Promise<void> {
  if (!isPostgresConfigured()) throw new Error("DATABASE_URL is required.");
  await requireMigrationsApplied();
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function createCustomerAccount(input: {
  deviceId: string;
  email?: string;
  displayName?: string;
  locale?: string;
}): Promise<{ accountId: string }> {
  await ensure();
  const linked = await getPostgresPool().query<{ account_id: string }>(
    `
      SELECT account_id FROM customer_account_devices WHERE device_id = $1 LIMIT 1
    `,
    [input.deviceId],
  );
  if (linked.rows[0]) {
    return { accountId: linked.rows[0].account_id };
  }
  const accountId = newPlatformId("acct");
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO customer_accounts (
          account_id, email, display_name, primary_device_id, locale
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      [
        accountId,
        input.email?.trim().toLowerCase() ?? null,
        input.displayName ?? null,
        input.deviceId,
        input.locale ?? "en-ZA",
      ],
    );
    await client.query(
      `
        INSERT INTO customer_account_devices (account_id, device_id)
        VALUES ($1, $2)
      `,
      [accountId, input.deviceId],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  await appendAudit({
    actorId: input.deviceId,
    action: "account.create",
    resource: accountId,
  });
  return { accountId };
}

export async function getAccountForDevice(deviceId: string) {
  await ensure();
  const result = await getPostgresPool().query<{
    account_id: string;
    email: string | null;
    display_name: string | null;
    locale: string;
    status: string;
  }>(
    `
      SELECT a.account_id, a.email, a.display_name, a.locale, a.status
      FROM customer_accounts a
      JOIN customer_account_devices d ON d.account_id = a.account_id
      WHERE d.device_id = $1 AND a.status = 'active'
      LIMIT 1
    `,
    [deviceId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    accountId: row.account_id,
    email: row.email,
    displayName: row.display_name,
    locale: row.locale,
    status: row.status,
  };
}

export async function storeWebAuthnChallenge(input: {
  type: "registration" | "authentication";
  challenge: string;
  accountId?: string;
  deviceId?: string;
  ttlMs?: number;
}): Promise<{ challengeId: string }> {
  await ensure();
  const challengeId = newPlatformId("wac");
  const expiresAt = new Date(Date.now() + (input.ttlMs ?? 5 * 60 * 1000)).toISOString();
  await getPostgresPool().query(
    `
      INSERT INTO webauthn_challenges (
        challenge_id, account_id, device_id, type, challenge, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6::timestamptz)
    `,
    [
      challengeId,
      input.accountId ?? null,
      input.deviceId ?? null,
      input.type,
      input.challenge,
      expiresAt,
    ],
  );
  return { challengeId };
}

export async function consumeWebAuthnChallenge(
  challengeId: string,
): Promise<{ challenge: string; type: string; accountId: string | null } | null> {
  await ensure();
  const result = await getPostgresPool().query<{
    challenge: string;
    type: string;
    account_id: string | null;
    expires_at: Date;
  }>(
    `
      DELETE FROM webauthn_challenges
      WHERE challenge_id = $1
      RETURNING challenge, type, account_id, expires_at
    `,
    [challengeId],
  );
  const row = result.rows[0];
  if (!row || row.expires_at.getTime() < Date.now()) return null;
  return {
    challenge: row.challenge,
    type: row.type,
    accountId: row.account_id,
  };
}

export async function saveWebAuthnCredential(input: {
  accountId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  deviceType?: string;
  backedUp?: boolean;
}): Promise<void> {
  await ensure();
  await getPostgresPool().query(
    `
      INSERT INTO webauthn_credentials (
        credential_id, account_id, public_key, counter, transports, device_type, backed_up
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
      ON CONFLICT (credential_id) DO UPDATE SET
        counter = EXCLUDED.counter,
        public_key = EXCLUDED.public_key
    `,
    [
      input.credentialId,
      input.accountId,
      input.publicKey,
      input.counter,
      JSON.stringify(input.transports ?? []),
      input.deviceType ?? null,
      input.backedUp ?? false,
    ],
  );
}

export async function listWebAuthnCredentials(accountId: string) {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT credential_id, counter, transports, device_type, backed_up, created_at
      FROM webauthn_credentials
      WHERE account_id = $1
    `,
    [accountId],
  );
  return result.rows.map((r) => ({
    credentialId: r.credential_id,
    counter: Number(r.counter),
    transports: r.transports,
    deviceType: r.device_type,
    backedUp: r.backed_up,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export async function getWebAuthnCredential(credentialId: string) {
  await ensure();
  const result = await getPostgresPool().query<{
    credential_id: string;
    account_id: string;
    public_key: string;
    counter: string;
  }>(
    `
      SELECT credential_id, account_id, public_key, counter
      FROM webauthn_credentials
      WHERE credential_id = $1
      LIMIT 1
    `,
    [credentialId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    credentialId: row.credential_id,
    accountId: row.account_id,
    publicKey: row.public_key,
    counter: Number(row.counter),
  };
}

export async function updateWebAuthnCounter(
  credentialId: string,
  counter: number,
): Promise<void> {
  await ensure();
  await getPostgresPool().query(
    `UPDATE webauthn_credentials SET counter = $2 WHERE credential_id = $1`,
    [credentialId, counter],
  );
}

export async function upsertDependant(input: {
  accountId: string;
  dependantId?: string;
  displayName: string;
  relationship?: string;
  fitId?: string;
  consentGiven: boolean;
}): Promise<{ dependantId: string }> {
  await ensure();
  if (!input.consentGiven) {
    throw Object.assign(new Error("dependant_consent_required"), { status: 400 });
  }
  const dependantId = input.dependantId ?? newPlatformId("dep");
  await getPostgresPool().query(
    `
      INSERT INTO dependant_profiles (
        dependant_id, account_id, display_name, relationship, fit_id, consent_given, updated_at
      ) VALUES ($1, $2, $3, $4, $5, true, now())
      ON CONFLICT (dependant_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        relationship = EXCLUDED.relationship,
        fit_id = EXCLUDED.fit_id,
        consent_given = true,
        updated_at = now()
    `,
    [
      dependantId,
      input.accountId,
      input.displayName.trim(),
      input.relationship ?? null,
      input.fitId ?? null,
    ],
  );
  return { dependantId };
}

export async function listDependants(accountId: string) {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT dependant_id, display_name, relationship, fit_id, consent_given, updated_at
      FROM dependant_profiles
      WHERE account_id = $1
      ORDER BY display_name
    `,
    [accountId],
  );
  return result.rows.map((r) => ({
    dependantId: r.dependant_id,
    displayName: r.display_name,
    relationship: r.relationship,
    fitId: r.fit_id,
    consentGiven: r.consent_given,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}

export async function recordConsent(input: {
  accountId: string;
  purpose: string;
  granted: boolean;
  version: string;
}): Promise<{ consentId: string }> {
  await ensure();
  const consentId = newPlatformId("cns");
  await getPostgresPool().query(
    `
      INSERT INTO consent_records (consent_id, account_id, purpose, granted, version)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [consentId, input.accountId, input.purpose, input.granted, input.version],
  );
  return { consentId };
}

export async function listConsents(accountId: string) {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT consent_id, purpose, granted, version, created_at
      FROM consent_records
      WHERE account_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `,
    [accountId],
  );
  return result.rows.map((r) => ({
    consentId: r.consent_id,
    purpose: r.purpose,
    granted: r.granted,
    version: r.version,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export async function mintRecoveryToken(
  accountId: string,
): Promise<{ token: string; expiresAt: string }> {
  await ensure();
  const token = `rec_${randomBytes(24).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await getPostgresPool().query(
    `
      INSERT INTO account_recovery_tokens (token_hash, account_id, expires_at)
      VALUES ($1, $2, $3::timestamptz)
    `,
    [hashToken(token), accountId, expiresAt],
  );
  return { token, expiresAt };
}

export async function consumeRecoveryToken(
  token: string,
  deviceId: string,
): Promise<{ accountId: string } | null> {
  await ensure();
  const result = await getPostgresPool().query<{
    account_id: string;
    expires_at: Date;
    used_at: Date | null;
  }>(
    `
      SELECT account_id, expires_at, used_at
      FROM account_recovery_tokens
      WHERE token_hash = $1
      LIMIT 1
    `,
    [hashToken(token)],
  );
  const row = result.rows[0];
  if (!row || row.used_at || row.expires_at.getTime() < Date.now()) return null;
  await getPostgresPool().query(
    `UPDATE account_recovery_tokens SET used_at = now() WHERE token_hash = $1`,
    [hashToken(token)],
  );
  await getPostgresPool().query(
    `
      INSERT INTO customer_account_devices (account_id, device_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
    [row.account_id, deviceId],
  );
  return { accountId: row.account_id };
}

export async function exportAccountData(accountId: string) {
  await ensure();
  const [account, devices, dependants, consents, credentials] = await Promise.all([
    getPostgresPool().query(`SELECT * FROM customer_accounts WHERE account_id = $1`, [
      accountId,
    ]),
    getPostgresPool().query(
      `SELECT device_id, linked_at FROM customer_account_devices WHERE account_id = $1`,
      [accountId],
    ),
    listDependants(accountId),
    listConsents(accountId),
    listWebAuthnCredentials(accountId),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    account: account.rows[0] ?? null,
    devices: devices.rows,
    dependants,
    consents,
    passkeys: credentials.map((c) => ({
      credentialId: c.credentialId,
      createdAt: c.createdAt,
      deviceType: c.deviceType,
    })),
  };
}

export async function deleteAccount(accountId: string): Promise<void> {
  await ensure();
  await getPostgresPool().query(
    `
      UPDATE customer_accounts
      SET status = 'deleted', email = NULL, display_name = NULL, recovery_email = NULL,
          updated_at = now()
      WHERE account_id = $1
    `,
    [accountId],
  );
  await getPostgresPool().query(
    `DELETE FROM webauthn_credentials WHERE account_id = $1`,
    [accountId],
  );
  await getPostgresPool().query(
    `DELETE FROM dependant_profiles WHERE account_id = $1`,
    [accountId],
  );
  await appendAudit({
    action: "account.delete",
    resource: accountId,
  });
}

export async function createReservation(input: {
  orgId: string;
  locationId: string;
  productId: string;
  sizeSystem: string;
  sizeLabel: string;
  widthLabel?: string;
  accountId?: string;
  deviceId?: string;
  holdMinutes?: number;
}): Promise<{ reservationId: string; holdUntil: string }> {
  await ensure();
  const reservationId = newPlatformId("rsv");
  const holdUntil = new Date(
    Date.now() + (input.holdMinutes ?? 120) * 60 * 1000,
  ).toISOString();
  await getPostgresPool().query(
    `
      INSERT INTO store_reservations (
        reservation_id, org_id, location_id, account_id, device_id,
        product_id, size_system, size_label, width_label, hold_until, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::timestamptz, now())
    `,
    [
      reservationId,
      input.orgId,
      input.locationId,
      input.accountId ?? null,
      input.deviceId ?? null,
      input.productId,
      input.sizeSystem,
      input.sizeLabel,
      input.widthLabel ?? "standard",
      holdUntil,
    ],
  );
  return { reservationId, holdUntil };
}

export async function listLocalAvailability(input: {
  orgId: string;
  productId: string;
  sizeSystem: string;
  sizeLabel: string;
  widthLabel?: string;
  region?: string;
}) {
  await ensure();
  const width = input.widthLabel ?? "standard";
  const params: unknown[] = [
    input.orgId,
    input.productId,
    input.sizeSystem,
    input.sizeLabel,
    width,
  ];
  let regionFilter = "";
  if (input.region?.trim()) {
    params.push(input.region.trim());
    regionFilter = ` AND l.region = $${params.length}`;
  }
  const result = await getPostgresPool().query(
    `
      SELECT l.location_id, l.code, l.name, l.region, i.quantity
      FROM catalogue_inventory i
      JOIN merchant_locations l
        ON l.org_id = i.org_id AND l.location_id = i.location_id
      WHERE i.org_id = $1
        AND i.product_id = $2
        AND i.size_system = $3
        AND i.size_label = $4
        AND i.width_label = $5
        AND i.quantity > 0
        AND l.kind = 'store'
        ${regionFilter}
      ORDER BY i.quantity DESC
    `,
    params,
  );
  return result.rows.map((r) => ({
    locationId: r.location_id,
    code: r.code,
    name: r.name,
    region: r.region,
    quantity: r.quantity,
  }));
}

export { sha256 };
