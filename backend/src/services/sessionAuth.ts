import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface SessionPayload {
  uid: string;
  exp: number;
}

const UID_PATTERN = /^[A-Za-z0-9_.:-]{1,128}$/;

export function isValidUid(uid: string): boolean {
  return UID_PATTERN.test(uid);
}

function getSecret(secretOverride?: string): string {
  const secret = secretOverride ?? config.authSecret;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return secret;
}

export function issueSessionToken(uid: string, secretOverride?: string): string {
  const secret = getSecret(secretOverride);
  const payload: SessionPayload = {
    uid,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string, secretOverride?: string): string {
  const secret = getSecret(secretOverride);
  const [body, signature] = token.split(".");
  if (!body || !signature) {
    throw new Error("Invalid token format");
  }
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error("Invalid token signature");
  }
  const payload = JSON.parse(
    Buffer.from(body, "base64url").toString("utf8"),
  ) as SessionPayload;
  if (!payload.uid || !isValidUid(payload.uid)) {
    throw new Error("Invalid token uid");
  }
  if (!Number.isFinite(payload.exp) || payload.exp < Date.now()) {
    throw new Error("Token expired");
  }
  return payload.uid;
}
