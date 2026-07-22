#!/usr/bin/env node
/**
 * Apply pending SQL migrations (backend/migrations/*.sql).
 * Usage: node scripts/migrate.mjs   (from backend/, after build or via tsx)
 */
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const migrateUrl = pathToFileURL(
  path.join(root, "../dist/services/migrate.js"),
).href;

async function main() {
  // Prefer compiled dist; fall back to tsx-loaded source in dev.
  let runMigrations;
  try {
    ({ runMigrations } = await import(migrateUrl));
  } catch {
    ({ runMigrations } = await import("../src/services/migrate.ts"));
  }
  const status = await runMigrations();
  console.log(JSON.stringify(status, null, 2));
  if (status.pending.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
