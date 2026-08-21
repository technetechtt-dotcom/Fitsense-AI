import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { requireMigrationsApplied } from "./migrate.js";
import { appendAudit, newPlatformId } from "./auditLog.js";

async function ensure(): Promise<void> {
  if (!isPostgresConfigured()) throw new Error("DATABASE_URL is required.");
  await requireMigrationsApplied();
}

const DEFAULT_REGISTER = [
  {
    purpose: "Foot measurement & Fit ID",
    legalBasis: "Consent (POPIA s11)",
    dataCategories: "Biometric-derived foot dimensions (mm), device id, Fit ID",
    recipients: "FitSense operators; retailer only with consent / handoff",
    retention: "See RETENTION.md; user-erasable",
    transfer: "Hosting region per Render/Neon config",
    securityMeasures: "TLS, device auth, audit log, encryption at rest (DB)",
  },
  {
    purpose: "Merchant catalogue & inventory",
    legalBasis: "Contract with retailer (operator agreement)",
    dataCategories: "Product, price, stock, order metadata",
    recipients: "Retailer staff; FitSense support under DPA",
    retention: "Contract term + 12 months analytics aggregates",
    transfer: "As contracted",
    securityMeasures: "API keys, roles, rate limits, audit hash chain",
  },
  {
    purpose: "Billing & subscriptions",
    legalBasis: "Contract",
    dataCategories: "Org billing email, plan, usage metrics, invoices",
    recipients: "Payment processor when Stripe configured",
    retention: "7 years tax/commercial records",
    transfer: "Stripe (if enabled)",
    securityMeasures: "Secret rotation, entitlement checks",
  },
];

export async function seedProcessingRegister(): Promise<{ seeded: number }> {
  await ensure();
  let seeded = 0;
  for (const row of DEFAULT_REGISTER) {
    const entryId = newPlatformId("preg");
    const existing = await getPostgresPool().query(
      `SELECT 1 FROM processing_register WHERE purpose = $1 LIMIT 1`,
      [row.purpose],
    );
    if (existing.rows[0]) continue;
    await getPostgresPool().query(
      `
        INSERT INTO processing_register (
          entry_id, purpose, legal_basis, data_categories, recipients,
          retention, transfer, security_measures
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        entryId,
        row.purpose,
        row.legalBasis,
        row.dataCategories,
        row.recipients,
        row.retention,
        row.transfer,
        row.securityMeasures,
      ],
    );
    seeded += 1;
  }
  return { seeded };
}

export async function listProcessingRegister() {
  await ensure();
  await seedProcessingRegister();
  const result = await getPostgresPool().query(
    `
      SELECT entry_id, purpose, legal_basis, data_categories, recipients,
             retention, transfer, security_measures, updated_at
      FROM processing_register
      ORDER BY purpose
    `,
  );
  return result.rows.map((r) => ({
    entryId: r.entry_id,
    purpose: r.purpose,
    legalBasis: r.legal_basis,
    dataCategories: r.data_categories,
    recipients: r.recipients,
    retention: r.retention,
    transfer: r.transfer,
    securityMeasures: r.security_measures,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}

export async function createDsarRequest(input: {
  type: "access" | "export" | "erasure" | "rectification";
  accountId?: string;
  email?: string;
  deviceId?: string;
  notes?: string;
}): Promise<{ requestId: string }> {
  await ensure();
  const requestId = newPlatformId("dsar");
  await getPostgresPool().query(
    `
      INSERT INTO dsar_requests (
        request_id, account_id, email, device_id, type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      requestId,
      input.accountId ?? null,
      input.email?.trim().toLowerCase() ?? null,
      input.deviceId ?? null,
      input.type,
      input.notes ?? null,
    ],
  );
  await appendAudit({
    actorId: input.deviceId,
    action: "dsar.create",
    resource: requestId,
    detail: { type: input.type },
  });
  return { requestId };
}

export async function updateDsarStatus(input: {
  requestId: string;
  status: "received" | "in_progress" | "completed" | "rejected";
  resultRef?: string;
  notes?: string;
}): Promise<void> {
  await ensure();
  await getPostgresPool().query(
    `
      UPDATE dsar_requests
      SET status = $2,
          result_ref = COALESCE($3, result_ref),
          notes = COALESCE($4, notes),
          completed_at = CASE WHEN $2 IN ('completed', 'rejected') THEN now() ELSE completed_at END
      WHERE request_id = $1
    `,
    [input.requestId, input.status, input.resultRef ?? null, input.notes ?? null],
  );
}

export async function listDsarRequests(limit = 100) {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT request_id, account_id, email, device_id, type, status,
             result_ref, notes, created_at, completed_at
      FROM dsar_requests
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [Math.min(Math.max(limit, 1), 500)],
  );
  return result.rows.map((r) => ({
    requestId: r.request_id,
    accountId: r.account_id,
    email: r.email,
    deviceId: r.device_id,
    type: r.type,
    status: r.status,
    resultRef: r.result_ref,
    notes: r.notes,
    createdAt: (r.created_at as Date).toISOString(),
    completedAt: r.completed_at ? (r.completed_at as Date).toISOString() : null,
  }));
}

export async function createBreachIncident(input: {
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  discoveredAt?: string;
  detail?: Record<string, unknown>;
}): Promise<{ incidentId: string }> {
  await ensure();
  const incidentId = newPlatformId("brch");
  await getPostgresPool().query(
    `
      INSERT INTO breach_incidents (incident_id, title, severity, discovered_at, detail)
      VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()), $5::jsonb)
    `,
    [
      incidentId,
      input.title,
      input.severity,
      input.discoveredAt ?? null,
      JSON.stringify(input.detail ?? {}),
    ],
  );
  await appendAudit({
    action: "breach.create",
    resource: incidentId,
    detail: { severity: input.severity },
  });
  return { incidentId };
}

export async function updateBreachIncident(input: {
  incidentId: string;
  status?: "open" | "contained" | "notified" | "closed";
  notifiedRegulator?: boolean;
  notifiedSubjects?: boolean;
  detail?: Record<string, unknown>;
}): Promise<void> {
  await ensure();
  await getPostgresPool().query(
    `
      UPDATE breach_incidents
      SET status = COALESCE($2, status),
          notified_regulator_at = CASE WHEN $3 THEN now() ELSE notified_regulator_at END,
          notified_subjects_at = CASE WHEN $4 THEN now() ELSE notified_subjects_at END,
          detail = CASE WHEN $5::jsonb IS NULL THEN detail ELSE detail || $5::jsonb END,
          updated_at = now()
      WHERE incident_id = $1
    `,
    [
      input.incidentId,
      input.status ?? null,
      input.notifiedRegulator ?? false,
      input.notifiedSubjects ?? false,
      input.detail ? JSON.stringify(input.detail) : null,
    ],
  );
}

export async function listBreachIncidents() {
  await ensure();
  const result = await getPostgresPool().query(
    `
      SELECT incident_id, title, severity, status, discovered_at,
             notified_regulator_at, notified_subjects_at, created_at
      FROM breach_incidents
      ORDER BY discovered_at DESC
    `,
  );
  return result.rows.map((r) => ({
    incidentId: r.incident_id,
    title: r.title,
    severity: r.severity,
    status: r.status,
    discoveredAt: (r.discovered_at as Date).toISOString(),
    notifiedRegulatorAt: r.notified_regulator_at
      ? (r.notified_regulator_at as Date).toISOString()
      : null,
    notifiedSubjectsAt: r.notified_subjects_at
      ? (r.notified_subjects_at as Date).toISOString()
      : null,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export async function upsertOperatorAgreement(input: {
  agreementId?: string;
  orgId?: string;
  counterparty: string;
  kind: string;
  version: string;
  signedAt?: string;
  documentRef?: string;
}): Promise<{ agreementId: string }> {
  await ensure();
  const agreementId = input.agreementId ?? newPlatformId("agr");
  await getPostgresPool().query(
    `
      INSERT INTO operator_agreements (
        agreement_id, org_id, counterparty, kind, version, signed_at, document_ref
      ) VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7)
      ON CONFLICT (agreement_id) DO UPDATE SET
        counterparty = EXCLUDED.counterparty,
        kind = EXCLUDED.kind,
        version = EXCLUDED.version,
        signed_at = EXCLUDED.signed_at,
        document_ref = EXCLUDED.document_ref
    `,
    [
      agreementId,
      input.orgId ?? null,
      input.counterparty,
      input.kind,
      input.version,
      input.signedAt ?? null,
      input.documentRef ?? null,
    ],
  );
  return { agreementId };
}

export async function verifyRetentionJob(): Promise<{
  ok: boolean;
  checks: Record<string, unknown>;
}> {
  await ensure();
  const tombstones = await getPostgresPool().query(
    `SELECT COUNT(*)::int AS c FROM scan_tombstones`,
  );
  const deletedAccounts = await getPostgresPool().query(
    `SELECT COUNT(*)::int AS c FROM customer_accounts WHERE status = 'deleted'`,
  );
  return {
    ok: true,
    checks: {
      scanTombstones: tombstones.rows[0]?.c ?? 0,
      deletedAccounts: deletedAccounts.rows[0]?.c ?? 0,
      retentionDoc: "docs/ops/RETENTION.md",
      verifiedAt: new Date().toISOString(),
    },
  };
}
