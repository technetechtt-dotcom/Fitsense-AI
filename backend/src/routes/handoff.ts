import { Router } from "express";
import { config } from "../config.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { createHandoffStore } from "../services/handoffStore.js";
import { handoffPayloadSchema, sessionIdSchema } from "../validation/schemas.js";

const store = createHandoffStore();

export const handoffRouter = Router();

const readLimit = rateLimit({
  name: "handoff:read",
  max: config.rateLimit.handoffReadMax,
  key: (req) => `${req.ip}:${req.params.sessionId ?? ""}`,
});

const writeLimit = rateLimit({
  name: "handoff:write",
  max: config.rateLimit.handoffWriteMax,
  key: (req) => `${req.ip}:${req.params.sessionId ?? ""}`,
});

handoffRouter.put("/handoff/:sessionId", writeLimit, async (req, res, next) => {
  try {
    const sessionId = sessionIdSchema.parse(req.params.sessionId);
    const body = req.body as { payload?: unknown };
    const candidate = body?.payload ?? req.body;
    const payload = handoffPayloadSchema.parse(candidate);
    const result = await store.set(sessionId, payload);
    if (result === "exists") {
      res.status(409).json({ error: "handoff_already_published" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

handoffRouter.get("/handoff/:sessionId", readLimit, async (req, res, next) => {
  try {
    const sessionId = sessionIdSchema.parse(req.params.sessionId);
    const payload = await store.get(sessionId);
    if (!payload) {
      res.json({ payload: null });
      return;
    }
    res.json({ payload });
  } catch (err) {
    next(err);
  }
});

handoffRouter.delete("/handoff/:sessionId", writeLimit, async (req, res, next) => {
  try {
    const sessionId = sessionIdSchema.parse(req.params.sessionId);
    await store.delete(sessionId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
