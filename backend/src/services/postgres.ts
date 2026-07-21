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

export async function closePostgresPool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
}
