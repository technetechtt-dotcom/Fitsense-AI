import { getApiBaseUrl } from "./config";
import { apiFetch } from "./client";
import { registerMerchantBrandFits } from "../../data/brandFit";
import type { BrandFitDelta } from "../../types";

/**
 * Load merchant brand/model fit profiles into the recommendation layer.
 * Prefer partner API key for kiosk/embed; falls back to device Bearer.
 */

export function getMerchantOrgId(): string | null {
  return import.meta.env.VITE_MERCHANT_ORG_ID?.trim() || null;
}

export function getMerchantApiKey(): string | null {
  return import.meta.env.VITE_MERCHANT_API_KEY?.trim() || null;
}

type BrandFitRow = BrandFitDelta & { model?: string };

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
