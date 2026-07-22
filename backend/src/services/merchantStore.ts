import { createHash, randomBytes } from "node:crypto";
import {
  getPostgresPool,
  isPostgresConfigured,
  withPostgresSchemaLock,
} from "./postgres.js";

export type OrgRole = "owner" | "admin" | "operator" | "viewer";

export const ORG_ROLES: readonly OrgRole[] = [
  "owner",
  "admin",
  "operator",
  "viewer",
] as const;

const ROLE_RANK: Record<OrgRole, number> = {
  owner: 40,
  admin: 30,
  operator: 20,
  viewer: 10,
};

let schemaReady: Promise<void> | null = null;

export async function ensureMerchantSchema(): Promise<void> {
  if (!isPostgresConfigured()) {
    throw new Error("DATABASE_URL is required for merchant APIs.");
  }
  schemaReady ??= withPostgresSchemaLock(async (client) => {
    await client.query(`
        CREATE TABLE IF NOT EXISTS merchant_orgs (
          org_id text PRIMARY KEY,
          name text NOT NULL,
          region text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS merchant_members (
          org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
          device_id text NOT NULL,
          role text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (org_id, device_id)
        );

        CREATE TABLE IF NOT EXISTS merchant_api_keys (
          key_hash text PRIMARY KEY,
          org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
          label text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          revoked_at timestamptz
        );

        CREATE INDEX IF NOT EXISTS idx_merchant_api_keys_org
          ON merchant_api_keys (org_id);

        CREATE TABLE IF NOT EXISTS catalogue_products (
          org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
          product_id text NOT NULL,
          data jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (org_id, product_id)
        );

        CREATE TABLE IF NOT EXISTS catalogue_inventory (
          org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
          product_id text NOT NULL,
          size_system text NOT NULL,
          size_label text NOT NULL,
          quantity integer NOT NULL DEFAULT 0,
          updated_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (org_id, product_id, size_system, size_label)
        );

        CREATE TABLE IF NOT EXISTS brand_fit_profiles (
          org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
          brand text NOT NULL,
          model text NOT NULL DEFAULT '',
          eu_size_delta double precision NOT NULL DEFAULT 0,
          toe_box_width text NOT NULL DEFAULT 'regular',
          midsole_feel text NOT NULL DEFAULT 'balanced',
          note text,
          data jsonb NOT NULL DEFAULT '{}'::jsonb,
          updated_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (org_id, brand, model)
        );

        CREATE TABLE IF NOT EXISTS merchant_outcomes (
          outcome_id text PRIMARY KEY,
          org_id text NOT NULL REFERENCES merchant_orgs(org_id) ON DELETE CASCADE,
          kind text NOT NULL,
          product_id text,
          brand text,
          size_label text,
          size_system text,
          fit_id text,
          reason text,
          data jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_merchant_outcomes_org_created
          ON merchant_outcomes (org_id, created_at DESC);
      `);
  });
  await schemaReady;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("base64url")}`;
}

export function roleAtLeast(role: OrgRole, minimum: OrgRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export async function createOrg(input: {
  name: string;
  region?: string;
  ownerDeviceId: string;
}): Promise<{ orgId: string; name: string; region: string | null }> {
  await ensureMerchantSchema();
  const orgId = newId("org");
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO merchant_orgs (org_id, name, region)
        VALUES ($1, $2, $3)
      `,
      [orgId, input.name, input.region ?? null],
    );
    await client.query(
      `
        INSERT INTO merchant_members (org_id, device_id, role)
        VALUES ($1, $2, 'owner')
      `,
      [orgId, input.ownerDeviceId],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return { orgId, name: input.name, region: input.region ?? null };
}

export async function listOrgsForDevice(
  deviceId: string,
): Promise<
  Array<{ orgId: string; name: string; region: string | null; role: OrgRole }>
> {
  await ensureMerchantSchema();
  const result = await getPostgresPool().query<{
    org_id: string;
    name: string;
    region: string | null;
    role: OrgRole;
  }>(
    `
      SELECT o.org_id, o.name, o.region, m.role
      FROM merchant_members m
      JOIN merchant_orgs o ON o.org_id = m.org_id
      WHERE m.device_id = $1
      ORDER BY o.name
    `,
    [deviceId],
  );
  return result.rows.map((r) => ({
    orgId: r.org_id,
    name: r.name,
    region: r.region,
    role: r.role,
  }));
}

export async function getMemberRole(
  orgId: string,
  deviceId: string,
): Promise<OrgRole | null> {
  await ensureMerchantSchema();
  const result = await getPostgresPool().query<{ role: OrgRole }>(
    `
      SELECT role FROM merchant_members
      WHERE org_id = $1 AND device_id = $2
    `,
    [orgId, deviceId],
  );
  return result.rows[0]?.role ?? null;
}

export async function upsertMember(input: {
  orgId: string;
  deviceId: string;
  role: OrgRole;
}): Promise<void> {
  await ensureMerchantSchema();
  await getPostgresPool().query(
    `
      INSERT INTO merchant_members (org_id, device_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (org_id, device_id) DO UPDATE SET role = EXCLUDED.role
    `,
    [input.orgId, input.deviceId, input.role],
  );
}

export async function listMembers(
  orgId: string,
): Promise<Array<{ deviceId: string; role: OrgRole; createdAt: Date }>> {
  await ensureMerchantSchema();
  const result = await getPostgresPool().query<{
    device_id: string;
    role: OrgRole;
    created_at: Date;
  }>(
    `
      SELECT device_id, role, created_at
      FROM merchant_members
      WHERE org_id = $1
      ORDER BY created_at
    `,
    [orgId],
  );
  return result.rows.map((r) => ({
    deviceId: r.device_id,
    role: r.role,
    createdAt: r.created_at,
  }));
}

export async function createApiKey(input: {
  orgId: string;
  label: string;
}): Promise<{ apiKey: string; label: string }> {
  await ensureMerchantSchema();
  const apiKey = `fs_live_${randomBytes(24).toString("base64url")}`;
  await getPostgresPool().query(
    `
      INSERT INTO merchant_api_keys (key_hash, org_id, label)
      VALUES ($1, $2, $3)
    `,
    [sha256Hex(apiKey), input.orgId, input.label],
  );
  return { apiKey, label: input.label };
}

export async function resolveApiKey(apiKey: string): Promise<{ orgId: string } | null> {
  await ensureMerchantSchema();
  const result = await getPostgresPool().query<{ org_id: string }>(
    `
      SELECT org_id FROM merchant_api_keys
      WHERE key_hash = $1 AND revoked_at IS NULL
    `,
    [sha256Hex(apiKey.trim())],
  );
  const row = result.rows[0];
  return row ? { orgId: row.org_id } : null;
}

export async function ingestProducts(
  orgId: string,
  products: Array<Record<string, unknown> & { productId: string }>,
): Promise<{ upserted: number }> {
  await ensureMerchantSchema();
  const pool = getPostgresPool();
  const client = await pool.connect();
  let upserted = 0;
  try {
    await client.query("BEGIN");
    for (const product of products) {
      await client.query(
        `
          INSERT INTO catalogue_products (org_id, product_id, data, updated_at)
          VALUES ($1, $2, $3::jsonb, now())
          ON CONFLICT (org_id, product_id) DO UPDATE SET
            data = EXCLUDED.data,
            updated_at = now()
        `,
        [orgId, product.productId, JSON.stringify(product)],
      );
      upserted += 1;
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return { upserted };
}

export async function listProducts(orgId: string): Promise<unknown[]> {
  await ensureMerchantSchema();
  const result = await getPostgresPool().query<{ data: unknown }>(
    `
      SELECT data FROM catalogue_products
      WHERE org_id = $1
      ORDER BY product_id
    `,
    [orgId],
  );
  return result.rows.map((r) => r.data);
}

export async function upsertInventory(
  orgId: string,
  rows: Array<{
    productId: string;
    sizeSystem: string;
    sizeLabel: string;
    quantity: number;
  }>,
): Promise<{ upserted: number }> {
  await ensureMerchantSchema();
  const pool = getPostgresPool();
  const client = await pool.connect();
  let upserted = 0;
  try {
    await client.query("BEGIN");
    for (const row of rows) {
      await client.query(
        `
          INSERT INTO catalogue_inventory (
            org_id, product_id, size_system, size_label, quantity, updated_at
          ) VALUES ($1, $2, $3, $4, $5, now())
          ON CONFLICT (org_id, product_id, size_system, size_label) DO UPDATE SET
            quantity = EXCLUDED.quantity,
            updated_at = now()
        `,
        [orgId, row.productId, row.sizeSystem, row.sizeLabel, row.quantity],
      );
      upserted += 1;
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return { upserted };
}

export async function upsertBrandFitProfile(input: {
  orgId: string;
  brand: string;
  model?: string;
  euSizeDelta: number;
  toeBoxWidth: string;
  midsoleFeel: string;
  note?: string;
}): Promise<void> {
  await ensureMerchantSchema();
  await getPostgresPool().query(
    `
      INSERT INTO brand_fit_profiles (
        org_id, brand, model, eu_size_delta, toe_box_width, midsole_feel, note, data, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, now())
      ON CONFLICT (org_id, brand, model) DO UPDATE SET
        eu_size_delta = EXCLUDED.eu_size_delta,
        toe_box_width = EXCLUDED.toe_box_width,
        midsole_feel = EXCLUDED.midsole_feel,
        note = EXCLUDED.note,
        data = EXCLUDED.data,
        updated_at = now()
    `,
    [
      input.orgId,
      input.brand,
      input.model ?? "",
      input.euSizeDelta,
      input.toeBoxWidth,
      input.midsoleFeel,
      input.note ?? null,
      JSON.stringify(input),
    ],
  );
}

export async function listBrandFitProfiles(orgId: string): Promise<unknown[]> {
  await ensureMerchantSchema();
  const result = await getPostgresPool().query<{ data: unknown }>(
    `
      SELECT data FROM brand_fit_profiles
      WHERE org_id = $1
      ORDER BY brand, model
    `,
    [orgId],
  );
  return result.rows.map((r) => r.data);
}

export async function recordOutcome(input: {
  orgId: string;
  kind: string;
  productId?: string;
  brand?: string;
  sizeLabel?: string;
  sizeSystem?: string;
  fitId?: string;
  reason?: string;
  data?: Record<string, unknown>;
}): Promise<{ outcomeId: string }> {
  await ensureMerchantSchema();
  const outcomeId = newId("out");
  await getPostgresPool().query(
    `
      INSERT INTO merchant_outcomes (
        outcome_id, org_id, kind, product_id, brand, size_label, size_system, fit_id, reason, data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
    `,
    [
      outcomeId,
      input.orgId,
      input.kind,
      input.productId ?? null,
      input.brand ?? null,
      input.sizeLabel ?? null,
      input.sizeSystem ?? null,
      input.fitId ?? null,
      input.reason ?? null,
      JSON.stringify(input.data ?? {}),
    ],
  );
  return { outcomeId };
}

export async function pilotMetrics(
  orgId: string,
  sinceEpochMs?: number,
): Promise<{
  purchases: number;
  returns: number;
  exchanges: number;
  returnRate: number | null;
  exchangeRate: number | null;
}> {
  await ensureMerchantSchema();
  const since = sinceEpochMs
    ? new Date(sinceEpochMs)
    : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const result = await getPostgresPool().query<{ kind: string; n: string }>(
    `
      SELECT kind, COUNT(*)::text AS n
      FROM merchant_outcomes
      WHERE org_id = $1 AND created_at >= $2
      GROUP BY kind
    `,
    [orgId, since],
  );
  const counts: Record<string, number> = {};
  for (const row of result.rows) {
    counts[row.kind] = Number(row.n);
  }
  const purchases = counts.purchase ?? 0;
  const returns = counts.return ?? 0;
  const exchanges = counts.exchange ?? 0;
  const denom = purchases + returns + exchanges;
  return {
    purchases,
    returns,
    exchanges,
    returnRate: denom > 0 ? returns / denom : null,
    exchangeRate: denom > 0 ? exchanges / denom : null,
  };
}
