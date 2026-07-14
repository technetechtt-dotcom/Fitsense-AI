import { getApiBaseUrl, isApiConfigured } from "./config";

export interface ApiHealth {
  ok: boolean;
  service?: string;
  version?: string;
  firestore?: boolean;
}

/** GET /health — no auth. */
export async function checkApiHealth(): Promise<ApiHealth> {
  if (!isApiConfigured()) {
    return { ok: false };
  }
  const base = getApiBaseUrl() ?? "";
  try {
    const res = await fetch(`${base}/health`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return { ok: false };
    const body = (await res.json()) as ApiHealth;
    return { ...body, ok: body.ok === true };
  } catch {
    return { ok: false };
  }
}
