import { Router } from "express";
import { isFirestoreReady } from "../services/firestore.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "fitsense-api",
    version: "0.1.0",
    firestore: isFirestoreReady(),
  });
});
