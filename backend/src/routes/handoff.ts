import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  createHandoffStore,
  generateHandoffSessionId,
  mintHandoffSessionTokens,
  verifyHandoffOpToken,
} from "../services/handoffStore.js";
import { sha256Hex } from "../services/sessionAuth.js";
import { handoffPayloadSchema, sessionIdSchema } from "../validation/schemas.js";

const store = createHandoffStore();

const bearerTokenSchema = z.string().min(16).max(2048);

function readBearer(req: { header: (name: string) => string | undefined }): string {
  const auth = req.header("authorization");
  return auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
}

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

handoffRouter.post("/handoff/sessions", writeLimit, async (_req, res, next) => {
  try {
    if (!config.handoffSecret) {
      res.status(503).json({
        error: "handoff_auth_unavailable",
        message:
          "Configure HANDOFF_SECRET (or AUTH_SECRET in local/dev) to issue handoff sessions.",
      });
      return;
    }
    const sessionId = generateHandoffSessionId();
    const tokens = mintHandoffSessionTokens(sessionId);
    await store.createSession({
      sessionId,
      publishTokenHash: tokens.publishTokenHash,
      consumeTokenHash: tokens.consumeTokenHash,
      expiresAt: tokens.expiresAt,
    });
    res.status(201).json({
      sessionId,
      publishToken: tokens.publishToken,
      consumeToken: tokens.consumeToken,
      expiresAtEpochMs: tokens.expiresAt.getTime(),
      kid: config.handoffKid,
    });
  } catch (err) {
    next(err);
  }
});

handoffRouter.put("/handoff/:sessionId", writeLimit, async (req, res, next) => {
  try {
    const sessionId = sessionIdSchema.parse(req.params.sessionId);
    const raw = readBearer(req);
    if (!raw) {
      res.status(401).json({ error: "invalid_publish_token" });
      return;
    }
    const token = bearerTokenSchema.parse(raw);
    if (!verifyHandoffOpToken(token, sessionId, "publish")) {
      res.status(401).json({ error: "invalid_publish_token" });
      return;
    }
    const body = req.body as { payload?: unknown };
    const candidate = body?.payload ?? req.body;
    const payload = handoffPayloadSchema.parse(candidate);
    const result = await store.publish(sessionId, sha256Hex(token), payload);
    if (result === "unauthorized") {
      res.status(401).json({ error: "invalid_publish_token" });
      return;
    }
    if (result === "expired") {
      res.status(410).json({ error: "handoff_expired" });
      return;
    }
    if (result === "missing") {
      res.status(404).json({ error: "handoff_not_found" });
      return;
    }
    if (result === "exists") {
      res.status(409).json({ error: "handoff_already_published" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

handoffRouter.post("/handoff/:sessionId/consume", readLimit, async (req, res, next) => {
  try {
    const sessionId = sessionIdSchema.parse(req.params.sessionId);
    const raw = readBearer(req);
    if (!raw) {
      res.status(401).json({ error: "invalid_consume_token" });
      return;
    }
    const token = bearerTokenSchema.parse(raw);
    if (!verifyHandoffOpToken(token, sessionId, "consume")) {
      res.status(401).json({ error: "invalid_consume_token" });
      return;
    }
    const result = await store.consume(sessionId, sha256Hex(token));
    if (result === "unauthorized") {
      res.status(401).json({ error: "invalid_consume_token" });
      return;
    }
    if (result === "expired") {
      res.status(410).json({ error: "handoff_expired" });
      return;
    }
    if (result === "already_consumed") {
      res.status(409).json({ error: "handoff_already_consumed" });
      return;
    }
    if (result === "missing") {
      res.status(404).json({ error: "handoff_not_found" });
      return;
    }
    if (result === "pending") {
      res.json({ payload: null });
      return;
    }
    res.json({ payload: result });
  } catch (err) {
    next(err);
  }
});

handoffRouter.get("/handoff/:sessionId", readLimit, (_req, res) => {
  res.status(410).json({
    error: "handoff_get_removed",
    message:
      "Open GET handoff is removed. Use POST /v1/handoff/:sessionId/consume with the consume Bearer token.",
  });
});

handoffRouter.delete("/handoff/:sessionId", writeLimit, async (req, res, next) => {
  try {
    const sessionId = sessionIdSchema.parse(req.params.sessionId);
    const raw = readBearer(req);
    if (!raw) {
      res.status(401).json({ error: "invalid_consume_token" });
      return;
    }
    const token = bearerTokenSchema.parse(raw);
    if (!verifyHandoffOpToken(token, sessionId, "consume")) {
      res.status(401).json({ error: "invalid_consume_token" });
      return;
    }
    const result = await store.cancel(sessionId, sha256Hex(token));
    if (result === "unauthorized") {
      res.status(401).json({ error: "invalid_consume_token" });
      return;
    }
    if (result === "expired") {
      res.status(410).json({ error: "handoff_expired" });
      return;
    }
    if (result === "missing") {
      res.status(404).json({ error: "handoff_not_found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
