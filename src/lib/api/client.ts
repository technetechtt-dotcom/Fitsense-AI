import { getIdToken, refreshIdToken } from "../cloud/auth";
import { getApiBaseUrl, getApiDebugUid } from "./config";

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = getApiBaseUrl();
  if (base === null) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  const doFetch = async (token: string | null): Promise<Response> => {
    const debugUid = getApiDebugUid();
    const headers = new Headers(init.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else if (debugUid) {
      headers.set("X-Debug-Uid", debugUid);
    }
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(`${base}${path}`, { ...init, headers });
  };

  const token = await getIdToken();
  const res = await doFetch(token);
  if (res.status !== 401 || !token) return res;

  const refreshed = await refreshIdToken();
  if (!refreshed) return res;
  return doFetch(refreshed);
}
