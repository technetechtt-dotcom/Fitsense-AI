import pg from "pg";
import { config } from "../config.js";

let pool: pg.Pool | null = null;

export function isPostgresConfigured(): boolean {
  return Boolean(config.database.url);
}

export function getPostgresPool(): pg.Pool {
  if (!config.database.url) {
    throw new Error("DATABASE_URL is required for Postgres storage.");
  }

  if (!pool) {
    pool = new pg.Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl
        ? { rejectUnauthorized: config.database.sslRejectUnauthorized }
        : undefined,
    });
  }

  return pool;
}

function isRetryableSchemaError(err: unknown): boolean {
  const e = err as { code?: string; constraint?: string; message?: string };
  if (e.code === "40P01") return true; // deadlock_detected
  if (e.code === "40001") return true; // serialization_failure
  if (e.code !== "23505") return false;
  const haystack = `${e.constraint ?? ""} ${e.message ?? ""}`;
  return haystack.includes("pg_type_typname_nsp_index");
}

/**
 * Run schema DDL with retries. Concurrent CREATE TABLE IF NOT EXISTS can still
 * race on the table composite type (pg_type_typname_nsp_index), especially in CI.
 * Avoids session advisory locks (fragile under Neon/PgBouncer).
 */
export async function withPostgresSchemaLock(
  run: (client: pg.PoolClient) => Promise<void>,
): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 8; attempt++) {
    const client = await getPostgresPool().connect();
    try {
      await run(client);
      return;
    } catch (err) {
      lastErr = err;
      if (!isRetryableSchemaError(err) || attempt === 7) throw err;
      await new Promise((r) => setTimeout(r, 25 * 2 ** attempt));
    } finally {
      client.release();
    }
  }
  throw lastErr;
}

export async function closePostgresPool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
}
