import { Router, type Response } from "express";
import { config } from "../config.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { getSyncStore } from "../services/syncStore.js";
import {
  documentIdSchema,
  fitEventSchema,
  fitProfileSchema,
  scanSchema,
} from "../validation/schemas.js";

export const syncRouter = Router();

syncRouter.use((_req, res, next) => {
  const store = getSyncStore();
  if (!store.isReady()) {
    res.status(503).json({
      error: `${store.name}_unavailable`,
      message:
        store.name === "postgres"
          ? "Configure DATABASE_URL and ensure the database is reachable."
          : "Configure Firebase Admin credentials to enable sync.",
    });
    return;
  }
  next();
});

syncRouter.use(requireAuth);
syncRouter.use(
  rateLimit({
    name: "sync",
    max: config.rateLimit.syncMax,
    key: (req) => {
      const authed = req as AuthedRequest;
      return authed.uid ? `uid:${authed.uid}` : `ip:${req.ip}`;
    },
  }),
);

function requireUid(req: AuthedRequest, res: Response): string | null {
  if (!req.uid) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return req.uid;
}

/** Pull fit profile, events, and scans (matches web `pullAll`). */
syncRouter.get("/sync", async (req: AuthedRequest, res, next) => {
  try {
    const uid = requireUid(req, res);
    if (!uid) return;
    const data = await getSyncStore().pullUserData(uid);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

syncRouter.put("/sync/fit-profile", async (req: AuthedRequest, res, next) => {
  try {
    const uid = requireUid(req, res);
    if (!uid) return;
    const profile = {
      ...fitProfileSchema.parse(req.body),
      _syncedAtEpochMs: Date.now(),
    };
    await getSyncStore().upsertFitProfile(uid, profile);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

syncRouter.put("/sync/scans/:scanId", async (req: AuthedRequest, res, next) => {
  try {
    const uid = requireUid(req, res);
    if (!uid) return;
    const scanId = documentIdSchema.parse(req.params.scanId);
    const scan = scanSchema.parse(req.body);
    if (scan.scanId !== scanId) {
      res.status(400).json({ error: "scan_id_mismatch" });
      return;
    }
    await getSyncStore().upsertScan(uid, scanId, scan);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

syncRouter.delete("/sync/scans/:scanId", async (req: AuthedRequest, res, next) => {
  try {
    const uid = requireUid(req, res);
    if (!uid) return;
    const scanId = documentIdSchema.parse(req.params.scanId);
    await getSyncStore().deleteScan(uid, scanId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

syncRouter.put("/sync/fit-events/:eventId", async (req: AuthedRequest, res, next) => {
  try {
    const uid = requireUid(req, res);
    if (!uid) return;
    const eventId = documentIdSchema.parse(req.params.eventId);
    const event = fitEventSchema.parse(req.body);
    if (event.eventId !== eventId) {
      res.status(400).json({ error: "event_id_mismatch" });
      return;
    }
    await getSyncStore().upsertFitEvent(uid, eventId, event);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/** Erase all cloud data for the authenticated user (GDPR delete). */
syncRouter.delete("/sync", async (req: AuthedRequest, res, next) => {
  try {
    const uid = requireUid(req, res);
    if (!uid) return;
    await getSyncStore().eraseUserData(uid);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
