import { Router } from "express";
import { isFirestoreReady } from "../services/firestore.js";
import { config } from "../config.js";
import { getSyncStore } from "../services/syncStore.js";

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
    firestore: isFirestoreReady(),
  });
});
