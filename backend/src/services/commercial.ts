import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { requireMigrationsApplied } from "./migrate.js";
import { appendAudit, newPlatformId } from "./auditLog.js";

async function ensure(): Promise<void> {
  if (!isPostgresConfigured()) throw new Error("DATABASE_URL is required.");
  await requireMigrationsApplied();
}

function periodKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function recordUsage(input: {
  orgId: string;
  metric: string;
  quantity?: number;
  data?: Record<string, unknown>;
}): Promise<{ eventId: string; periodKey: string }> {
  await ensure();
  const eventId = newPlatformId("usage");
  const pk = periodKey();
  await getPostgresPool().query(
    `
      INSERT INTO merchant_usage_events (
        event_id, org_id, metric, quantity, period_key, data
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [
      eventId,
      input.orgId,
      input.metric,
      input.quantity ?? 1,
      pk,
      JSON.stringify(input.data ?? {}),
    ],
  );
  return { eventId, periodKey: pk };
}

export async function usageSummary(orgId: string, period?: string) {
  await ensure();
  const pk = period ?? periodKey();
  const result = await getPostgresPool().query(
    `
      SELECT metric, SUM(quantity)::float AS quantity, COUNT(*)::int AS events
      FROM merchant_usage_events
      WHERE org_id = $1 AND period_key = $2
      GROUP BY metric
      ORDER BY metric
    `,
    [orgId, pk],
  );
  return {
    periodKey: pk,
    metrics: result.rows.map((r) => ({
      metric: r.metric,
      quantity: r.quantity,
      events: r.events,
    })),
  };
}

/** Entitlement gate — returns whether org may use a feature under current plan. */
export async function checkEntitlement(
  orgId: string,
  feature: string,
): Promise<{ allowed: boolean; plan: string; reason?: string }> {
  await ensure();
  const result = await getPostgresPool().query<{
    plan: string;
    status: string;
    entitlement_json: Record<string, unknown> | null;
  }>(
    `
      SELECT plan, status, entitlement_json
      FROM merchant_billing
      WHERE org_id = $1
      LIMIT 1
    `,
    [orgId],
  );
  const row = result.rows[0];
  if (!row) {
    return { allowed: false, plan: "none", reason: "no_billing_record" };
  }
  if (
    row.status === "canceled" ||
    row.status === "cancelled" ||
    row.status === "unpaid"
  ) {
    return { allowed: false, plan: row.plan, reason: `status_${row.status}` };
  }
  const entitlements = row.entitlement_json ?? {};
  if (feature in entitlements) {
    return {
      allowed: Boolean(entitlements[feature]),
      plan: row.plan,
      reason: entitlements[feature] ? undefined : "feature_disabled",
    };
  }
  // Default pilot/trialing: core features allowed
  const pilotDefaults = new Set([
    "catalogue",
    "inventory",
    "outcomes",
    "webhooks",
    "reservations",
    "analytics",
  ]);
  if (row.plan === "pilot" || row.status === "trialing") {
    return {
      allowed: pilotDefaults.has(feature) || feature === "support",
      plan: row.plan,
    };
  }
  return { allowed: true, plan: row.plan };
}

export async function generateInvoice(
  orgId: string,
  opts: { periodKey?: string; amountCents?: number } = {},
): Promise<{ invoiceId: string; amountCents: number; periodKey: string }> {
  await ensure();
  const pk = opts.periodKey ?? periodKey();
  const usage = await usageSummary(orgId, pk);
  const scans = usage.metrics.find((m) => m.metric === "scan_sync")?.quantity ?? 0;
  const amountCents = opts.amountCents ?? Math.max(0, Math.round(Number(scans) * 10)); // R0.10 per metered unit scaffold
  const invoiceId = newPlatformId("inv");
  await getPostgresPool().query(
    `
      INSERT INTO merchant_invoices (
        invoice_id, org_id, period_key, amount_cents, status, line_items
      ) VALUES ($1, $2, $3, $4, 'open', $5::jsonb)
      ON CONFLICT (org_id, period_key) DO UPDATE SET
        amount_cents = EXCLUDED.amount_cents,
        line_items = EXCLUDED.line_items,
        status = 'open'
      RETURNING invoice_id
    `,
    [
      invoiceId,
      orgId,
      pk,
      amountCents,
      JSON.stringify([
        { metric: "usage", periodKey: pk, amountCents, usage: usage.metrics },
      ]),
    ],
  );
  return { invoiceId, amountCents, periodKey: pk };
}

export async function reconcilePayment(input: {
  orgId: string;
  periodKey: string;
  externalRef: string;
  amountCents: number;
}): Promise<{ invoiceId: string; status: string }> {
  await ensure();
  const result = await getPostgresPool().query<{ invoice_id: string }>(
    `
      UPDATE merchant_invoices
      SET status = 'paid', paid_at = now(), external_ref = $3,
          amount_cents = $4
      WHERE org_id = $1 AND period_key = $2
      RETURNING invoice_id
    `,
    [input.orgId, input.periodKey, input.externalRef, input.amountCents],
  );
  if (!result.rows[0]) {
    const created = await generateInvoice(input.orgId, {
      periodKey: input.periodKey,
      amountCents: input.amountCents,
    });
    await getPostgresPool().query(
      `
        UPDATE merchant_invoices
        SET status = 'paid', paid_at = now(), external_ref = $2
        WHERE invoice_id = $1
      `,
      [created.invoiceId, input.externalRef],
    );
    return { invoiceId: created.invoiceId, status: "paid" };
  }
  await appendAudit({
    orgId: input.orgId,
    action: "invoice.paid",
    resource: result.rows[0].invoice_id,
    detail: { externalRef: input.externalRef },
  });
  return { invoiceId: result.rows[0].invoice_id, status: "paid" };
}

export async function listInvoices(orgId: string) {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT invoice_id, period_key, currency, amount_cents, status,
             external_ref, created_at, paid_at
      FROM merchant_invoices
      WHERE org_id = $1
      ORDER BY created_at DESC
    `,
    [orgId],
  );
  return result.rows.map((r) => ({
    invoiceId: r.invoice_id,
    periodKey: r.period_key,
    currency: r.currency,
    amountCents: r.amount_cents,
    status: r.status,
    externalRef: r.external_ref,
    createdAt: (r.created_at as Date).toISOString(),
    paidAt: r.paid_at ? (r.paid_at as Date).toISOString() : null,
  }));
}

const SLA_HOURS: Record<string, number> = {
  low: 72,
  normal: 24,
  high: 8,
  urgent: 2,
};

export async function createSupportTicket(input: {
  orgId?: string;
  accountId?: string;
  subject: string;
  body: string;
  priority?: "low" | "normal" | "high" | "urgent";
}): Promise<{ ticketId: string; slaDueAt: string }> {
  await ensure();
  const priority = input.priority ?? "normal";
  const ticketId = newPlatformId("tkt");
  const slaDueAt = new Date(
    Date.now() + (SLA_HOURS[priority] ?? 24) * 60 * 60 * 1000,
  ).toISOString();
  await getPostgresPool().query(
    `
      INSERT INTO support_tickets (
        ticket_id, org_id, account_id, subject, body, priority, sla_due_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, now())
    `,
    [
      ticketId,
      input.orgId ?? null,
      input.accountId ?? null,
      input.subject.trim(),
      input.body.trim(),
      priority,
      slaDueAt,
    ],
  );
  await getPostgresPool().query(
    `
      INSERT INTO support_ticket_events (event_id, ticket_id, kind, note, actor)
      VALUES ($1, $2, 'created', $3, 'system')
    `,
    [newPlatformId("tke"), ticketId, `priority=${priority}`],
  );
  return { ticketId, slaDueAt };
}

export async function escalateTicket(ticketId: string, note?: string): Promise<void> {
  await ensure();
  await getPostgresPool().query(
    `
      UPDATE support_tickets
      SET status = 'escalated', escalated_at = now(), updated_at = now()
      WHERE ticket_id = $1
    `,
    [ticketId],
  );
  await getPostgresPool().query(
    `
      INSERT INTO support_ticket_events (event_id, ticket_id, kind, note, actor)
      VALUES ($1, $2, 'escalated', $3, 'system')
    `,
    [newPlatformId("tke"), ticketId, note ?? null],
  );
}

export async function resolveTicket(ticketId: string, note?: string): Promise<void> {
  await ensure();
  await getPostgresPool().query(
    `
      UPDATE support_tickets
      SET status = 'resolved', resolved_at = now(), updated_at = now()
      WHERE ticket_id = $1
    `,
    [ticketId],
  );
  await getPostgresPool().query(
    `
      INSERT INTO support_ticket_events (event_id, ticket_id, kind, note, actor)
      VALUES ($1, $2, 'resolved', $3, 'system')
    `,
    [newPlatformId("tke"), ticketId, note ?? null],
  );
}

export async function listTickets(orgId?: string) {
  await ensure();
  const result = orgId
    ? await getPostgresPool().query(
        `
          SELECT ticket_id, org_id, subject, priority, status, sla_due_at,
                 escalated_at, resolved_at, created_at
          FROM support_tickets
          WHERE org_id = $1
          ORDER BY created_at DESC
          LIMIT 200
        `,
        [orgId],
      )
    : await getPostgresPool().query(
        `
          SELECT ticket_id, org_id, subject, priority, status, sla_due_at,
                 escalated_at, resolved_at, created_at
          FROM support_tickets
          ORDER BY created_at DESC
          LIMIT 200
        `,
      );
  return result.rows.map((r) => ({
    ticketId: r.ticket_id,
    orgId: r.org_id,
    subject: r.subject,
    priority: r.priority,
    status: r.status,
    slaDueAt: r.sla_due_at ? (r.sla_due_at as Date).toISOString() : null,
    escalatedAt: r.escalated_at ? (r.escalated_at as Date).toISOString() : null,
    resolvedAt: r.resolved_at ? (r.resolved_at as Date).toISOString() : null,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export async function slaReport(orgId: string) {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
        COUNT(*) FILTER (
          WHERE resolved_at IS NOT NULL AND sla_due_at IS NOT NULL
            AND resolved_at <= sla_due_at
        )::int AS within_sla,
        COUNT(*) FILTER (
          WHERE status IN ('open', 'pending', 'escalated')
            AND sla_due_at < now()
        )::int AS breached_open
      FROM support_tickets
      WHERE org_id = $1
    `,
    [orgId],
  );
  const row = result.rows[0];
  const resolved = row?.resolved ?? 0;
  const within = row?.within_sla ?? 0;
  return {
    total: row?.total ?? 0,
    resolved,
    withinSla: within,
    breachedOpen: row?.breached_open ?? 0,
    slaAttainmentPct: resolved > 0 ? Math.round((within / resolved) * 1000) / 10 : null,
  };
}

export async function upsertCertification(input: {
  orgId: string;
  connector: string;
  status?: "pending" | "in_review" | "certified" | "revoked";
  checklist?: Record<string, unknown>;
}): Promise<{ certId: string }> {
  await ensure();
  const existing = await getPostgresPool().query<{ cert_id: string }>(
    `
      SELECT cert_id FROM integration_certifications
      WHERE org_id = $1 AND connector = $2
      LIMIT 1
    `,
    [input.orgId, input.connector],
  );
  const certId = existing.rows[0]?.cert_id ?? newPlatformId("cert");
  await getPostgresPool().query(
    `
      INSERT INTO integration_certifications (
        cert_id, org_id, connector, status, checklist, certified_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb,
        CASE WHEN $4 = 'certified' THEN now() ELSE NULL END)
      ON CONFLICT (org_id, connector) DO UPDATE SET
        status = EXCLUDED.status,
        checklist = EXCLUDED.checklist,
        certified_at = CASE
          WHEN EXCLUDED.status = 'certified' THEN COALESCE(integration_certifications.certified_at, now())
          ELSE NULL
        END
    `,
    [
      certId,
      input.orgId,
      input.connector,
      input.status ?? "pending",
      JSON.stringify(input.checklist ?? {}),
    ],
  );
  return { certId };
}

export async function upsertPilotContract(input: {
  orgId: string;
  contractId?: string;
  title: string;
  successCriteria: unknown[];
  pricingNotes?: string;
  status?: "draft" | "active" | "completed" | "cancelled";
  startsAt?: string;
  endsAt?: string;
}): Promise<{ contractId: string }> {
  await ensure();
  const contractId = input.contractId ?? newPlatformId("pilot");
  await getPostgresPool().query(
    `
      INSERT INTO pilot_contracts (
        contract_id, org_id, title, success_criteria, pricing_notes, status,
        starts_at, ends_at
      ) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7::timestamptz,$8::timestamptz)
      ON CONFLICT (contract_id) DO UPDATE SET
        title = EXCLUDED.title,
        success_criteria = EXCLUDED.success_criteria,
        pricing_notes = EXCLUDED.pricing_notes,
        status = EXCLUDED.status,
        starts_at = EXCLUDED.starts_at,
        ends_at = EXCLUDED.ends_at
    `,
    [
      contractId,
      input.orgId,
      input.title,
      JSON.stringify(input.successCriteria),
      input.pricingNotes ?? null,
      input.status ?? "draft",
      input.startsAt ?? null,
      input.endsAt ?? null,
    ],
  );
  return { contractId };
}

export async function advanceOnboarding(
  orgId: string,
  step: string,
): Promise<{ onboardingStep: string }> {
  await ensure();
  await getPostgresPool().query(
    `
      UPDATE merchant_billing
      SET onboarding_step = $2, updated_at = now()
      WHERE org_id = $1
    `,
    [orgId, step],
  );
  await appendAudit({
    orgId,
    action: "onboarding.step",
    detail: { step },
  });
  return { onboardingStep: step };
}
