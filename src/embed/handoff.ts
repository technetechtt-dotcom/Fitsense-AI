import { resolveHandoffBaseUrl } from "../lib/api/config";
import type { EmbedScanSummary, EmbedSizeResult } from "./types";

/**
 * FitSense AI · Cross-device handoff
 *
 * Desktop creates a server session (publish + consume tokens), embeds
 * sessionId + publishToken in the phone QR URL, phone PUTs with publish
 * Bearer, desktop POSTs consume with consume Bearer (one-time).
 *
 * Production transport contract:
 *
 *     POST /v1/handoff/sessions              → 201 { sessionId, publishToken, consumeToken }
 *     PUT  /v1/handoff/{sessionId}           Authorization: Bearer publishToken  body: { payload } → 204
 *     POST /v1/handoff/{sessionId}/consume   Authorization: Bearer consumeToken → 200 { payload? }
 *     DELETE /v1/handoff/{sessionId}         Authorization: Bearer consumeToken → 204
 */

/** Payload published by the phone, consumed by the desktop. */
export interface HandoffPayload {
  size: EmbedSizeResult;
  scan: EmbedScanSummary;
  completedAtEpochMs: number;
  /** Schema version, in case we evolve the payload. */
  v: 1;
}

export interface HandoffSessionTokens {
  sessionId: string;
  publishToken: string;
  consumeToken: string;
  expiresAtEpochMs: number;
}

export interface HandoffTransport {
  readonly kind: "http" | "broadcast";
  /** Create a server-issued session (HTTP only). Broadcast invents a local id. */
  createSession: () => Promise<HandoffSessionTokens>;
  publish: (
    sessionId: string,
    payload: HandoffPayload,
    publishToken: string,
  ) => Promise<void>;
  subscribe: (
    sessionId: string,
    consumeToken: string,
    onPayload: (payload: HandoffPayload) => void,
  ) => () => void;
  cancel?: (sessionId: string, consumeToken: string) => Promise<void>;
}

export interface HandoffConfig {
  /** Base URL of the relay server (e.g. "https://api.fitsense.ai"). */
  baseUrl?: string;
  /** Force a transport. Defaults to `auto`. */
  transport?: "http" | "broadcast" | "auto";
  /** Poll interval when using HTTP short-polling. Default 1500ms. */
  pollMs?: number;
  /** Server session id (phone receiver / desktop after create). */
  sessionId?: string;
  /** Publish Bearer for the phone QR path. */
  publishToken?: string;
}

const POLL_DEFAULT_MS = 1500;

/** Local-only session id for broadcast fallback (not used with HTTP relay). */
export function newSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function localOpaqueToken(): string {
  const bytes = new Uint8Array(24);
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
  const sessionUrl = (id: string) => `${trimmed}/v1/handoff/${encodeURIComponent(id)}`;
  const consumeUrl = (id: string) => `${sessionUrl(id)}/consume`;

  return {
    kind: "http",
    async createSession() {
      const res = await fetch(`${trimmed}/v1/handoff/sessions`, {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: "{}",
      });
      if (!res.ok) {
        throw new Error(`handoff session create failed: HTTP ${res.status}`);
      }
      const body = (await res.json()) as Partial<HandoffSessionTokens>;
      if (!body.sessionId || !body.publishToken || !body.consumeToken) {
        throw new Error("handoff session create returned incomplete tokens");
      }
      return {
        sessionId: body.sessionId,
        publishToken: body.publishToken,
        consumeToken: body.consumeToken,
        expiresAtEpochMs: body.expiresAtEpochMs ?? Date.now() + 5 * 60 * 1000,
      };
    },
    async publish(sessionId, payload, publishToken) {
      const res = await fetch(sessionUrl(sessionId), {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${publishToken}`,
        },
        body: JSON.stringify({ payload }),
        keepalive: true,
      });
      if (!res.ok) {
        throw new Error(`handoff publish failed: HTTP ${res.status}`);
      }
    },
    subscribe(sessionId, consumeToken, onPayload) {
      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const poll = async () => {
        if (cancelled) return;
        try {
          const res = await fetch(consumeUrl(sessionId), {
            method: "POST",
            headers: {
              accept: "application/json",
              authorization: `Bearer ${consumeToken}`,
            },
          });
          if (cancelled) return;
          if (res.status === 409) {
            // Already consumed elsewhere — stop.
            return;
          }
          if (res.ok) {
            const body = (await res.json().catch(() => null)) as {
              payload?: HandoffPayload;
            } | null;
            if (body?.payload && isValidPayload(body.payload)) {
              onPayload(body.payload);
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
    async cancel(sessionId, consumeToken) {
      await fetch(sessionUrl(sessionId), {
        method: "DELETE",
        headers: { authorization: `Bearer ${consumeToken}` },
      }).catch(() => undefined);
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
    async createSession() {
      return {
        sessionId: newSessionId(),
        publishToken: localOpaqueToken(),
        consumeToken: localOpaqueToken(),
        expiresAtEpochMs: Date.now() + 5 * 60 * 1000,
      };
    },
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
      try {
        const key = `fitsense:handoff:${sessionId}`;
        localStorage.setItem(key, JSON.stringify({ payload, ts: Date.now() }));
        setTimeout(() => localStorage.removeItem(key), 5 * 60 * 1000);
      } catch {
        // localStorage might be disabled — fine
      }
    },
    subscribe(sessionId, _consumeToken, onPayload) {
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
