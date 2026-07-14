import type { FitProfile } from "../types";
import { FIT_PROFILE_DEFAULT } from "../types";

/**
 * Portable Fit Identity — encodes a {@link FitProfile} into a compact
 * URL-safe token the user (or a partner) can pass between devices and
 * sites. The token is intentionally tiny (single base64 string < 300
 * chars) so it can:
 *
 *   - travel inside a QR code without falling back to URL fallback,
 *   - sit in a deep-link query param,
 *   - be pasted into another partner's checkout for instant
 *     personalisation,
 *   - or be embedded in a postMessage via the embed bridge.
 *
 * Format (v1):
 *
 *   FSP1.<base64url(json)>
 *
 * The leading sentinel keeps future revisions backwards-compatible. The
 * payload omits volatile fields (insights, createdAtEpochMs) — those are
 * re-derived on import.
 */

const SENTINEL = "FSP1.";

/** Compact subset of FitProfile carried by the token. */
interface PortablePayload {
  v: 1;
  fitId: string;
  l?: number; // lengthMm
  w?: number; // widthMm
  a?: number; // asymmetryMm
  wc: string; // widthClass
  ar: string; // archHeight
  t: string; // toeShape
  c: string; // comfortFit
  m: string; // preferredMidsoleFeel
  fb: string[]; // favouriteBrands
  by?: number; // birthYear (optional, only if user opted in)
}

export function exportFitToken(profile: FitProfile): string {
  const payload: PortablePayload = {
    v: 1,
    fitId: profile.fitId,
    l: profile.lengthMm,
    w: profile.widthMm,
    a: profile.asymmetryMm,
    wc: profile.widthClass,
    ar: profile.archHeight,
    t: profile.toeShape,
    c: profile.comfortFit,
    m: profile.preferredMidsoleFeel,
    fb: profile.favouriteBrands ?? [],
    by: profile.birthYear,
  };
  const json = JSON.stringify(payload);
  return SENTINEL + base64UrlEncode(json);
}

/**
 * Decode a token back to a {@link FitProfile}. Returns `null` if the
 * token is malformed; callers should preserve the existing profile in
 * that case.
 *
 * The `userId` field is left to the caller — typically you'd splice in
 * the local user's id so the imported profile attaches to *this* device.
 */
export function importFitToken(
  token: string,
  userId: string,
): FitProfile | null {
  if (!token.startsWith(SENTINEL)) return null;
  const body = token.slice(SENTINEL.length);
  try {
    const json = base64UrlDecode(body);
    const data = JSON.parse(json) as PortablePayload;
    if (data.v !== 1 || typeof data.fitId !== "string") return null;
    const now = Date.now();
    return {
      ...FIT_PROFILE_DEFAULT,
      fitId: data.fitId,
      userId,
      lengthMm: typeof data.l === "number" ? data.l : undefined,
      widthMm: typeof data.w === "number" ? data.w : undefined,
      asymmetryMm: typeof data.a === "number" ? data.a : undefined,
      widthClass: castEnum(
        data.wc,
        ["narrow", "regular", "wide", "extra_wide"] as const,
        "regular",
      ),
      archHeight: castEnum(
        data.ar,
        ["low", "medium", "high", "unknown"] as const,
        "unknown",
      ),
      toeShape: castEnum(
        data.t,
        ["egyptian", "greek", "roman", "square", "rounded", "unknown"] as const,
        "unknown",
      ),
      comfortFit: castEnum(
        data.c,
        ["snug", "standard", "relaxed"] as const,
        "standard",
      ),
      preferredMidsoleFeel: castEnum(
        data.m,
        ["firm", "balanced", "soft", "unknown"] as const,
        "unknown",
      ),
      favouriteBrands: Array.isArray(data.fb) ? data.fb : [],
      birthYear:
        typeof data.by === "number" && data.by > 1900 && data.by < 2100
          ? data.by
          : undefined,
      createdAtEpochMs: now,
      updatedAtEpochMs: now,
    };
  } catch {
    return null;
  }
}

function castEnum<T extends readonly string[]>(
  value: unknown,
  options: T,
  fallback: T[number],
): T[number] {
  return (options.includes(value as T[number]) ? value : fallback) as T[number];
}

function base64UrlEncode(input: string): string {
  // Node-style helper isn't available in older Safari; use btoa with a
  // tiny URL-safe transform.
  const b64 = typeof btoa === "function"
    ? btoa(unescape(encodeURIComponent(input)))
    : Buffer.from(input, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const b64 = padded + padding;
  if (typeof atob === "function") {
    return decodeURIComponent(escape(atob(b64)));
  }
  return Buffer.from(b64, "base64").toString("utf8");
}
