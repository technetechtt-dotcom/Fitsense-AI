import { getApiBaseUrl } from "./config";
import { apiFetch } from "./client";
import { registerMerchantBrandFits } from "../../data/brandFit";
import type { BrandFitDelta } from "../../types";

/**
 * Merchant platform client — brand-fit bootstrap, orgs, catalogue, inventory,
 * outcomes, metrics, API keys.
 */

const ORG_STORAGE_KEY = "fitsense:merchantOrgId";

export function getMerchantOrgId(): string | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(ORG_STORAGE_KEY)?.trim();
    if (stored) return stored;
  }
  return import.meta.env.VITE_MERCHANT_ORG_ID?.trim() || null;
}

export function setMerchantOrgId(orgId: string | null): void {
  if (typeof window === "undefined") return;
  if (!orgId) localStorage.removeItem(ORG_STORAGE_KEY);
  else localStorage.setItem(ORG_STORAGE_KEY, orgId);
}

export function getMerchantApiKey(): string | null {
  return import.meta.env.VITE_MERCHANT_API_KEY?.trim() || null;
}

async function merchantFetch(
  path: string,
  init: RequestInit = {},
  opts?: { apiKey?: string | null },
): Promise<Response> {
  const base = getApiBaseUrl();
  if (base === null) throw new Error("VITE_API_BASE_URL is not configured");

  const apiKey = opts?.apiKey ?? getMerchantApiKey();
  if (apiKey) {
    const headers = new Headers(init.headers);
    headers.set("X-Api-Key", apiKey);
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(`${base}${path}`, { ...init, headers });
  }
  return apiFetch(path, init);
}

type BrandFitRow = BrandFitDelta & { model?: string };

/** Load merchant brand/model fit profiles into the recommendation layer. */
export async function loadMerchantBrandFits(
  orgId = getMerchantOrgId(),
): Promise<number> {
  if (!orgId || getApiBaseUrl() === null) return 0;

  const path = `/v1/merchants/orgs/${encodeURIComponent(orgId)}/brand-fit`;
  const apiKey = getMerchantApiKey();
  const res = apiKey
    ? await fetch(`${getApiBaseUrl()}${path}`, {
        headers: { "X-Api-Key": apiKey },
      })
    : await apiFetch(path);

  if (!res.ok) {
    throw new Error(`brand-fit fetch failed: ${res.status}`);
  }

  const body = (await res.json()) as { profiles?: BrandFitRow[] };
  const profiles = body.profiles ?? [];
  registerMerchantBrandFits(profiles);
  return profiles.length;
}

export type MerchantOrg = {
  orgId: string;
  name: string;
  region: string | null;
  role?: string;
};

export type CatalogueProduct = {
  productId: string;
  brand: string;
  model: string;
  category?: string;
  fitType?: string;
  sizeRangeEu?: { min: number; max: number; step?: number };
  priceUsd?: number;
  description?: string;
  colorways?: string[];
  dataQuality?: string;
  [key: string]: unknown;
};

export type PilotMetrics = {
  purchases: number;
  returns: number;
  exchanges: number;
  returnRate: number | null;
  exchangeRate: number | null;
  sizeRelatedRate: number | null;
};

export type ApiKeyRow = {
  keyId: string;
  label: string;
  createdAtEpochMs: number;
  revoked: boolean;
};

export async function createMerchantOrg(input: {
  name: string;
  region?: string;
}): Promise<MerchantOrg> {
  const res = await apiFetch("/v1/merchants/orgs", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`create org failed: ${res.status}`);
  const body = (await res.json()) as MerchantOrg;
  setMerchantOrgId(body.orgId);
  return body;
}

export async function listMerchantOrgs(): Promise<MerchantOrg[]> {
  const res = await apiFetch("/v1/merchants/orgs");
  if (!res.ok) throw new Error(`list orgs failed: ${res.status}`);
  const body = (await res.json()) as { orgs?: MerchantOrg[] };
  return body.orgs ?? [];
}

export async function ingestCatalogue(
  orgId: string,
  products: CatalogueProduct[],
): Promise<{ upserted: number }> {
  const res = await merchantFetch(
    `/v1/merchants/orgs/${encodeURIComponent(orgId)}/catalogue/ingest`,
    { method: "POST", body: JSON.stringify({ products }) },
  );
  if (!res.ok) throw new Error(`catalogue ingest failed: ${res.status}`);
  return (await res.json()) as { upserted: number };
}

export async function listCatalogue(orgId: string): Promise<CatalogueProduct[]> {
  const res = await merchantFetch(
    `/v1/merchants/orgs/${encodeURIComponent(orgId)}/catalogue`,
  );
  if (!res.ok) throw new Error(`catalogue list failed: ${res.status}`);
  const body = (await res.json()) as { products?: CatalogueProduct[] };
  return body.products ?? [];
}

export async function upsertInventory(
  orgId: string,
  items: Array<{
    productId: string;
    sizeSystem: "uk" | "us" | "eu" | "mondopoint";
    sizeLabel: string;
    quantity: number;
  }>,
): Promise<{ upserted: number }> {
  const res = await merchantFetch(
    `/v1/merchants/orgs/${encodeURIComponent(orgId)}/inventory`,
    { method: "PUT", body: JSON.stringify({ items }) },
  );
  if (!res.ok) throw new Error(`inventory upsert failed: ${res.status}`);
  return (await res.json()) as { upserted: number };
}

export async function recordMerchantOutcome(
  orgId: string,
  input: {
    kind: "purchase" | "return" | "exchange";
    productId?: string;
    brand?: string;
    sizeLabel?: string;
    sizeSystem?: "uk" | "us" | "eu" | "mondopoint";
    fitId?: string;
    reason?: string;
    orderId?: string;
    data?: Record<string, unknown>;
  },
): Promise<{ outcomeId: string }> {
  const res = await merchantFetch(
    `/v1/merchants/orgs/${encodeURIComponent(orgId)}/outcomes`,
    { method: "POST", body: JSON.stringify(input) },
  );
  if (!res.ok) throw new Error(`outcome failed: ${res.status}`);
  return (await res.json()) as { outcomeId: string };
}

export async function fetchPilotMetrics(
  orgId: string,
  sinceEpochMs?: number,
): Promise<PilotMetrics> {
  const q =
    sinceEpochMs === undefined
      ? ""
      : `?sinceEpochMs=${encodeURIComponent(String(sinceEpochMs))}`;
  const res = await merchantFetch(
    `/v1/merchants/orgs/${encodeURIComponent(orgId)}/pilot-metrics${q}`,
  );
  if (!res.ok) throw new Error(`pilot metrics failed: ${res.status}`);
  return (await res.json()) as PilotMetrics;
}

export async function createOrgApiKey(
  orgId: string,
  label: string,
): Promise<{ keyId: string; apiKey: string; label: string }> {
  const res = await apiFetch(
    `/v1/merchants/orgs/${encodeURIComponent(orgId)}/api-keys`,
    { method: "POST", body: JSON.stringify({ label }) },
  );
  if (!res.ok) throw new Error(`create api key failed: ${res.status}`);
  return (await res.json()) as { keyId: string; apiKey: string; label: string };
}

export async function listOrgApiKeys(orgId: string): Promise<ApiKeyRow[]> {
  const res = await apiFetch(
    `/v1/merchants/orgs/${encodeURIComponent(orgId)}/api-keys`,
  );
  if (!res.ok) throw new Error(`list api keys failed: ${res.status}`);
  const body = (await res.json()) as { keys?: ApiKeyRow[] };
  return body.keys ?? [];
}

export async function revokeOrgApiKey(orgId: string, keyId: string): Promise<void> {
  const res = await apiFetch(
    `/v1/merchants/orgs/${encodeURIComponent(orgId)}/api-keys/${encodeURIComponent(keyId)}/revoke`,
    { method: "POST" },
  );
  if (res.status !== 204) throw new Error(`revoke api key failed: ${res.status}`);
}
