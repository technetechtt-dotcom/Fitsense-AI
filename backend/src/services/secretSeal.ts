import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";

export const SEAL_PREFIX = "fsenc1:";

function keyMaterial(): string {
  const secret = config.webhookSealSecret;
  if (!secret || secret.length < 16) {
    throw new Error(
      "WEBHOOK_SEAL_SECRET (or AUTH_SECRET in non-production) required to seal webhook secrets",
    );
  }
  return secret;
}

/** v1+ keyed by version; legacy (no version in ciphertext) uses pre-011 derivation. */
function keyForVersion(version: string | null): Buffer {
  const material = keyMaterial();
  if (!version || version === "legacy") {
    return createHash("sha256").update(`fitsense-webhook-seal:${material}`).digest();
  }
  return createHash("sha256")
    .update(`fitsense-webhook-seal:${version}:${material}`)
    .digest();
}

/** AES-256-GCM seal for webhook signing secrets at rest. */
export function sealSecret(
  plaintext: string,
  keyVersion = config.webhookSealKeyVersion,
): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyForVersion(keyVersion), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${SEAL_PREFIX}${keyVersion}.${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function openSecret(sealedOrPlain: string): string {
  if (!sealedOrPlain.startsWith(SEAL_PREFIX)) {
    return sealedOrPlain;
  }
  const body = sealedOrPlain.slice(SEAL_PREFIX.length);
  const parts = body.split(".");
  let version: string | null = null;
  let ivB64: string;
  let tagB64: string;
  let dataB64: string;
  if (parts.length === 4) {
    [version, ivB64, tagB64, dataB64] = parts;
  } else if (parts.length === 3) {
    // Pre-011 ciphertext (no key version embedded).
    version = "legacy";
    [ivB64, tagB64, dataB64] = parts;
  } else {
    throw new Error("webhook_secret_corrupt");
  }
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("webhook_secret_corrupt");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    keyForVersion(version),
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function isSealedSecret(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(SEAL_PREFIX));
}
