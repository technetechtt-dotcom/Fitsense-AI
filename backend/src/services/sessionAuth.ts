import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

const UID_PATTERN = /^[A-Za-z0-9_.:-]{1,128}$/;

export function isValidUid(uid: string): boolean {
  return UID_PATTERN.test(uid);
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function generateDeviceId(): string {
  return `dev_${randomBytes(16).toString("base64url")}`;
}

export function hmacProof(secret: string, nonce: string): string {
  return createHmac("sha256", secret).update(nonce).digest("base64url");
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

interface AccessPayload {
  uid: string;
  exp: number;
  jti: string;
  kid: string;
  typ: "access";
}

export function issueAccessToken(
  uid: string,
  options?: { secret?: string; kid?: string; ttlMs?: number; jti?: string },
): { token: string; jti: string; exp: number } {
  const secret = options?.secret ?? config.authSecret;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  const jti = options?.jti ?? generateOpaqueToken(16);
  const exp = Date.now() + (options?.ttlMs ?? config.accessTokenTtlMs);
  const payload: AccessPayload = {
    uid,
    exp,
    jti,
    kid: options?.kid ?? config.authKid,
    typ: "access",
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return { token: `${body}.${signature}`, jti, exp };
}

export function verifyAccessToken(
  token: string,
  options?: { secret?: string },
): AccessPayload {
  const secret = options?.secret ?? config.authSecret;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  const [body, signature] = token.split(".");
  if (!body || !signature) throw new Error("Invalid token format");
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (!timingSafeEqualString(signature, expected)) {
    throw new Error("Invalid token signature");
  }
  const payload = JSON.parse(
    Buffer.from(body, "base64url").toString("utf8"),
  ) as AccessPayload;
  if (payload.typ !== "access") throw new Error("Invalid token type");
  if (!payload.uid || !isValidUid(payload.uid)) throw new Error("Invalid token uid");
  if (!payload.jti) throw new Error("Invalid token jti");
  if (!Number.isFinite(payload.exp) || payload.exp < Date.now()) {
    throw new Error("Token expired");
  }
  return payload;
}

/** @deprecated Prefer issueAccessToken — kept for unit tests of HMAC shape. */
export function issueSessionToken(uid: string, secretOverride?: string): string {
  return issueAccessToken(uid, {
    secret: secretOverride,
    ttlMs: config.accessTokenTtlMs,
  }).token;
}

/** @deprecated Prefer verifyAccessToken. */
export function verifySessionToken(token: string, secretOverride?: string): string {
  return verifyAccessToken(token, { secret: secretOverride }).uid;
}
