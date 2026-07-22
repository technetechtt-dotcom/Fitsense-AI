import { getApiBaseUrl } from "../api/config";
import { ensureSignedIn } from "./auth";
import type { FitProfile } from "../../types";

/**
 * Recoverable Portable Fit Identity via one-time server recovery codes.
 * Complements the local FSP1 share token in `portableFitIdentity.ts`.
 */
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
