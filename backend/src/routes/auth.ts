import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  createChallenge,
  consumeChallenge,
  getActiveDevice,
  recordSecurityEvent,
  registerDevice,
  revokeAccessJti,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  storeRefreshToken,
} from "../services/deviceAuthStore.js";
import {
  generateOpaqueToken,
  issueAccessToken,
  sha256Hex,
  timingSafeEqualString,
  verifyAccessToken,
} from "../services/sessionAuth.js";
import { isPostgresConfigured } from "../services/postgres.js";

export const authRouter = Router();

const authLimit = rateLimit({
  name: "auth",
  max: config.rateLimit.authMax,
  key: (req) => `ip:${req.ip}`,
});

authRouter.use("/auth", authLimit);

function requireAuthDb(res: import("express").Response): boolean {
  if (config.skipAuth) return true;
  if (!isPostgresConfigured()) {
    res.status(503).json({
      error: "auth_unavailable",
      message: "Configure DATABASE_URL for device authentication.",
    });
    return false;
  }
  if (!config.authSecret) {
    res.status(503).json({
      error: "auth_unavailable",
      message: "Configure AUTH_SECRET to enable device sessions.",
    });
    return false;
  }
  return true;
}

authRouter.post("/auth/session", (_req, res) => {
  res.status(410).json({
    error: "auth_session_removed",
    message:
      "Client-chosen deviceId sessions are no longer supported. Use /v1/auth/devices/register and challenge-response.",
  });
});

authRouter.post("/auth/devices/register", async (req, res, next) => {
  try {
    if (!requireAuthDb(res)) return;
    if (config.skipAuth) {
      res.status(503).json({
        error: "auth_disabled",
        message: "Device registration is disabled while SKIP_AUTH=true.",
      });
      return;
    }
    const device = await registerDevice();
    await recordSecurityEvent({
      eventType: "device_registered",
      deviceId: device.deviceId,
      ip: req.ip,
    });
    res.status(201).json({
      deviceId: device.deviceId,
      deviceSecret: device.deviceSecret,
      kid: config.authKid,
    });
  } catch (err) {
    next(err);
  }
});

const challengeSchema = z.object({
  deviceId: z.string().trim().min(1).max(128),
});

authRouter.post("/auth/challenge", async (req, res, next) => {
  try {
    if (!requireAuthDb(res)) return;
    if (config.skipAuth) {
      res.status(503).json({ error: "auth_disabled" });
      return;
    }
    const { deviceId } = challengeSchema.parse(req.body);
    const device = await getActiveDevice(deviceId);
    if (!device) {
      await recordSecurityEvent({
        eventType: "challenge_unknown_device",
        deviceId,
        ip: req.ip,
      });
      res.status(401).json({ error: "unknown_device" });
      return;
    }
    const challenge = await createChallenge(deviceId);
    await recordSecurityEvent({
      eventType: "challenge_issued",
      deviceId,
      ip: req.ip,
    });
    res.json(challenge);
  } catch (err) {
    next(err);
  }
});

const tokenSchema = z.object({
  deviceId: z.string().trim().min(1).max(128),
  challengeId: z.string().trim().min(1).max(128),
  nonce: z.string().trim().min(1).max(256),
  proof: z.string().trim().min(1).max(256),
});

authRouter.post("/auth/token", async (req, res, next) => {
  try {
    if (!requireAuthDb(res)) return;
    if (config.skipAuth) {
      res.status(503).json({ error: "auth_disabled" });
      return;
    }
    const body = tokenSchema.parse(req.body);
    const device = await getActiveDevice(body.deviceId);
    if (!device) {
      res.status(401).json({ error: "unknown_device" });
      return;
    }
    const consumed = await consumeChallenge({
      challengeId: body.challengeId,
      deviceId: body.deviceId,
      nonce: body.nonce,
    });
    if (!consumed) {
      await recordSecurityEvent({
        eventType: "token_invalid_challenge",
        deviceId: body.deviceId,
        ip: req.ip,
      });
      res.status(401).json({ error: "invalid_challenge" });
      return;
    }

    // Client proof = sha256(sha256(deviceSecret) + ":" + nonce)
    const expectedProof = sha256Hex(`${device.secretHash}:${body.nonce}`);
    if (!timingSafeEqualString(expectedProof, body.proof)) {
      await recordSecurityEvent({
        eventType: "token_invalid_proof",
        deviceId: body.deviceId,
        ip: req.ip,
      });
      res.status(401).json({ error: "invalid_proof" });
      return;
    }

    const access = issueAccessToken(body.deviceId);
    const refreshToken = generateOpaqueToken(32);
    await storeRefreshToken(body.deviceId, refreshToken);
    await recordSecurityEvent({
      eventType: "token_issued",
      deviceId: body.deviceId,
      ip: req.ip,
    });
    res.json({
      accessToken: access.token,
      refreshToken,
      tokenType: "Bearer",
      expiresInMs: config.accessTokenTtlMs,
      uid: body.deviceId,
      kid: config.authKid,
    });
  } catch (err) {
    next(err);
  }
});

const refreshSchema = z.object({
  refreshToken: z.string().trim().min(16).max(512),
});

authRouter.post("/auth/refresh", async (req, res, next) => {
  try {
    if (!requireAuthDb(res)) return;
    if (config.skipAuth) {
      res.status(503).json({ error: "auth_disabled" });
      return;
    }
    const { refreshToken } = refreshSchema.parse(req.body);
    const nextRefresh = generateOpaqueToken(32);
    const deviceId = await rotateRefreshToken({
      refreshToken,
      nextRefreshToken: nextRefresh,
    });
    if (!deviceId) {
      await recordSecurityEvent({
        eventType: "refresh_rejected",
        ip: req.ip,
      });
      res.status(401).json({ error: "invalid_refresh_token" });
      return;
    }
    const access = issueAccessToken(deviceId);
    await recordSecurityEvent({
      eventType: "refresh_rotated",
      deviceId,
      ip: req.ip,
    });
    res.json({
      accessToken: access.token,
      refreshToken: nextRefresh,
      tokenType: "Bearer",
      expiresInMs: config.accessTokenTtlMs,
      uid: deviceId,
      kid: config.authKid,
    });
  } catch (err) {
    next(err);
  }
});

const logoutSchema = z.object({
  refreshToken: z.string().trim().min(16).max(512).optional(),
  accessToken: z.string().trim().min(16).max(2048).optional(),
});

authRouter.post("/auth/logout", async (req, res, next) => {
  try {
    if (!requireAuthDb(res)) return;
    if (config.skipAuth) {
      res.status(204).end();
      return;
    }
    const body = logoutSchema.parse(req.body ?? {});
    let deviceId: string | null = null;
    if (body.refreshToken) {
      deviceId = await revokeRefreshToken(body.refreshToken);
    }
    if (body.accessToken) {
      try {
        const payload = verifyAccessToken(body.accessToken);
        await revokeAccessJti(payload.jti, payload.uid, payload.exp);
        deviceId = deviceId ?? payload.uid;
      } catch {
        // ignore invalid access on logout
      }
    }
    if (deviceId) {
      await revokeAllRefreshTokens(deviceId);
      await recordSecurityEvent({
        eventType: "logout",
        deviceId,
        ip: req.ip,
      });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
