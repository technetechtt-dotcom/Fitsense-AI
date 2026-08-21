import { createHmac } from "node:crypto";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { requireMigrationsApplied } from "./migrate.js";
import { appendAudit, mintSecret, newPlatformId } from "./auditLog.js";

async function ensure(): Promise<void> {
  if (!isPostgresConfigured()) throw new Error("DATABASE_URL is required.");
  await requireMigrationsApplied();
}

const MAX_ATTEMPTS = 8;
const BASE_DELAY_MS = 30_000;

export async function createWebhookEndpoint(input: {
  orgId: string;
  url: string;
  events: string[];
  actorId?: string;
}): Promise<{ endpointId: string; secret: string }> {
  await ensure();
  const endpointId = newPlatformId("wh");
  const secret = mintSecret("whsec");
  await getPostgresPool().query(
    `
      INSERT INTO merchant_webhook_endpoints (
        endpoint_id, org_id, url, secret_hash, secret_prefix, signing_secret, events, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, now())
    `,
    [
      endpointId,
      input.orgId,
      input.url.trim(),
      secret.hash,
      secret.prefix,
      secret.raw,
      JSON.stringify(input.events),
    ],
  );
  await appendAudit({
    orgId: input.orgId,
    actorId: input.actorId,
    action: "webhook.create",
    resource: endpointId,
  });
  return { endpointId, secret: secret.raw };
}

export async function listWebhookEndpoints(orgId: string) {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT endpoint_id, url, secret_prefix, events, active, created_at
      FROM merchant_webhook_endpoints
      WHERE org_id = $1
      ORDER BY created_at DESC
    `,
    [orgId],
  );
  return result.rows.map((r) => ({
    endpointId: r.endpoint_id,
    url: r.url,
    secretPrefix: r.secret_prefix,
    events: r.events,
    active: r.active,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export async function enqueueWebhookEvent(input: {
  orgId: string;
  eventType: string;
  payload: Record<string, unknown>;
}): Promise<{ enqueued: number }> {
  await ensure();
  const endpoints = await getPostgresPool().query<{
    endpoint_id: string;
    events: unknown;
  }>(
    `
      SELECT endpoint_id, events FROM merchant_webhook_endpoints
      WHERE org_id = $1 AND active = true
    `,
    [input.orgId],
  );
  let enqueued = 0;
  for (const ep of endpoints.rows) {
    const events = Array.isArray(ep.events) ? (ep.events as string[]) : [];
    if (events.length && !events.includes(input.eventType) && !events.includes("*")) {
      continue;
    }
    const deliveryId = newPlatformId("whd");
    await getPostgresPool().query(
      `
        INSERT INTO merchant_webhook_deliveries (
          delivery_id, endpoint_id, org_id, event_type, payload, status, next_attempt_at
        ) VALUES ($1, $2, $3, $4, $5::jsonb, 'pending', now())
      `,
      [
        deliveryId,
        ep.endpoint_id,
        input.orgId,
        input.eventType,
        JSON.stringify({
          id: deliveryId,
          type: input.eventType,
          createdAt: new Date().toISOString(),
          data: input.payload,
        }),
      ],
    );
    enqueued += 1;
  }
  return { enqueued };
}

function signBody(secret: string, body: string, timestamp: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

/**
 * Process due webhook deliveries. Retries with exponential backoff; dead-letters after MAX_ATTEMPTS.
 * Merchants verify: HMAC-SHA256(`${timestamp}.${body}`, webhook_secret) as `v1=<hex>`.
 */
export async function processWebhookDeliveries(limit = 25): Promise<{
  processed: number;
  delivered: number;
  deadLetter: number;
}> {
  await ensure();
  const due = await getPostgresPool().query<{
    delivery_id: string;
    endpoint_id: string;
    org_id: string;
    event_type: string;
    payload: unknown;
    attempts: number;
    url: string;
    signing_secret: string;
  }>(
    `
      SELECT d.delivery_id, d.endpoint_id, d.org_id, d.event_type, d.payload, d.attempts,
             e.url, e.signing_secret
      FROM merchant_webhook_deliveries d
      JOIN merchant_webhook_endpoints e ON e.endpoint_id = d.endpoint_id
      WHERE d.status IN ('pending', 'retrying')
        AND d.next_attempt_at <= now()
        AND e.active = true
      ORDER BY d.next_attempt_at ASC
      LIMIT $1
    `,
    [limit],
  );

  let delivered = 0;
  let deadLetter = 0;
  for (const row of due.rows) {
    const body = JSON.stringify(row.payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = signBody(row.signing_secret, body, timestamp);
    let statusCode: number | null = null;
    let error: string | null = null;
    let ok = false;
    try {
      const res = await fetch(row.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FitSense-Timestamp": timestamp,
          "X-FitSense-Signature": `v1=${signature}`,
          "X-FitSense-Event": row.event_type,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      statusCode = res.status;
      ok = res.status >= 200 && res.status < 300;
      if (!ok) error = `http_${res.status}`;
    } catch (err) {
      error = err instanceof Error ? err.message : "fetch_failed";
    }

    const attempts = row.attempts + 1;
    if (ok) {
      await getPostgresPool().query(
        `
          UPDATE merchant_webhook_deliveries
          SET status = 'delivered', attempts = $2, last_status_code = $3,
              last_error = NULL, updated_at = now()
          WHERE delivery_id = $1
        `,
        [row.delivery_id, attempts, statusCode],
      );
      delivered += 1;
    } else if (attempts >= MAX_ATTEMPTS) {
      await getPostgresPool().query(
        `
          UPDATE merchant_webhook_deliveries
          SET status = 'dead_letter', attempts = $2, last_status_code = $3,
              last_error = $4, updated_at = now()
          WHERE delivery_id = $1
        `,
        [row.delivery_id, attempts, statusCode, error],
      );
      deadLetter += 1;
    } else {
      const delay = BASE_DELAY_MS * 2 ** Math.min(attempts - 1, 6);
      await getPostgresPool().query(
        `
          UPDATE merchant_webhook_deliveries
          SET status = 'retrying', attempts = $2, last_status_code = $3,
              last_error = $4, next_attempt_at = now() + ($5 || ' milliseconds')::interval,
              updated_at = now()
          WHERE delivery_id = $1
        `,
        [row.delivery_id, attempts, statusCode, error, String(delay)],
      );
    }
  }
  return { processed: due.rows.length, delivered, deadLetter };
}

export async function listWebhookDeliveries(
  orgId: string,
  opts: { deadLetterOnly?: boolean; limit?: number } = {},
) {
  await ensure();
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const filter = opts.deadLetterOnly ? ` AND status = 'dead_letter'` : "";
  const result = await getPostgresPool().query(
    `
      SELECT delivery_id, endpoint_id, event_type, status, attempts,
             last_status_code, last_error, next_attempt_at, created_at
      FROM merchant_webhook_deliveries
      WHERE org_id = $1${filter}
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [orgId, limit],
  );
  return result.rows.map((r) => ({
    deliveryId: r.delivery_id,
    endpointId: r.endpoint_id,
    eventType: r.event_type,
    status: r.status,
    attempts: r.attempts,
    lastStatusCode: r.last_status_code,
    lastError: r.last_error,
    nextAttemptAt: (r.next_attempt_at as Date).toISOString(),
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export async function retryDeadLetter(
  deliveryId: string,
  orgId: string,
): Promise<boolean> {
  await ensure();
  const result = await getPostgresPool().query(
    `
      UPDATE merchant_webhook_deliveries
      SET status = 'pending', next_attempt_at = now(), updated_at = now()
      WHERE delivery_id = $1 AND org_id = $2 AND status = 'dead_letter'
    `,
    [deliveryId, orgId],
  );
  return (result.rowCount ?? 0) > 0;
}

/** Exported for tests — merchant-side signature check. */
export function verifyWebhookSignature(opts: {
  secret: string;
  timestamp: string;
  body: string;
  signatureHeader: string;
}): boolean {
  const expected = `v1=${signBody(opts.secret, opts.body, opts.timestamp)}`;
  return opts.signatureHeader === expected;
}
