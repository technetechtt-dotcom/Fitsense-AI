import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { createHandoffStore } from "../services/handoffStore.js";
import { handoffPayloadSchema, sessionIdSchema } from "../validation/schemas.js";

const store = createHandoffStore();

const publishTokenSchema = z.string().min(16).max(512);

function issuePublishToken(sessionId: string): string {
  const secret = config.authSecret;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  const body = Buffer.from(
    JSON.stringify({ sessionId, exp: Date.now() + config.handoffTtlMs }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyPublishToken(token: string, sessionId: string): boolean {
  const secret = config.authSecret;
  if (!secret) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      sessionId?: string;
      exp?: number;
    };
    return payload.sessionId === sessionId && (payload.exp ?? 0) > Date.now();
  } catch {
    return false;
  }
}

function generateSessionId(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(24);
  let out = "";
  for (let i = 0; i < 24; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
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

handoffRouter.post("/handoff/sessions", writeLimit, (req, res, next) => {
  try {
    if (!config.authSecret) {
      res.status(503).json({
        error: "handoff_auth_unavailable",
        message: "Configure AUTH_SECRET to issue signed handoff sessions.",
      });
      return;
    }
    const sessionId = generateSessionId();
    const publishToken = issuePublishToken(sessionId);
    res.json({
      sessionId,
      publishToken,
      expiresAtEpochMs: Date.now() + config.handoffTtlMs,
    });
  } catch (err) {
    next(err);
  }
});

handoffRouter.put("/handoff/:sessionId", writeLimit, async (req, res, next) => {
  try {
    const sessionId = sessionIdSchema.parse(req.params.sessionId);
    const auth = req.header("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
    if (token) {
      publishTokenSchema.parse(token);
      if (!verifyPublishToken(token, sessionId)) {
        res.status(401).json({ error: "invalid_publish_token" });
        return;
      }
    }
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
