import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { issueSessionToken, isValidUid } from "../services/sessionAuth.js";

const sessionRequestSchema = z.object({
  deviceId: z.string().trim().min(1).max(128),
});

export const authRouter = Router();

authRouter.post(
  "/auth/session",
  rateLimit({
    name: "auth-session",
    max: 30,
    key: (req) => `ip:${req.ip}`,
  }),
  (req, res, next) => {
    try {
      if (config.skipAuth) {
        res.status(503).json({
          error: "auth_disabled",
          message: "Session issuance is disabled while SKIP_AUTH=true.",
        });
        return;
      }
      if (!config.authSecret) {
        res.status(503).json({
          error: "auth_unavailable",
          message: "Configure AUTH_SECRET to enable device sessions.",
        });
        return;
      }

      const { deviceId } = sessionRequestSchema.parse(req.body);
      if (!isValidUid(deviceId)) {
        res.status(400).json({ error: "invalid_device_id" });
        return;
      }

      const token = issueSessionToken(deviceId);
      res.json({ token, uid: deviceId });
    } catch (err) {
      next(err);
    }
  },
);
