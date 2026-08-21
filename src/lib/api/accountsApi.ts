import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { apiFetch } from "./client";

/** Durable customer account + passkey / consent / export helpers. */

export async function ensureCustomerAccount(body?: {
  email?: string;
  displayName?: string;
  locale?: string;
}): Promise<{ accountId: string }> {
  const res = await apiFetch("/v1/accounts", {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`account create failed: ${res.status}`);
  return (await res.json()) as { accountId: string };
}

export async function fetchMyAccount(): Promise<{
  accountId: string;
  email: string | null;
  displayName: string | null;
  locale: string;
} | null> {
  const res = await apiFetch("/v1/accounts/me");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`account fetch failed: ${res.status}`);
  return (await res.json()) as {
    accountId: string;
    email: string | null;
    displayName: string | null;
    locale: string;
  };
}

export async function exportMyAccount(): Promise<unknown> {
  const res = await apiFetch("/v1/accounts/export");
  if (!res.ok) throw new Error(`export failed: ${res.status}`);
  return res.json();
}

export async function deleteMyAccount(): Promise<void> {
  const res = await apiFetch("/v1/accounts/me", { method: "DELETE" });
  if (res.status !== 204) throw new Error(`delete failed: ${res.status}`);
}

export async function recordScanConsent(granted: boolean): Promise<void> {
  await ensureCustomerAccount();
  const res = await apiFetch("/v1/accounts/consent", {
    method: "POST",
    body: JSON.stringify({
      purpose: "scan_history",
      granted,
      version: "1.0",
    }),
  });
  if (!res.ok) throw new Error(`consent failed: ${res.status}`);
}

export function passkeysSupported(): boolean {
  return typeof window !== "undefined" && browserSupportsWebAuthn();
}

/** Register a platform authenticator (passkey) when WebAuthn is available. */
export async function registerPasskey(): Promise<{ credentialId: string }> {
  if (!passkeysSupported()) {
    throw new Error("passkeys_unsupported");
  }
  await ensureCustomerAccount({
    locale: navigator.language || "en-ZA",
  });
  const optRes = await apiFetch("/v1/accounts/webauthn/register/options", {
    method: "POST",
    body: "{}",
  });
  if (!optRes.ok) throw new Error(`webauthn options failed: ${optRes.status}`);
  const options = (await optRes.json()) as PublicKeyCredentialCreationOptionsJSON & {
    challengeId: string;
  };
  const { challengeId, ...optionsJSON } = options;
  const attestation = await startRegistration({ optionsJSON });
  const verifyRes = await apiFetch("/v1/accounts/webauthn/register/verify", {
    method: "POST",
    body: JSON.stringify({
      challengeId,
      response: attestation,
    }),
  });
  if (!verifyRes.ok) throw new Error(`webauthn verify failed: ${verifyRes.status}`);
  return (await verifyRes.json()) as { credentialId: string };
}
