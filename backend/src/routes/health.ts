import { Router } from "express";
import { config } from "../config.js";
import { getSyncStore } from "../services/syncStore.js";
import { isPostgresConfigured } from "../services/postgres.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  const syncStore = getSyncStore();
  res.json({
    ok: true,
    service: "fitsense-api",
    version: "0.1.0",
    handoffStore: config.handoffStore,
    syncStore: syncStore.name,
    syncReady: syncStore.isReady(),
    postgres: isPostgresConfigured(),
  });
});
