import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { HandoffPayload } from "../types.js";
import { config } from "../config.js";
import { getPostgresPool, withPostgresSchemaLock } from "./postgres.js";
import { sha256Hex, timingSafeEqualString } from "./sessionAuth.js";

export type HandoffOp = "publish" | "consume";

export interface HandoffStore {
  createSession(input: {
    sessionId: string;
    publishTokenHash: string;
    consumeTokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  publish(
    sessionId: string,
    publishTokenHash: string,
    payload: HandoffPayload,
  ): Promise<"stored" | "exists" | "unauthorized" | "expired" | "missing">;
  consume(
    sessionId: string,
    consumeTokenHash: string,
  ): Promise<
    | HandoffPayload
    | "unauthorized"
    | "expired"
    | "missing"
    | "pending"
    | "already_consumed"
  >;
  cancel(
    sessionId: string,
    consumeTokenHash: string,
  ): Promise<"cancelled" | "unauthorized" | "expired" | "missing">;
}

function getHandoffSecret(): string {
  const secret = config.handoffSecret;
  if (!secret) throw new Error("HANDOFF_SECRET is not configured");
  return secret;
}

export function generateHandoffSessionId(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(24);
  let out = "";
  for (let i = 0; i < 24; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export function issueHandoffOpToken(sessionId: string, op: HandoffOp): string {
  const secret = getHandoffSecret();
  const payload = {
    sessionId,
    op,
    exp: Date.now() + config.handoffTtlMs,
    kid: config.handoffKid,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyHandoffOpToken(
  token: string,
  sessionId: string,
  op: HandoffOp,
): boolean {
  const secret = config.handoffSecret;
  if (!secret) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      sessionId?: string;
      op?: string;
      exp?: number;
    };
    return (
      payload.sessionId === sessionId &&
      payload.op === op &&
      Number.isFinite(payload.exp) &&
      (payload.exp ?? 0) > Date.now()
    );
  } catch {
    return false;
  }
}

export function mintHandoffSessionTokens(sessionId: string): {
  publishToken: string;
  consumeToken: string;
  publishTokenHash: string;
  consumeTokenHash: string;
  expiresAt: Date;
} {
  const publishToken = issueHandoffOpToken(sessionId, "publish");
  const consumeToken = issueHandoffOpToken(sessionId, "consume");
  return {
    publishToken,
    consumeToken,
    publishTokenHash: sha256Hex(publishToken),
    consumeTokenHash: sha256Hex(consumeToken),
    expiresAt: new Date(Date.now() + config.handoffTtlMs),
  };
}

interface MemorySession {
  publishTokenHash: string;
  consumeTokenHash: string;
  payload: HandoffPayload | null;
  expiresAt: number;
  consumedAt: number | null;
  cancelledAt: number | null;
}

export class MemoryHandoffStore implements HandoffStore {
  private readonly sessions = new Map<string, MemorySession>();

  constructor(_ttlMs?: number) {}

  prune(): void {
    const now = Date.now();
    for (const [id, entry] of this.sessions) {
      if (entry.expiresAt <= now) this.sessions.delete(id);
    }
  }

  async createSession(input: {
    sessionId: string;
    publishTokenHash: string;
    consumeTokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    this.prune();
    this.sessions.set(input.sessionId, {
      publishTokenHash: input.publishTokenHash,
      consumeTokenHash: input.consumeTokenHash,
      payload: null,
      expiresAt: input.expiresAt.getTime(),
      consumedAt: null,
      cancelledAt: null,
    });
  }

  async publish(
    sessionId: string,
    publishTokenHash: string,
    payload: HandoffPayload,
  ): Promise<"stored" | "exists" | "unauthorized" | "expired" | "missing"> {
    this.prune();
    const entry = this.sessions.get(sessionId);
    if (!entry) return "missing";
    if (entry.expiresAt <= Date.now() || entry.cancelledAt) return "expired";
    if (!timingSafeEqualString(entry.publishTokenHash, publishTokenHash)) {
      return "unauthorized";
    }
    if (entry.payload) return "exists";
    entry.payload = payload;
    return "stored";
  }

  async consume(
    sessionId: string,
    consumeTokenHash: string,
  ): Promise<
    | HandoffPayload
    | "unauthorized"
    | "expired"
    | "missing"
    | "pending"
    | "already_consumed"
  > {
    this.prune();
    const entry = this.sessions.get(sessionId);
    if (!entry) return "missing";
    if (entry.expiresAt <= Date.now() || entry.cancelledAt) return "expired";
    if (!timingSafeEqualString(entry.consumeTokenHash, consumeTokenHash)) {
      return "unauthorized";
    }
    if (entry.consumedAt) return "already_consumed";
    if (!entry.payload) return "pending";
    entry.consumedAt = Date.now();
    const payload = entry.payload;
    this.sessions.delete(sessionId);
    return payload;
  }

  async cancel(
    sessionId: string,
    consumeTokenHash: string,
  ): Promise<"cancelled" | "unauthorized" | "expired" | "missing"> {
    this.prune();
    const entry = this.sessions.get(sessionId);
    if (!entry) return "missing";
    if (entry.expiresAt <= Date.now()) return "expired";
    if (!timingSafeEqualString(entry.consumeTokenHash, consumeTokenHash)) {
      return "unauthorized";
    }
    entry.cancelledAt = Date.now();
    this.sessions.delete(sessionId);
    return "cancelled";
  }
}

export class PostgresHandoffStore implements HandoffStore {
  private schemaReady: Promise<void> | null = null;

  constructor(_ttlMs?: number) {}

  async createSession(input: {
    sessionId: string;
    publishTokenHash: string;
    consumeTokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.ensureSchema();
    await this.prune();
    await getPostgresPool().query(
      `
        INSERT INTO handoff_sessions (
          session_id, publish_token_hash, consume_token_hash, expires_at
        ) VALUES ($1, $2, $3, $4)
      `,
      [
        input.sessionId,
        input.publishTokenHash,
        input.consumeTokenHash,
        input.expiresAt,
      ],
    );
  }

  async publish(
    sessionId: string,
    publishTokenHash: string,
    payload: HandoffPayload,
  ): Promise<"stored" | "exists" | "unauthorized" | "expired" | "missing"> {
    await this.ensureSchema();
    await this.prune();
    const existing = await getPostgresPool().query<{
      publish_token_hash: string;
      payload: HandoffPayload | null;
      cancelled_at: Date | null;
      expires_at: Date;
    }>(
      `
        SELECT publish_token_hash, payload, cancelled_at, expires_at
        FROM handoff_sessions
        WHERE session_id = $1
      `,
      [sessionId],
    );
    const row = existing.rows[0];
    if (!row) return "missing";
    if (row.cancelled_at || row.expires_at.getTime() <= Date.now()) return "expired";
    if (!timingSafeEqualString(row.publish_token_hash, publishTokenHash)) {
      return "unauthorized";
    }
    if (row.payload) return "exists";
    const result = await getPostgresPool().query(
      `
        UPDATE handoff_sessions
        SET payload = $2::jsonb
        WHERE session_id = $1 AND payload IS NULL
      `,
      [sessionId, JSON.stringify(payload)],
    );
    return result.rowCount === 1 ? "stored" : "exists";
  }

  async consume(
    sessionId: string,
    consumeTokenHash: string,
  ): Promise<
    | HandoffPayload
    | "unauthorized"
    | "expired"
    | "missing"
    | "pending"
    | "already_consumed"
  > {
    await this.ensureSchema();
    await this.prune();
    const existing = await getPostgresPool().query<{
      consume_token_hash: string;
      payload: HandoffPayload | null;
      consumed_at: Date | null;
      cancelled_at: Date | null;
      expires_at: Date;
    }>(
      `
        SELECT consume_token_hash, payload, consumed_at, cancelled_at, expires_at
        FROM handoff_sessions
        WHERE session_id = $1
      `,
      [sessionId],
    );
    const row = existing.rows[0];
    if (!row) return "missing";
    if (row.cancelled_at || row.expires_at.getTime() <= Date.now()) return "expired";
    if (!timingSafeEqualString(row.consume_token_hash, consumeTokenHash)) {
      return "unauthorized";
    }
    if (row.consumed_at) return "already_consumed";
    if (!row.payload) return "pending";

    const consumed = await getPostgresPool().query<{ payload: HandoffPayload }>(
      `
        UPDATE handoff_sessions
        SET consumed_at = now()
        WHERE session_id = $1
          AND consume_token_hash = $2
          AND consumed_at IS NULL
          AND cancelled_at IS NULL
          AND expires_at > now()
          AND payload IS NOT NULL
        RETURNING payload
      `,
      [sessionId, consumeTokenHash],
    );
    if (!consumed.rows[0]?.payload) return "already_consumed";
    await getPostgresPool().query(
      "DELETE FROM handoff_sessions WHERE session_id = $1",
      [sessionId],
    );
    return consumed.rows[0].payload;
  }

  async cancel(
    sessionId: string,
    consumeTokenHash: string,
  ): Promise<"cancelled" | "unauthorized" | "expired" | "missing"> {
    await this.ensureSchema();
    const existing = await getPostgresPool().query<{
      consume_token_hash: string;
      expires_at: Date;
    }>(
      `SELECT consume_token_hash, expires_at FROM handoff_sessions WHERE session_id = $1`,
      [sessionId],
    );
    const row = existing.rows[0];
    if (!row) return "missing";
    if (row.expires_at.getTime() <= Date.now()) return "expired";
    if (!timingSafeEqualString(row.consume_token_hash, consumeTokenHash)) {
      return "unauthorized";
    }
    await getPostgresPool().query(
      "DELETE FROM handoff_sessions WHERE session_id = $1",
      [sessionId],
    );
    return "cancelled";
  }

  private async prune(): Promise<void> {
    await getPostgresPool().query(
      "DELETE FROM handoff_sessions WHERE expires_at <= now()",
    );
  }

  private async ensureSchema(): Promise<void> {
    this.schemaReady ??= withPostgresSchemaLock(async (client) => {
      await client.query(`
          CREATE TABLE IF NOT EXISTS handoff_sessions (
            session_id text PRIMARY KEY,
            publish_token_hash text NOT NULL,
            consume_token_hash text NOT NULL,
            payload jsonb,
            created_at timestamptz NOT NULL DEFAULT now(),
            expires_at timestamptz NOT NULL,
            consumed_at timestamptz,
            cancelled_at timestamptz
          );

          CREATE INDEX IF NOT EXISTS idx_handoff_sessions_expires_at
            ON handoff_sessions (expires_at);
        `);
      await client.query(`
          ALTER TABLE handoff_sessions
            ADD COLUMN IF NOT EXISTS publish_token_hash text,
            ADD COLUMN IF NOT EXISTS consume_token_hash text,
            ADD COLUMN IF NOT EXISTS consumed_at timestamptz,
            ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
          ALTER TABLE handoff_sessions ALTER COLUMN payload DROP NOT NULL;
        `);
    });
    await this.schemaReady;
  }
}

/** Upstash: JSON blob with token hashes; atomic consume via GETDEL after verify. */
export class UpstashRedisHandoffStore implements HandoffStore {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(
    baseUrl: string,
    token: string,
    private readonly ttlMs: number,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.token = token;
  }

  async createSession(input: {
    sessionId: string;
    publishTokenHash: string;
    consumeTokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    const record = {
      publishTokenHash: input.publishTokenHash,
      consumeTokenHash: input.consumeTokenHash,
      payload: null as HandoffPayload | null,
      consumed: false,
      cancelled: false,
      expiresAt: input.expiresAt.getTime(),
    };
    await this.command([
      "SET",
      this.key(input.sessionId),
      JSON.stringify(record),
      "PX",
      this.ttlMs,
    ]);
  }

  async publish(
    sessionId: string,
    publishTokenHash: string,
    payload: HandoffPayload,
  ): Promise<"stored" | "exists" | "unauthorized" | "expired" | "missing"> {
    const raw = await this.command<string | null>(["GET", this.key(sessionId)]);
    if (!raw) return "missing";
    const record = JSON.parse(raw) as {
      publishTokenHash: string;
      consumeTokenHash: string;
      payload: HandoffPayload | null;
      consumed: boolean;
      cancelled: boolean;
      expiresAt: number;
    };
    if (record.cancelled || record.expiresAt <= Date.now()) return "expired";
    if (!timingSafeEqualString(record.publishTokenHash, publishTokenHash)) {
      return "unauthorized";
    }
    if (record.payload) return "exists";
    record.payload = payload;
    const ttl = Math.max(1, record.expiresAt - Date.now());
    await this.command(["SET", this.key(sessionId), JSON.stringify(record), "PX", ttl]);
    return "stored";
  }

  async consume(
    sessionId: string,
    consumeTokenHash: string,
  ): Promise<
    | HandoffPayload
    | "unauthorized"
    | "expired"
    | "missing"
    | "pending"
    | "already_consumed"
  > {
    const raw = await this.command<string | null>(["GET", this.key(sessionId)]);
    if (!raw) return "missing";
    const record = JSON.parse(raw) as {
      publishTokenHash: string;
      consumeTokenHash: string;
      payload: HandoffPayload | null;
      consumed: boolean;
      cancelled: boolean;
      expiresAt: number;
    };
    if (record.cancelled || record.expiresAt <= Date.now()) return "expired";
    if (!timingSafeEqualString(record.consumeTokenHash, consumeTokenHash)) {
      return "unauthorized";
    }
    if (record.consumed) return "already_consumed";
    if (!record.payload) return "pending";
    const deleted = await this.command<string | null>(["GETDEL", this.key(sessionId)]);
    if (!deleted) return "already_consumed";
    return record.payload;
  }

  async cancel(
    sessionId: string,
    consumeTokenHash: string,
  ): Promise<"cancelled" | "unauthorized" | "expired" | "missing"> {
    const raw = await this.command<string | null>(["GET", this.key(sessionId)]);
    if (!raw) return "missing";
    const record = JSON.parse(raw) as {
      consumeTokenHash: string;
      expiresAt: number;
    };
    if (record.expiresAt <= Date.now()) return "expired";
    if (!timingSafeEqualString(record.consumeTokenHash, consumeTokenHash)) {
      return "unauthorized";
    }
    await this.command(["DEL", this.key(sessionId)]);
    return "cancelled";
  }

  private key(sessionId: string): string {
    return `fitsense:handoff:${sessionId}`;
  }

  private async command<T>(command: unknown[]): Promise<T> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) throw new Error(`upstash_handoff_failed:${res.status}`);
    const body = (await res.json()) as { result?: T; error?: string };
    if (body.error) throw new Error(`upstash_handoff_failed:${body.error}`);
    return body.result as T;
  }
}

export function createHandoffStore(): HandoffStore {
  if (config.handoffStore === "upstash") {
    if (!config.upstashRedisRestUrl || !config.upstashRedisRestToken) {
      throw new Error(
        "HANDOFF_STORE=upstash requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
      );
    }
    return new UpstashRedisHandoffStore(
      config.upstashRedisRestUrl,
      config.upstashRedisRestToken,
      config.handoffTtlMs,
    );
  }
  if (config.handoffStore === "postgres") {
    return new PostgresHandoffStore(config.handoffTtlMs);
  }
  return new MemoryHandoffStore(config.handoffTtlMs);
}
