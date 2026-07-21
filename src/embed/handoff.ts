import { resolveHandoffBaseUrl } from "../lib/api/config";
import type { EmbedScanSummary, EmbedSizeResult } from "./types";

/**
 * FitSense AI · Cross-device handoff
 *
 * When the fit finder is opened on a desktop browser the AR scan can't run
 * locally, so we offer a QR-code handoff: the desktop iframe shows a QR
 * pointing at the same embed URL but with a unique `session=` token, the
 * user scans on their phone, completes the scan there, and the phone
 * publishes the size result back to the desktop via a small relay.
 *
 * This module defines:
 *  - the payload format
 *  - the [HandoffTransport] interface
 *  - two implementations:
 *      • `createHttpTransport`    – production (any partner-hostable HTTP relay)
 *      • `createBroadcastTransport` – local fallback (same-browser tabs)
 *  - `createHandoffTransport`     – auto-select based on config / capabilities
 *
 * Production transport contract:
 *
 *     PUT  /v1/handoff/{sessionId}          body: { payload }   → 204
 *     GET  /v1/handoff/{sessionId}          → 200 { payload? }  (long-poll or short-poll)
 *     DELETE /v1/handoff/{sessionId}        → 204               (single-use cleanup)
 *
 * Sessions MUST expire server-side after a few minutes; payloads are
 * single-use. See INTEGRATION.md for a reference Node/Express server.
 */

/** Payload published by the phone, consumed by the desktop. */
export interface HandoffPayload {
  size: EmbedSizeResult;
  scan: EmbedScanSummary;
  completedAtEpochMs: number;
  /** Schema version, in case we evolve the payload. */
  v: 1;
}

export interface HandoffTransport {
  readonly kind: "http" | "broadcast";
  publish: (sessionId: string, payload: HandoffPayload) => Promise<void>;
  subscribe: (
    sessionId: string,
    onPayload: (payload: HandoffPayload) => void,
  ) => () => void;
}

export interface HandoffConfig {
  /** Base URL of the relay server (e.g. "https://api.fitsense.ai"). */
  baseUrl?: string;
  /** Force a transport. Defaults to `auto`. */
  transport?: "http" | "broadcast" | "auto";
  /** Poll interval when using HTTP short-polling. Default 1500ms. */
  pollMs?: number;
}

const POLL_DEFAULT_MS = 1500;

// ─── Session IDs ─────────────────────────────────────────────────────────

/**
 * Generates a 22-character URL-safe random session id (~132 bits of
 * entropy). Uses `crypto.getRandomValues` and base64url-encodes the bytes.
 */
export function newSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── HTTP transport ──────────────────────────────────────────────────────

export function createHttpTransport(
  baseUrl: string,
  pollMs: number = POLL_DEFAULT_MS,
): HandoffTransport {
  const trimmed = baseUrl.replace(/\/+$/, "");
  const url = (id: string) => `${trimmed}/v1/handoff/${encodeURIComponent(id)}`;

  return {
    kind: "http",
    async publish(sessionId, payload) {
      const res = await fetch(url(sessionId), {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payload }),
        keepalive: true,
      });
      if (!res.ok) {
        throw new Error(`handoff publish failed: HTTP ${res.status}`);
      }
    },
    subscribe(sessionId, onPayload) {
      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const poll = async () => {
        if (cancelled) return;
        try {
          const res = await fetch(url(sessionId), {
            headers: { accept: "application/json" },
          });
          if (cancelled) return;
          if (res.ok) {
            const body = (await res.json().catch(() => null)) as {
              payload?: HandoffPayload;
            } | null;
            if (body?.payload && isValidPayload(body.payload)) {
              onPayload(body.payload);
              // Best-effort cleanup; ignore errors.
              fetch(url(sessionId), { method: "DELETE" }).catch(() => undefined);
              return;
            }
          }
        } catch {
          // network blip — keep polling
        }
        timer = setTimeout(poll, pollMs);
      };
      poll();
      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
      };
    },
  };
}

// ─── BroadcastChannel transport (same-browser fallback) ──────────────────

interface BroadcastFrame {
  fitsenseHandoff: true;
  sessionId: string;
  payload: HandoffPayload;
}

export function createBroadcastTransport(): HandoffTransport {
  const CHANNEL = "fitsense:handoff";
  const safeChannel = () =>
    typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL) : null;

  return {
    kind: "broadcast",
    async publish(sessionId, payload) {
      const ch = safeChannel();
      if (ch) {
        const frame: BroadcastFrame = {
          fitsenseHandoff: true,
          sessionId,
          payload,
        };
        ch.postMessage(frame);
        ch.close();
      }
      // Also persist briefly in localStorage so a slow-mounting subscriber
      // on the same origin can still pick it up.
      try {
        const key = `fitsense:handoff:${sessionId}`;
        localStorage.setItem(key, JSON.stringify({ payload, ts: Date.now() }));
        // Self-clean after 5 minutes.
        setTimeout(() => localStorage.removeItem(key), 5 * 60 * 1000);
      } catch {
        // localStorage might be disabled — fine
      }
    },
    subscribe(sessionId, onPayload) {
      let cancelled = false;
      const ch = safeChannel();
      const handler = (event: MessageEvent) => {
        const data = event.data as BroadcastFrame | undefined;
        if (!data || data.fitsenseHandoff !== true) return;
        if (data.sessionId !== sessionId) return;
        if (cancelled) return;
        if (isValidPayload(data.payload)) onPayload(data.payload);
      };
      ch?.addEventListener("message", handler);

      // Also poll localStorage in case the publish landed before subscribe.
      const key = `fitsense:handoff:${sessionId}`;
      const lsTimer = setInterval(() => {
        if (cancelled) return;
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return;
          const parsed = JSON.parse(raw) as { payload?: HandoffPayload };
          if (parsed?.payload && isValidPayload(parsed.payload)) {
            localStorage.removeItem(key);
            onPayload(parsed.payload);
          }
        } catch {
          // ignore
        }
      }, 600);

      return () => {
        cancelled = true;
        ch?.removeEventListener("message", handler);
        ch?.close();
        clearInterval(lsTimer);
      };
    },
  };
}

// ─── Auto selection ──────────────────────────────────────────────────────

export function createHandoffTransport(cfg?: HandoffConfig): HandoffTransport {
  const baseUrl = resolveHandoffBaseUrl(cfg?.baseUrl);
  const preferred = cfg?.transport ?? "auto";
  if (preferred === "http") {
    if (baseUrl === undefined) {
      throw new Error("HTTP handoff selected but no baseUrl configured.");
    }
    return createHttpTransport(baseUrl, cfg?.pollMs);
  }
  if (preferred === "broadcast") {
    return createBroadcastTransport();
  }
  // auto — use API relay when VITE_API_BASE_URL is set
  if (baseUrl !== undefined) {
    return createHttpTransport(baseUrl, cfg?.pollMs);
  }
  return createBroadcastTransport();
}

// ─── Validation ──────────────────────────────────────────────────────────

function isValidPayload(p: unknown): p is HandoffPayload {
  if (!p || typeof p !== "object") return false;
  const obj = p as Partial<HandoffPayload>;
  return (
    obj.v === 1 &&
    !!obj.size &&
    typeof obj.size === "object" &&
    typeof (obj.size as EmbedSizeResult).uk === "string" &&
    !!obj.scan &&
    typeof obj.scan === "object" &&
    typeof (obj.scan as EmbedScanSummary).scanId === "string" &&
    typeof obj.completedAtEpochMs === "number"
  );
}
