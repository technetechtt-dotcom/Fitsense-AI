import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { config } from "../config.js";
import { issueRecoveryCode, recoverFitIdentity } from "../services/fitIdentityStore.js";
import {
  createShareGrant,
  listShareGrants,
  redeemShareGrant,
  revokeShareGrant,
} from "../services/fitShareStore.js";
import { resolveApiKey } from "../services/merchantStore.js";
import { fitProfileSchema, documentIdSchema } from "../validation/schemas.js";

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

const shareCreateSchema = z.object({
  orgId: documentIdSchema,
  fitProfile: fitProfileSchema,
  purpose: z.string().trim().min(1).max(64).optional(),
  ttlMs: z.number().int().positive().max(30 * 24 * 60 * 60 * 1000).optional(),
});

const shareRedeemSchema = z.object({
  shareToken: z.string().trim().min(16).max(128),
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

/**
 * Authenticated user consent: grant a merchant org a time-limited Fit ID share.
 * Returns a one-time FSMS1 share token — only that org's API key can redeem it.
 */
fitIdentityRouter.post(
  "/fit-identity/share-grants",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const body = shareCreateSchema.parse(req.body);
      const issued = await createShareGrant({
        deviceId: req.uid,
        orgId: body.orgId,
        fitProfile: body.fitProfile,
        purpose: body.purpose,
        ttlMs: body.ttlMs,
      });
      res.status(201).json(issued);
    } catch (err) {
      next(err);
    }
  },
);

fitIdentityRouter.get(
  "/fit-identity/share-grants",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      res.json({ grants: await listShareGrants(req.uid) });
    } catch (err) {
      next(err);
    }
  },
);

fitIdentityRouter.post(
  "/fit-identity/share-grants/:grantId/revoke",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const grantId = String(req.params.grantId ?? "").trim();
      const ok = await revokeShareGrant({ deviceId: req.uid, grantId });
      if (!ok) {
        res.status(404).json({ error: "grant_not_found" });
        return;
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Merchant: redeem a user share token with X-Api-Key.
 * Org is resolved from the API key; must match the grant's org.
 */
fitIdentityRouter.post("/fit-identity/share/redeem", async (req, res, next) => {
  try {
    const apiKey = req.header("x-api-key")?.trim();
    if (!apiKey) {
      res.status(401).json({ error: "api_key_required" });
      return;
    }
    const resolved = await resolveApiKey(apiKey);
    if (!resolved) {
      res.status(401).json({ error: "invalid_api_key" });
      return;
    }
    const body = shareRedeemSchema.parse(req.body);
    const redeemed = await redeemShareGrant({
      orgId: resolved.orgId,
      shareToken: body.shareToken,
    });
    if (!redeemed) {
      res.status(404).json({ error: "share_not_found" });
      return;
    }
    res.json({
      orgId: resolved.orgId,
      fitId: redeemed.fitId,
      purpose: redeemed.purpose,
      fitProfile: redeemed.fitProfile,
    });
  } catch (err) {
    next(err);
  }
});
