import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { verifyIdToken } from "../services/firestore.js";

export interface AuthedRequest extends Request {
  uid?: string;
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (config.skipAuth) {
      const debugUid = req.header("x-debug-uid");
      if (!debugUid) {
        res.status(401).json({
          error: "unauthorized",
          message: "Set X-Debug-Uid header when SKIP_AUTH=true",
        });
        return;
      }
      req.uid = debugUid;
      next();
      return;
    }

    req.uid = await verifyIdToken(req.header("authorization") ?? undefined);
    next();
  } catch (err) {
    res.status(401).json({
      error: "unauthorized",
      message: err instanceof Error ? err.message : "Invalid token",
    });
  }
}
