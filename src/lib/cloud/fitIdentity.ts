import { getApiBaseUrl } from "../api/config";
import { ensureSignedIn } from "./auth";
import type { FitProfile } from "../../types";

/**
 * Recoverable Portable Fit Identity via one-time server recovery codes.
 * Complements the local FSP1 share token in `portableFitIdentity.ts`.
 * Merchant share grants are consent-bound FSMS1 tokens redeemable only by
 * the granted organisation's API key.
 */

export type FitShareGrantSummary = {
  grantId: string;
  orgId: string;
  fitId: string;
  purpose: string;
  expiresAtEpochMs: number;
  revoked: boolean;
  redeemed: boolean;
};

export async function issueFitRecoveryCode(
  profile: FitProfile,
): Promise<{ recoveryCode: string; expiresAtEpochMs: number } | null> {
  const base = getApiBaseUrl();
  if (base === null) return null;
  const token = await ensureSignedIn();
  if (!token) return null;
  const res = await fetch(`${base}/v1/fit-identity/recovery-codes`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fitProfile: profile }),
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    recoveryCode: string;
    expiresAtEpochMs: number;
  };
}

export async function recoverFitWithCode(
  recoveryCode: string,
): Promise<FitProfile | null> {
  const base = getApiBaseUrl();
  if (base === null) return null;
  const res = await fetch(`${base}/v1/fit-identity/recover`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recoveryCode: recoveryCode.trim() }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { fitProfile?: FitProfile };
  return body.fitProfile ?? null;
}

export async function createFitShareGrant(input: {
  orgId: string;
  fitProfile: FitProfile;
  purpose?: string;
}): Promise<{
  grantId: string;
  shareToken: string;
  expiresAtEpochMs: number;
  orgId: string;
  purpose: string;
} | null> {
  const base = getApiBaseUrl();
  if (base === null) return null;
  const token = await ensureSignedIn();
  if (!token) return null;
  const res = await fetch(`${base}/v1/fit-identity/share-grants`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    grantId: string;
    shareToken: string;
    expiresAtEpochMs: number;
    orgId: string;
    purpose: string;
  };
}

export async function listFitShareGrants(): Promise<FitShareGrantSummary[]> {
  const base = getApiBaseUrl();
  if (base === null) return [];
  const token = await ensureSignedIn();
  if (!token) return [];
  const res = await fetch(`${base}/v1/fit-identity/share-grants`, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return [];
  const body = (await res.json()) as { grants?: FitShareGrantSummary[] };
  return body.grants ?? [];
}

export async function revokeFitShareGrant(grantId: string): Promise<boolean> {
  const base = getApiBaseUrl();
  if (base === null) return false;
  const token = await ensureSignedIn();
  if (!token) return false;
  const res = await fetch(
    `${base}/v1/fit-identity/share-grants/${encodeURIComponent(grantId)}/revoke`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.status === 204;
}
