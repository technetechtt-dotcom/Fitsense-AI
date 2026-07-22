import { getApiBaseUrl, isApiConfigured } from "../api/config";

/**
 * Anonymous device challenge-response auth for FitSense API sync.
 *
 * Server issues deviceId + deviceSecret once. Tokens:
 *  - access token kept in memory only (~15m)
 *  - refresh token + device credentials in sessionStorage (tab-scoped)
 *
 * Follow-ups: WebCrypto/IndexedDB hardening; Android Keystore binding.
 */

const DEVICE_ID_KEY = "fitsense:deviceId";
const DEVICE_SECRET_KEY = "fitsense:deviceSecret";
const REFRESH_TOKEN_KEY = "fitsense:refreshToken";

let memoryAccessToken: string | null = null;
let signInPromise: Promise<string | null> | null = null;
let refreshPromise: Promise<string | null> | null = null;

function sessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // private mode / blocked storage
  }
}

function sessionRemove(...keys: string[]): void {
  try {
    for (const key of keys) sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** proof = sha256(sha256(deviceSecret) + ":" + nonce) — matches server. */
async function deviceProof(deviceSecret: string, nonce: string): Promise<string> {
  const secretHash = await sha256Hex(deviceSecret);
  return sha256Hex(`${secretHash}:${nonce}`);
}

async function registerDevice(): Promise<{
  deviceId: string;
  deviceSecret: string;
} | null> {
  const base = getApiBaseUrl();
  if (base === null) return null;
  const res = await fetch(`${base}/v1/auth/devices/register`, {
    method: "POST",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) {
    console.warn("[fitsense] device registration failed", res.status);
    return null;
  }
  const body = (await res.json()) as { deviceId?: string; deviceSecret?: string };
  if (!body.deviceId || !body.deviceSecret) return null;
  sessionSet(DEVICE_ID_KEY, body.deviceId);
  sessionSet(DEVICE_SECRET_KEY, body.deviceSecret);
  return { deviceId: body.deviceId, deviceSecret: body.deviceSecret };
}

async function mintTokens(
  deviceId: string,
  deviceSecret: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const base = getApiBaseUrl();
  if (base === null) return null;

  const challengeRes = await fetch(`${base}/v1/auth/challenge`, {
    method: "POST",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  if (!challengeRes.ok) {
    console.warn("[fitsense] auth challenge failed", challengeRes.status);
    return null;
  }
  const challenge = (await challengeRes.json()) as {
    challengeId?: string;
    nonce?: string;
  };
  if (!challenge.challengeId || !challenge.nonce) return null;

  const proof = await deviceProof(deviceSecret, challenge.nonce);
  const tokenRes = await fetch(`${base}/v1/auth/token`, {
    method: "POST",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId,
      challengeId: challenge.challengeId,
      nonce: challenge.nonce,
      proof,
    }),
  });
  if (!tokenRes.ok) {
    console.warn("[fitsense] auth token failed", tokenRes.status);
    return null;
  }
  const body = (await tokenRes.json()) as {
    accessToken?: string;
    refreshToken?: string;
  };
  if (!body.accessToken || !body.refreshToken) return null;
  memoryAccessToken = body.accessToken;
  sessionSet(REFRESH_TOKEN_KEY, body.refreshToken);
  return { accessToken: body.accessToken, refreshToken: body.refreshToken };
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const base = getApiBaseUrl();
    const refreshToken = sessionGet(REFRESH_TOKEN_KEY);
    if (base === null || !refreshToken) return null;
    const res = await fetch(`${base}/v1/auth/refresh`, {
      method: "POST",
      headers: { accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      memoryAccessToken = null;
      sessionRemove(REFRESH_TOKEN_KEY);
      return null;
    }
    const body = (await res.json()) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!body.accessToken || !body.refreshToken) return null;
    memoryAccessToken = body.accessToken;
    sessionSet(REFRESH_TOKEN_KEY, body.refreshToken);
    return body.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

/** Ensure this device has a cloud session. Returns the device uid or null. */
export function ensureSignedIn(): Promise<string | null> {
  if (!isApiConfigured()) return Promise.resolve(null);
  if (signInPromise) return signInPromise;

  signInPromise = (async () => {
    let deviceId = sessionGet(DEVICE_ID_KEY);
    let deviceSecret = sessionGet(DEVICE_SECRET_KEY);
    if (!deviceId || !deviceSecret) {
      const registered = await registerDevice();
      if (!registered) return null;
      deviceId = registered.deviceId;
      deviceSecret = registered.deviceSecret;
    }
    if (memoryAccessToken) return deviceId;
    if (sessionGet(REFRESH_TOKEN_KEY)) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return deviceId;
    }
    const minted = await mintTokens(deviceId, deviceSecret);
    return minted ? deviceId : null;
  })().catch(() => {
    signInPromise = null;
    return null;
  });

  return signInPromise;
}

/** Returns the current device uid or null. Does not trigger sign-in. */
export async function currentUid(): Promise<string | null> {
  if (!isApiConfigured()) return null;
  return sessionGet(DEVICE_ID_KEY);
}

/** Session bearer token for API requests (`Authorization: Bearer`). */
export async function getIdToken(): Promise<string | null> {
  if (!isApiConfigured()) return null;
  if (memoryAccessToken) return memoryAccessToken;
  await ensureSignedIn();
  return memoryAccessToken;
}

/** Rotate access token after 401. Returns new access token or null. */
export async function refreshIdToken(): Promise<string | null> {
  if (!isApiConfigured()) return null;
  return refreshAccessToken();
}

export async function signOutCloudAccount(): Promise<void> {
  const base = getApiBaseUrl();
  const refreshToken = sessionGet(REFRESH_TOKEN_KEY);
  const accessToken = memoryAccessToken;
  if (base && (refreshToken || accessToken)) {
    try {
      await fetch(`${base}/v1/auth/logout`, {
        method: "POST",
        headers: { accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken, accessToken }),
      });
    } catch {
      // best-effort
    }
  }
  memoryAccessToken = null;
  sessionRemove(DEVICE_ID_KEY, DEVICE_SECRET_KEY, REFRESH_TOKEN_KEY);
  // Clear legacy localStorage keys from pre-challenge auth.
  try {
    localStorage.removeItem("fitsense:sessionToken");
    localStorage.removeItem("fitsense:deviceId");
  } catch {
    // ignore
  }
  resetAuthCache();
}

/** Force a re-auth on next call. Used by the erase flow. */
export function resetAuthCache(): void {
  signInPromise = null;
  refreshPromise = null;
  memoryAccessToken = null;
}
