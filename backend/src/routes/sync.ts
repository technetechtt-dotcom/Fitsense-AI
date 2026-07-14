import { Router } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  eraseUserData,
  fitEventRef,
  fitProfileRef,
  isFirestoreReady,
  pullUserData,
  scanRef,
} from "../services/firestore.js";

export const syncRouter = Router();

syncRouter.use((_req, res, next) => {
  if (!isFirestoreReady()) {
    res.status(503).json({
      error: "firestore_unavailable",
      message: "Configure Firebase Admin credentials to enable sync.",
    });
    return;
  }
  next();
});

syncRouter.use(requireAuth);

/** Pull fit profile, events, and scans (matches web `pullAll`). */
syncRouter.get("/sync", async (req: AuthedRequest, res, next) => {
  try {
    const uid = req.uid!;
    const data = await pullUserData(uid);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

syncRouter.put("/sync/fit-profile", async (req: AuthedRequest, res, next) => {
  try {
    const uid = req.uid!;
    await fitProfileRef(uid).set(
      { ...req.body, _syncedAtEpochMs: Date.now() },
      { merge: true },
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

syncRouter.put("/sync/scans/:scanId", async (req: AuthedRequest, res, next) => {
  try {
    const uid = req.uid!;
    await scanRef(uid, req.params.scanId).set(req.body, { merge: true });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

syncRouter.put(
  "/sync/fit-events/:eventId",
  async (req: AuthedRequest, res, next) => {
    try {
      const uid = req.uid!;
      await fitEventRef(uid, req.params.eventId).set(req.body, { merge: true });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

/** Erase all cloud data for the authenticated user (GDPR delete). */
syncRouter.delete("/sync", async (req: AuthedRequest, res, next) => {
  try {
    const uid = req.uid!;
    await eraseUserData(uid);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
