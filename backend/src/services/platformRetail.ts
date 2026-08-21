import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { requireMigrationsApplied } from "./migrate.js";
import { appendAudit, hashToken, mintSecret, newPlatformId } from "./auditLog.js";
import type { OrgRole } from "./merchantStore.js";

async function ensure(): Promise<void> {
  if (!isPostgresConfigured()) throw new Error("DATABASE_URL is required.");
  await requireMigrationsApplied();
}

export type LocationKind = "store" | "warehouse" | "region";

export async function upsertLocation(input: {
  orgId: string;
  locationId?: string;
  code: string;
  name: string;
  kind: LocationKind;
  region?: string;
  parentLocationId?: string;
  timezone?: string;
  data?: Record<string, unknown>;
  actorId?: string;
}): Promise<{ locationId: string }> {
  await ensure();
  const locationId = input.locationId ?? newPlatformId("loc");
  await getPostgresPool().query(
    `
      INSERT INTO merchant_locations (
        location_id, org_id, code, name, kind, region, parent_location_id, timezone, data, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, now())
      ON CONFLICT (location_id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        kind = EXCLUDED.kind,
        region = EXCLUDED.region,
        parent_location_id = EXCLUDED.parent_location_id,
        timezone = EXCLUDED.timezone,
        data = EXCLUDED.data,
        updated_at = now()
    `,
    [
      locationId,
      input.orgId,
      input.code.trim(),
      input.name.trim(),
      input.kind,
      input.region ?? null,
      input.parentLocationId ?? null,
      input.timezone ?? null,
      JSON.stringify(input.data ?? {}),
    ],
  );
  await appendAudit({
    orgId: input.orgId,
    actorId: input.actorId,
    action: "location.upsert",
    resource: locationId,
    detail: { code: input.code, kind: input.kind },
  });
  return { locationId };
}

export async function listLocations(orgId: string): Promise<
  Array<{
    locationId: string;
    code: string;
    name: string;
    kind: LocationKind;
    region: string | null;
    parentLocationId: string | null;
  }>
> {
  await ensure();
  const result = await getPostgresPool().query<{
    location_id: string;
    code: string;
    name: string;
    kind: LocationKind;
    region: string | null;
    parent_location_id: string | null;
  }>(
    `
      SELECT location_id, code, name, kind, region, parent_location_id
      FROM merchant_locations
      WHERE org_id = $1
      ORDER BY kind, name
    `,
    [orgId],
  );
  return result.rows.map((r) => ({
    locationId: r.location_id,
    code: r.code,
    name: r.name,
    kind: r.kind,
    region: r.region,
    parentLocationId: r.parent_location_id,
  }));
}

export async function upsertPrices(
  orgId: string,
  rows: Array<{
    productId: string;
    currency?: string;
    amountCents: number;
    locationId?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
  }>,
): Promise<{ upserted: number }> {
  await ensure();
  const pool = getPostgresPool();
  const client = await pool.connect();
  let upserted = 0;
  try {
    await client.query("BEGIN");
    for (const row of rows) {
      await client.query(
        `
          INSERT INTO merchant_prices (
            org_id, product_id, currency, amount_cents, location_id,
            effective_from, effective_to, updated_at
          ) VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, now()), $7::timestamptz, now())
          ON CONFLICT (org_id, product_id, currency, location_id) DO UPDATE SET
            amount_cents = EXCLUDED.amount_cents,
            effective_from = EXCLUDED.effective_from,
            effective_to = EXCLUDED.effective_to,
            updated_at = now()
        `,
        [
          orgId,
          row.productId,
          (row.currency ?? "ZAR").toUpperCase(),
          row.amountCents,
          row.locationId ?? "default",
          row.effectiveFrom ?? null,
          row.effectiveTo ?? null,
        ],
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

export async function listPrices(orgId: string, locationId?: string) {
  await ensure();
  const params: unknown[] = [orgId];
  let filter = "";
  if (locationId) {
    params.push(locationId);
    filter = ` AND location_id = $${params.length}`;
  }
  const result = await getPostgresPool().query(
    `
      SELECT product_id, currency, amount_cents, location_id, effective_from, effective_to, updated_at
      FROM merchant_prices
      WHERE org_id = $1${filter}
      ORDER BY product_id
    `,
    params,
  );
  return result.rows.map((r) => ({
    productId: r.product_id as string,
    currency: r.currency as string,
    amountCents: r.amount_cents as number,
    locationId: r.location_id as string,
    effectiveFrom: (r.effective_from as Date)?.toISOString?.() ?? null,
    effectiveTo: r.effective_to
      ? ((r.effective_to as Date).toISOString?.() ?? null)
      : null,
  }));
}

export async function upsertPromotion(input: {
  orgId: string;
  promotionId?: string;
  code: string;
  name: string;
  percentOff?: number;
  amountOffCents?: number;
  productIds?: string[];
  locationIds?: string[];
  startsAt: string;
  endsAt: string;
  active?: boolean;
}): Promise<{ promotionId: string }> {
  await ensure();
  const promotionId = input.promotionId ?? newPlatformId("promo");
  await getPostgresPool().query(
    `
      INSERT INTO merchant_promotions (
        promotion_id, org_id, code, name, percent_off, amount_off_cents,
        product_ids, location_ids, starts_at, ends_at, active, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::timestamptz,$10::timestamptz,$11, now())
      ON CONFLICT (promotion_id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        percent_off = EXCLUDED.percent_off,
        amount_off_cents = EXCLUDED.amount_off_cents,
        product_ids = EXCLUDED.product_ids,
        location_ids = EXCLUDED.location_ids,
        starts_at = EXCLUDED.starts_at,
        ends_at = EXCLUDED.ends_at,
        active = EXCLUDED.active,
        updated_at = now()
    `,
    [
      promotionId,
      input.orgId,
      input.code.trim(),
      input.name.trim(),
      input.percentOff ?? null,
      input.amountOffCents ?? null,
      JSON.stringify(input.productIds ?? []),
      JSON.stringify(input.locationIds ?? []),
      input.startsAt,
      input.endsAt,
      input.active ?? true,
    ],
  );
  return { promotionId };
}

export async function listPromotions(orgId: string) {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT promotion_id, code, name, percent_off, amount_off_cents,
             product_ids, location_ids, starts_at, ends_at, active
      FROM merchant_promotions
      WHERE org_id = $1
      ORDER BY starts_at DESC
    `,
    [orgId],
  );
  return result.rows.map((r) => ({
    promotionId: r.promotion_id,
    code: r.code,
    name: r.name,
    percentOff: r.percent_off,
    amountOffCents: r.amount_off_cents,
    productIds: r.product_ids,
    locationIds: r.location_ids,
    startsAt: (r.starts_at as Date).toISOString(),
    endsAt: (r.ends_at as Date).toISOString(),
    active: r.active,
  }));
}

export async function ingestOrder(input: {
  orgId: string;
  externalOrderId: string;
  locationId?: string;
  status?: string;
  currency?: string;
  customerRef?: string;
  fulfillment?: "ship" | "click_and_collect" | "reserve" | "in_store";
  lines: Array<{
    lineId: string;
    productId?: string;
    sku?: string;
    sizeSystem?: string;
    sizeLabel?: string;
    widthLabel?: string;
    quantity?: number;
    unitAmountCents?: number;
    status?: string;
  }>;
  data?: Record<string, unknown>;
  actorId?: string;
}): Promise<{ orderId: string; reused: boolean }> {
  await ensure();
  const existing = await getPostgresPool().query<{ order_id: string }>(
    `
      SELECT order_id FROM merchant_orders
      WHERE org_id = $1 AND external_order_id = $2
      LIMIT 1
    `,
    [input.orgId, input.externalOrderId],
  );
  if (existing.rows[0]) {
    return { orderId: existing.rows[0].order_id, reused: true };
  }
  const orderId = newPlatformId("ord");
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO merchant_orders (
          order_id, org_id, external_order_id, location_id, status, currency,
          customer_ref, fulfillment, data, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb, now())
      `,
      [
        orderId,
        input.orgId,
        input.externalOrderId,
        input.locationId ?? null,
        input.status ?? "open",
        input.currency ?? "ZAR",
        input.customerRef ?? null,
        input.fulfillment ?? null,
        JSON.stringify(input.data ?? {}),
      ],
    );
    for (const line of input.lines) {
      await client.query(
        `
          INSERT INTO merchant_order_lines (
            org_id, order_id, line_id, product_id, sku, size_system, size_label,
            width_label, quantity, unit_amount_cents, status, data
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
        `,
        [
          input.orgId,
          orderId,
          line.lineId,
          line.productId ?? null,
          line.sku ?? null,
          line.sizeSystem ?? null,
          line.sizeLabel ?? null,
          line.widthLabel ?? "standard",
          line.quantity ?? 1,
          line.unitAmountCents ?? null,
          line.status ?? "open",
          JSON.stringify(line),
        ],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  await appendAudit({
    orgId: input.orgId,
    actorId: input.actorId,
    action: "order.ingest",
    resource: orderId,
    detail: { externalOrderId: input.externalOrderId, lines: input.lines.length },
  });
  return { orderId, reused: false };
}

export async function listOrders(orgId: string, limit = 100) {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT order_id, external_order_id, location_id, status, currency,
             customer_ref, fulfillment, created_at, updated_at
      FROM merchant_orders
      WHERE org_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [orgId, Math.min(Math.max(limit, 1), 500)],
  );
  return result.rows.map((r) => ({
    orderId: r.order_id,
    externalOrderId: r.external_order_id,
    locationId: r.location_id,
    status: r.status,
    currency: r.currency,
    customerRef: r.customer_ref,
    fulfillment: r.fulfillment,
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}

export async function createReturn(input: {
  orgId: string;
  orderId: string;
  lineId?: string;
  kind: "return" | "exchange";
  reason?: string;
  status?: string;
  data?: Record<string, unknown>;
}): Promise<{ returnId: string }> {
  await ensure();
  const returnId = newPlatformId("ret");
  await getPostgresPool().query(
    `
      INSERT INTO merchant_returns (
        return_id, org_id, order_id, line_id, kind, reason, status, data, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb, now())
    `,
    [
      returnId,
      input.orgId,
      input.orderId,
      input.lineId ?? null,
      input.kind,
      input.reason ?? null,
      input.status ?? "requested",
      JSON.stringify(input.data ?? {}),
    ],
  );
  return { returnId };
}

export async function listReturns(orgId: string, limit = 100) {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT return_id, order_id, line_id, kind, reason, status, created_at
      FROM merchant_returns
      WHERE org_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [orgId, Math.min(Math.max(limit, 1), 500)],
  );
  return result.rows.map((r) => ({
    returnId: r.return_id,
    orderId: r.order_id,
    lineId: r.line_id,
    kind: r.kind,
    reason: r.reason,
    status: r.status,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export async function runReconciliation(
  orgId: string,
  kind:
    "inventory_orders" | "prices_catalogue" | "outcomes_orders" = "inventory_orders",
): Promise<{ runId: string; summary: Record<string, unknown> }> {
  await ensure();
  const pool = getPostgresPool();
  const [inv, orders, outcomes, prices, products] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS c FROM catalogue_inventory WHERE org_id = $1`, [
      orgId,
    ]),
    pool.query(`SELECT COUNT(*)::int AS c FROM merchant_orders WHERE org_id = $1`, [
      orgId,
    ]),
    pool.query(`SELECT COUNT(*)::int AS c FROM merchant_outcomes WHERE org_id = $1`, [
      orgId,
    ]),
    pool.query(`SELECT COUNT(*)::int AS c FROM merchant_prices WHERE org_id = $1`, [
      orgId,
    ]),
    pool.query(`SELECT COUNT(*)::int AS c FROM catalogue_products WHERE org_id = $1`, [
      orgId,
    ]),
  ]);
  const summary = {
    kind,
    inventoryRows: inv.rows[0]?.c ?? 0,
    orders: orders.rows[0]?.c ?? 0,
    outcomes: outcomes.rows[0]?.c ?? 0,
    prices: prices.rows[0]?.c ?? 0,
    products: products.rows[0]?.c ?? 0,
    generatedAt: new Date().toISOString(),
  };
  const runId = newPlatformId("recon");
  await pool.query(
    `
      INSERT INTO merchant_reconciliation_runs (run_id, org_id, kind, status, summary)
      VALUES ($1, $2, $3, 'completed', $4::jsonb)
    `,
    [runId, orgId, kind, JSON.stringify(summary)],
  );
  return { runId, summary };
}

export async function storeAnalytics(orgId: string, region?: string) {
  await ensure();
  const params: unknown[] = [orgId];
  let locFilter = "";
  if (region?.trim()) {
    params.push(region.trim());
    locFilter = ` AND l.region = $${params.length}`;
  }
  const byStore = await getPostgresPool().query(
    `
      SELECT l.location_id, l.name, l.region, l.kind,
             COALESCE(SUM(i.quantity), 0)::int AS units,
             COUNT(DISTINCT i.product_id)::int AS skus
      FROM merchant_locations l
      LEFT JOIN catalogue_inventory i
        ON i.org_id = l.org_id AND i.location_id = l.location_id
      WHERE l.org_id = $1${locFilter}
      GROUP BY l.location_id, l.name, l.region, l.kind
      ORDER BY units DESC
    `,
    params,
  );
  const orderStats = await getPostgresPool().query(
    `
      SELECT location_id, COUNT(*)::int AS orders,
             COUNT(*) FILTER (WHERE fulfillment = 'click_and_collect')::int AS click_collect,
             COUNT(*) FILTER (WHERE fulfillment = 'reserve')::int AS reserves
      FROM merchant_orders
      WHERE org_id = $1
      GROUP BY location_id
    `,
    [orgId],
  );
  return {
    locations: byStore.rows.map((r) => ({
      locationId: r.location_id,
      name: r.name,
      region: r.region,
      kind: r.kind,
      units: r.units,
      skus: r.skus,
    })),
    ordersByLocation: orderStats.rows.map((r) => ({
      locationId: r.location_id,
      orders: r.orders,
      clickAndCollect: r.click_collect,
      reserves: r.reserves,
    })),
  };
}

export async function createInvitation(input: {
  orgId: string;
  email: string;
  role: OrgRole;
  invitedByDeviceId?: string;
  ttlHours?: number;
}): Promise<{ invitationId: string; token: string; expiresAt: string }> {
  await ensure();
  const invitationId = newPlatformId("inv");
  const token = mintSecret("invite").raw;
  const expiresAt = new Date(
    Date.now() + (input.ttlHours ?? 72) * 60 * 60 * 1000,
  ).toISOString();
  await getPostgresPool().query(
    `
      INSERT INTO merchant_invitations (
        invitation_id, org_id, email, role, token_hash, invited_by_device_id, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz)
    `,
    [
      invitationId,
      input.orgId,
      input.email.trim().toLowerCase(),
      input.role,
      hashToken(token),
      input.invitedByDeviceId ?? null,
      expiresAt,
    ],
  );
  return { invitationId, token, expiresAt };
}

export async function acceptInvitation(input: {
  token: string;
  deviceId: string;
}): Promise<{ orgId: string; role: OrgRole }> {
  await ensure();
  const result = await getPostgresPool().query<{
    invitation_id: string;
    org_id: string;
    role: OrgRole;
    status: string;
    expires_at: Date;
  }>(
    `
      SELECT invitation_id, org_id, role, status, expires_at
      FROM merchant_invitations
      WHERE token_hash = $1
      LIMIT 1
    `,
    [hashToken(input.token)],
  );
  const row = result.rows[0];
  if (!row || row.status !== "pending") {
    throw Object.assign(new Error("invitation_invalid"), { status: 400 });
  }
  if (row.expires_at.getTime() < Date.now()) {
    await getPostgresPool().query(
      `UPDATE merchant_invitations SET status = 'expired' WHERE invitation_id = $1`,
      [row.invitation_id],
    );
    throw Object.assign(new Error("invitation_expired"), { status: 400 });
  }
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO merchant_members (org_id, device_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (org_id, device_id) DO UPDATE SET role = EXCLUDED.role
      `,
      [row.org_id, input.deviceId, row.role],
    );
    await client.query(
      `
        UPDATE merchant_invitations
        SET status = 'accepted', accepted_at = now()
        WHERE invitation_id = $1
      `,
      [row.invitation_id],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return { orgId: row.org_id, role: row.role };
}

export async function listInvitations(orgId: string) {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT invitation_id, email, role, status, expires_at, created_at, accepted_at
      FROM merchant_invitations
      WHERE org_id = $1
      ORDER BY created_at DESC
      LIMIT 200
    `,
    [orgId],
  );
  return result.rows.map((r) => ({
    invitationId: r.invitation_id,
    email: r.email,
    role: r.role,
    status: r.status,
    expiresAt: (r.expires_at as Date).toISOString(),
    createdAt: (r.created_at as Date).toISOString(),
    acceptedAt: r.accepted_at ? (r.accepted_at as Date).toISOString() : null,
  }));
}

export async function recordCredentialRotation(input: {
  orgId: string;
  kind: string;
  actorDeviceId?: string;
  note?: string;
}): Promise<{ rotationId: string }> {
  await ensure();
  const rotationId = newPlatformId("rot");
  await getPostgresPool().query(
    `
      INSERT INTO merchant_credential_rotations (rotation_id, org_id, kind, actor_device_id, note)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      rotationId,
      input.orgId,
      input.kind,
      input.actorDeviceId ?? null,
      input.note ?? null,
    ],
  );
  await appendAudit({
    orgId: input.orgId,
    actorId: input.actorDeviceId,
    action: "credential.rotate",
    resource: rotationId,
    detail: { kind: input.kind },
  });
  return { rotationId };
}

export async function recordIntegrationCheck(input: {
  orgId: string;
  integrationKind: string;
  status: "ok" | "degraded" | "error";
  latencyMs?: number;
  detail?: string;
}): Promise<{ checkId: string }> {
  await ensure();
  const checkId = newPlatformId("chk");
  await getPostgresPool().query(
    `
      INSERT INTO merchant_integration_checks (
        check_id, org_id, integration_kind, status, latency_ms, detail
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      checkId,
      input.orgId,
      input.integrationKind,
      input.status,
      input.latencyMs ?? null,
      input.detail ?? null,
    ],
  );
  return { checkId };
}

export async function listIntegrationHealth(orgId: string) {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT DISTINCT ON (integration_kind)
        check_id, integration_kind, status, latency_ms, detail, checked_at
      FROM merchant_integration_checks
      WHERE org_id = $1
      ORDER BY integration_kind, checked_at DESC
    `,
    [orgId],
  );
  return result.rows.map((r) => ({
    checkId: r.check_id,
    kind: r.integration_kind,
    status: r.status,
    latencyMs: r.latency_ms,
    detail: r.detail,
    checkedAt: (r.checked_at as Date).toISOString(),
  }));
}

/** CSV parse helper for catalogue / inventory / price fallbacks. */
export function parseCsvTable(csv: string): string[][] {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (ch === "," && !inQuotes) {
          cells.push(cur.trim());
          cur = "";
          continue;
        }
        cur += ch;
      }
      cells.push(cur.trim());
      return cells;
    });
}
