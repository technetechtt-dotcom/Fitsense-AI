import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getPostgresPool,
  isPostgresConfigured,
  withPostgresSchemaLock,
} from "./postgres.js";

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../migrations",
);

let migrateOnce: Promise<MigrationStatus> | null = null;

export interface MigrationStatus {
  applied: string[];
  pending: string[];
  latest: string | null;
}

async function listMigrationFiles(): Promise<string[]> {
  const names = await readdir(MIGRATIONS_DIR);
  return names.filter((n) => /^\d+_.*\.sql$/i.test(n)).sort();
}

async function applyPending(): Promise<void> {
  await withPostgresSchemaLock(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const files = await listMigrationFiles();
    const appliedResult = await client.query<{ id: string }>(
      "SELECT id FROM schema_migrations ORDER BY id",
    );
    const appliedSet = new Set(appliedResult.rows.map((r) => r.id));
    const pending = files.filter((f) => !appliedSet.has(f));
    if (pending.length === 0) return;

    await client.query("BEGIN");
    try {
      for (const file of pending) {
        const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
          [file],
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  });
}

/**
 * Apply pending numbered SQL migrations under `backend/migrations/`.
 * Safe to call repeatedly; serialised via schema lock.
 */
export async function runMigrations(): Promise<MigrationStatus> {
  if (!isPostgresConfigured()) {
    return { applied: [], pending: [], latest: null };
  }
  if (!migrateOnce) {
    migrateOnce = applyPending()
      .then(() => getMigrationStatus())
      .catch((err) => {
        migrateOnce = null;
        throw err;
      });
  }
  return migrateOnce;
}

export async function getMigrationStatus(): Promise<MigrationStatus> {
  if (!isPostgresConfigured()) {
    return { applied: [], pending: [], latest: null };
  }
  const files = await listMigrationFiles();
  try {
    const appliedResult = await getPostgresPool().query<{ id: string }>(
      "SELECT id FROM schema_migrations ORDER BY id",
    );
    const applied = appliedResult.rows.map((r) => r.id);
    const appliedSet = new Set(applied);
    const pending = files.filter((f) => !appliedSet.has(f));
    return {
      applied,
      pending,
      latest: applied[applied.length - 1] ?? null,
    };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "42P01") {
      // relation schema_migrations does not exist yet
      return { applied: [], pending: files, latest: null };
    }
    throw err;
  }
}

/** Fail closed when Postgres is configured but migrations are behind. */
export async function requireMigrationsApplied(): Promise<void> {
  const status = await runMigrations();
  if (status.pending.length > 0) {
    throw new Error(
      `Database schema incompatible: pending migrations ${status.pending.join(", ")}`,
    );
  }
}
