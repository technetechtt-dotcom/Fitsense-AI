import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";

const PREFIX = "fsenc1:";

function keyMaterial(): Buffer {
  const secret = config.authSecret || config.handoffSecret;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET required to seal webhook secrets");
  }
  return createHash("sha256").update(`fitsense-webhook-seal:${secret}`).digest();
}

/** AES-256-GCM seal for webhook signing secrets at rest. */
export function sealSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyMaterial(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function openSecret(sealedOrPlain: string): string {
  if (!sealedOrPlain.startsWith(PREFIX)) {
    // Legacy plaintext rows until rotated.
    return sealedOrPlain;
  }
  const body = sealedOrPlain.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = body.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("webhook_secret_corrupt");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    keyMaterial(),
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
