import { getIdToken } from "../cloud/auth";
import { getApiBaseUrl, getApiDebugUid } from "./config";

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = getApiBaseUrl();
  if (base === null) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }
  const token = await getIdToken();
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
}
