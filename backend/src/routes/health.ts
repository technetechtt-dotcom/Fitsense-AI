import { Router } from "express";
import { config } from "../config.js";
import { getSyncStore } from "../services/syncStore.js";
import { isPostgresConfigured } from "../services/postgres.js";
import { getMigrationStatus } from "../services/migrate.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const syncStore = getSyncStore();
  let migrations: Awaited<ReturnType<typeof getMigrationStatus>> | null = null;
  if (isPostgresConfigured()) {
    try {
      migrations = await getMigrationStatus();
    } catch {
      migrations = { applied: [], pending: ["unavailable"], latest: null };
    }
  }
  const schemaOk = !migrations || migrations.pending.length === 0;
  res.status(schemaOk ? 200 : 503).json({
    ok: schemaOk,
    service: "fitsense-api",
    version: "0.1.0",
    handoffStore: config.handoffStore,
    syncStore: syncStore.name,
    syncReady: syncStore.isReady(),
    postgres: isPostgresConfigured(),
    migrations,
  });
});
