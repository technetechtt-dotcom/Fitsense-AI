import type { NextFunction, Response } from "express";
import type { AuthedRequest } from "./auth.js";
import { isAccessJtiRevoked } from "../services/deviceAuthStore.js";
import { verifyAccessToken } from "../services/sessionAuth.js";
import {
  getMemberRole,
  resolveApiKey,
  roleAtLeast,
  type OrgRole,
} from "../services/merchantStore.js";
import { config } from "../config.js";

export interface MerchantRequest extends AuthedRequest {
  orgId?: string;
  orgRole?: OrgRole;
  authVia?: "device" | "api_key";
}

async function attachDeviceUid(req: MerchantRequest): Promise<void> {
  if (req.uid) return;
  if (config.skipAuth) {
    const debugUid = req.header("x-debug-uid");
    if (debugUid) req.uid = debugUid;
    return;
  }
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) return;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return;
  try {
    const payload = verifyAccessToken(token);
    if (await isAccessJtiRevoked(payload.jti)) return;
    req.uid = payload.uid;
    req.accessJti = payload.jti;
  } catch {
    // leave uid unset; role check will 401
  }
}

/** Resolve org from path + authorize via device membership or X-Api-Key. */
export function requireOrgRole(minimum: OrgRole) {
  return async (req: MerchantRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = String(req.params.orgId ?? "").trim();
      if (!orgId) {
        res.status(400).json({ error: "org_id_required" });
        return;
      }

      const apiKey = req.header("x-api-key")?.trim();
      if (apiKey) {
        const resolved = await resolveApiKey(apiKey);
        if (!resolved || resolved.orgId !== orgId) {
          res.status(401).json({ error: "invalid_api_key" });
          return;
        }
        // Partner API keys act as operator (ingest + outcomes), not admin.
        if (!roleAtLeast("operator", minimum)) {
          res.status(403).json({ error: "api_key_insufficient_role" });
          return;
        }
        req.orgId = orgId;
        req.orgRole = "operator";
        req.authVia = "api_key";
        next();
        return;
      }

      await attachDeviceUid(req);
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const role = await getMemberRole(orgId, req.uid);
      if (!role || !roleAtLeast(role, minimum)) {
        res.status(403).json({ error: "forbidden" });
        return;
      }
      req.orgId = orgId;
      req.orgRole = role;
      req.authVia = "device";
      next();
    } catch (err) {
      next(err);
    }
  };
}
