import { Router } from "express";
import { config } from "../config.js";
import type { HandoffPayload } from "../types.js";
import { HandoffStore } from "../services/handoffStore.js";

const store = new HandoffStore(config.handoffTtlMs);

function isHandoffPayload(value: unknown): value is HandoffPayload {
  if (!value || typeof value !== "object") return false;
  const p = value as HandoffPayload;
  return (
    p.v === 1 &&
    typeof p.completedAtEpochMs === "number" &&
    !!p.size &&
    typeof p.size.uk === "string" &&
    !!p.scan &&
    typeof p.scan.scanId === "string"
  );
}

export const handoffRouter = Router();

handoffRouter.put("/handoff/:sessionId", (req, res) => {
  const body = req.body as { payload?: unknown };
  const candidate = body?.payload ?? req.body;
  if (!isHandoffPayload(candidate)) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }
  store.set(req.params.sessionId, candidate);
  res.status(204).end();
});

handoffRouter.get("/handoff/:sessionId", (req, res) => {
  const payload = store.get(req.params.sessionId);
  if (!payload) {
    res.json({});
    return;
  }
  res.json({ payload });
});

handoffRouter.delete("/handoff/:sessionId", (req, res) => {
  store.delete(req.params.sessionId);
  res.status(204).end();
});
