import { isFirebaseConfigured } from "../cloud/firebaseClient";

/** Base URL of the FitSense API (`backend/`). No trailing slash. */
export function getApiBaseUrl(): string | null {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw === undefined || raw === null) return null;
  const trimmed = String(raw).trim();
  // Empty or "/" → same-origin (Vite dev proxy to backend).
  if (trimmed === "" || trimmed === "/") {
    return import.meta.env.DEV ? "" : null;
  }
  return trimmed.replace(/\/+$/, "");
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl() !== null;
}

/** Dev-only uid when backend runs with SKIP_AUTH=true. */
export function getApiDebugUid(): string | null {
  const uid = import.meta.env.VITE_API_DEBUG_UID?.trim();
  return uid || null;
}

/**
 * Handoff relay base URL: explicit config wins, else the API base when set.
 */
export function resolveHandoffBaseUrl(explicit?: string): string | undefined {
  const fromConfig = explicit?.trim().replace(/\/+$/, "");
  if (fromConfig) return fromConfig;
  const api = getApiBaseUrl();
  if (api === null) return undefined;
  return api;
}

/** Cloud sync needs Firebase Auth for ID tokens (API proxies Firestore). */
export function canUseCloudSync(): boolean {
  return isFirebaseConfigured();
}
