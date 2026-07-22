import { getApiBaseUrl, isApiConfigured } from "../api/config";

/**
 * Device-scoped identity for API-backed cloud sync.
 *
 * Each browser gets a stable device id in localStorage. The FitSense API
 * issues a signed session token for that id — no third-party auth provider.
 */

const DEVICE_ID_KEY = "fitsense:deviceId";
const SESSION_TOKEN_KEY = "fitsense:sessionToken";

let signInPromise: Promise<string | null> | null = null;

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function readCachedToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

function cacheToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

async function requestSessionToken(deviceId: string): Promise<string | null> {
  const base = getApiBaseUrl();
  if (base === null) return null;

  const res = await fetch(`${base}/v1/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  if (!res.ok) {
    console.warn("[fitsense] session issuance failed", res.status);
    return null;
  }
  const body = (await res.json()) as { token?: string };
  if (!body.token) return null;
  cacheToken(body.token);
  return body.token;
}

/** Ensure this device has a cloud session. Returns the device uid or null. */
export function ensureSignedIn(): Promise<string | null> {
  if (!isApiConfigured()) return Promise.resolve(null);
  if (signInPromise) return signInPromise;

  signInPromise = (async () => {
    const deviceId = getOrCreateDeviceId();
    const cached = readCachedToken();
    if (cached) return deviceId;
    await requestSessionToken(deviceId);
    return deviceId;
  })().catch(() => {
    signInPromise = null;
    return null;
  });

  return signInPromise;
}

/** Returns the current device uid or null. Does not trigger sign-in. */
export async function currentUid(): Promise<string | null> {
  if (!isApiConfigured()) return null;
  return localStorage.getItem(DEVICE_ID_KEY);
}

/** Session bearer token for API requests (`Authorization: Bearer`). */
export async function getIdToken(): Promise<string | null> {
  if (!isApiConfigured()) return null;
  const cached = readCachedToken();
  if (cached) return cached;
  await ensureSignedIn();
  return readCachedToken();
}

export async function signOutCloudAccount(): Promise<void> {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(DEVICE_ID_KEY);
  resetAuthCache();
}

/** Force a re-auth on next call. Used by the erase flow. */
export function resetAuthCache(): void {
  signInPromise = null;
  localStorage.removeItem(SESSION_TOKEN_KEY);
}
