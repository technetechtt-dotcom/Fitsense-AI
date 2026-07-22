import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { config } from "../config.js";
import { issueRecoveryCode, recoverFitIdentity } from "../services/fitIdentityStore.js";
import { fitProfileSchema } from "../validation/schemas.js";

export const fitIdentityRouter = Router();

fitIdentityRouter.use(
  rateLimit({
    name: "fit-identity",
    max: config.rateLimit.authMax,
    key: (req) => `ip:${req.ip}`,
  }),
);

const issueSchema = z.object({
  fitProfile: fitProfileSchema,
});

const recoverSchema = z.object({
  recoveryCode: z.string().trim().min(16).max(128),
});

/** Authenticated: issue a one-time recovery code bound to a Fit profile snapshot. */
fitIdentityRouter.post(
  "/fit-identity/recovery-codes",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const body = issueSchema.parse(req.body);
      const issued = await issueRecoveryCode({
        deviceId: req.uid,
        fitProfile: body.fitProfile,
      });
      res.status(201).json(issued);
    } catch (err) {
      next(err);
    }
  },
);

/** Public: redeem a recovery code to restore a Fit profile snapshot. */
fitIdentityRouter.post("/fit-identity/recover", async (req, res, next) => {
  try {
    const body = recoverSchema.parse(req.body);
    const recovered = await recoverFitIdentity(body.recoveryCode);
    if (!recovered) {
      res.status(404).json({ error: "recovery_not_found" });
      return;
    }
    res.json(recovered);
  } catch (err) {
    next(err);
  }
});
