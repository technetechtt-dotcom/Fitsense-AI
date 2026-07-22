import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { isAccessJtiRevoked } from "../services/deviceAuthStore.js";
import { verifyAccessToken } from "../services/sessionAuth.js";

export interface AuthedRequest extends Request {
  uid?: string;
  accessJti?: string;
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (config.skipAuth) {
      const debugUid = req.header("x-debug-uid");
      if (!debugUid || !/^[A-Za-z0-9_.:-]{1,128}$/.test(debugUid)) {
        res.status(401).json({
          error: "unauthorized",
          message: "Set a valid X-Debug-Uid header when SKIP_AUTH=true",
        });
        return;
      }
      req.uid = debugUid;
      next();
      return;
    }

    const authorization = req.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      res.status(401).json({ error: "unauthorized", message: "Missing Bearer token" });
      return;
    }
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
      res.status(401).json({ error: "unauthorized", message: "Empty Bearer token" });
      return;
    }

    const payload = verifyAccessToken(token);
    if (await isAccessJtiRevoked(payload.jti)) {
      res.status(401).json({ error: "unauthorized", message: "Token revoked" });
      return;
    }
    req.uid = payload.uid;
    req.accessJti = payload.jti;
    next();
  } catch (err) {
    res.status(401).json({
      error: "unauthorized",
      message: err instanceof Error ? err.message : "Invalid token",
    });
  }
}
