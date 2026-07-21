import type { HandoffPayload } from "../types.js";
import { config } from "../config.js";
import { getPostgresPool } from "./postgres.js";

interface SessionEntry {
  payload: HandoffPayload;
  createdAt: number;
}

export interface HandoffStore {
  set(sessionId: string, payload: HandoffPayload): Promise<"stored" | "exists">;
  get(sessionId: string): Promise<HandoffPayload | null>;
  delete(sessionId: string): Promise<void>;
}

export class MemoryHandoffStore implements HandoffStore {
  private readonly sessions = new Map<string, SessionEntry>();

  constructor(private readonly ttlMs: number) {}

  prune(): void {
    const now = Date.now();
    for (const [id, entry] of this.sessions) {
      if (now - entry.createdAt > this.ttlMs) {
        this.sessions.delete(id);
      }
    }
  }

  async set(sessionId: string, payload: HandoffPayload): Promise<"stored" | "exists"> {
    this.prune();
    if (this.sessions.has(sessionId)) return "exists";
    this.sessions.set(sessionId, { payload, createdAt: Date.now() });
    return "stored";
  }

  async get(sessionId: string): Promise<HandoffPayload | null> {
    this.prune();
    const entry = this.sessions.get(sessionId);
    if (!entry || Date.now() - entry.createdAt > this.ttlMs) {
      this.sessions.delete(sessionId);
      return null;
    }
    return entry.payload;
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}

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

  async set(sessionId: string, payload: HandoffPayload): Promise<"stored" | "exists"> {
    const result = await this.command<string | null>([
      "SET",
      this.key(sessionId),
      JSON.stringify(payload),
      "PX",
      this.ttlMs,
      "NX",
    ]);
    return result === "OK" ? "stored" : "exists";
  }

  async get(sessionId: string): Promise<HandoffPayload | null> {
    const result = await this.command<string | null>(["GET", this.key(sessionId)]);
    if (!result) return null;
    try {
      return JSON.parse(result) as HandoffPayload;
    } catch {
      await this.delete(sessionId);
      return null;
    }
  }

  async delete(sessionId: string): Promise<void> {
    await this.command<number>(["DEL", this.key(sessionId)]);
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
    if (!res.ok) {
      throw new Error(`upstash_handoff_failed:${res.status}`);
    }
    const body = (await res.json()) as { result?: T; error?: string };
    if (body.error) {
      throw new Error(`upstash_handoff_failed:${body.error}`);
    }
    return body.result as T;
  }
}

export class PostgresHandoffStore implements HandoffStore {
  private schemaReady: Promise<void> | null = null;

  constructor(private readonly ttlMs: number) {}

  async set(sessionId: string, payload: HandoffPayload): Promise<"stored" | "exists"> {
    await this.ensureSchema();
    await this.prune();
    const expiresAt = new Date(Date.now() + this.ttlMs);
    const result = await getPostgresPool().query(
      `
        INSERT INTO handoff_sessions (session_id, payload, expires_at)
        VALUES ($1, $2::jsonb, $3)
        ON CONFLICT (session_id) DO NOTHING
      `,
      [sessionId, JSON.stringify(payload), expiresAt],
    );
    return result.rowCount === 1 ? "stored" : "exists";
  }

  async get(sessionId: string): Promise<HandoffPayload | null> {
    await this.ensureSchema();
    await this.prune();
    const result = await getPostgresPool().query<{ payload: HandoffPayload }>(
      `
        SELECT payload
        FROM handoff_sessions
        WHERE session_id = $1 AND expires_at > now()
      `,
      [sessionId],
    );
    return result.rows[0]?.payload ?? null;
  }

  async delete(sessionId: string): Promise<void> {
    await this.ensureSchema();
    await getPostgresPool().query(
      "DELETE FROM handoff_sessions WHERE session_id = $1",
      [sessionId],
    );
  }

  private async prune(): Promise<void> {
    await getPostgresPool().query(
      "DELETE FROM handoff_sessions WHERE expires_at <= now()",
    );
  }

  private async ensureSchema(): Promise<void> {
    this.schemaReady ??= getPostgresPool()
      .query(
        `
          CREATE TABLE IF NOT EXISTS handoff_sessions (
            session_id text PRIMARY KEY,
            payload jsonb NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now(),
            expires_at timestamptz NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_handoff_sessions_expires_at
            ON handoff_sessions (expires_at);
        `,
      )
      .then(() => undefined);
    await this.schemaReady;
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
