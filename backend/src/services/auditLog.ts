import { createHash, randomBytes } from "node:crypto";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { requireMigrationsApplied } from "./migrate.js";

async function ensure(): Promise<void> {
  if (!isPostgresConfigured()) {
    throw new Error("DATABASE_URL is required.");
  }
  await requireMigrationsApplied();
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Append-only audit entry with hash chain for tamper evidence. */
export async function appendAudit(input: {
  orgId?: string | null;
  actorId?: string | null;
  action: string;
  resource?: string | null;
  detail?: Record<string, unknown>;
}): Promise<{ seq: number; entryHash: string }> {
  await ensure();
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const prev = await client.query<{ entry_hash: string }>(
      `SELECT entry_hash FROM audit_log ORDER BY seq DESC LIMIT 1 FOR UPDATE`,
    );
    const prevHash = prev.rows[0]?.entry_hash ?? "genesis";
    const detail = input.detail ?? {};
    const material = [
      prevHash,
      input.orgId ?? "",
      input.actorId ?? "",
      input.action,
      input.resource ?? "",
      JSON.stringify(detail),
      Date.now().toString(),
    ].join("|");
    const entryHash = sha256Hex(material);
    const inserted = await client.query<{ seq: string }>(
      `
        INSERT INTO audit_log (org_id, actor_id, action, resource, detail, prev_hash, entry_hash)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
        RETURNING seq
      `,
      [
        input.orgId ?? null,
        input.actorId ?? null,
        input.action,
        input.resource ?? null,
        JSON.stringify(detail),
        prevHash,
        entryHash,
      ],
    );
    await client.query("COMMIT");
    return { seq: Number(inserted.rows[0].seq), entryHash };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Verify contiguous hash chain; returns first break index or null if intact. */
export async function verifyAuditChain(limit = 10_000): Promise<{
  ok: boolean;
  checked: number;
  breakAt: number | null;
}> {
  await ensure();
  const result = await getPostgresPool().query<{
    seq: string;
    prev_hash: string | null;
    entry_hash: string;
    org_id: string | null;
    actor_id: string | null;
    action: string;
    resource: string | null;
    detail: unknown;
    created_at: Date;
  }>(
    `
      SELECT seq, prev_hash, entry_hash, org_id, actor_id, action, resource, detail, created_at
      FROM audit_log
      ORDER BY seq ASC
      LIMIT $1
    `,
    [limit],
  );
  let expectedPrev = "genesis";
  for (const row of result.rows) {
    if ((row.prev_hash ?? "genesis") !== expectedPrev) {
      return { ok: false, checked: result.rows.length, breakAt: Number(row.seq) };
    }
    expectedPrev = row.entry_hash;
  }
  return { ok: true, checked: result.rows.length, breakAt: null };
}

export function newPlatformId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("base64url")}`;
}

export function hashToken(raw: string): string {
  return sha256Hex(raw);
}

export function mintSecret(prefix: string): {
  raw: string;
  hash: string;
  prefix: string;
} {
  const raw = `${prefix}_${randomBytes(24).toString("base64url")}`;
  return { raw, hash: sha256Hex(raw), prefix: raw.slice(0, 12) };
}
