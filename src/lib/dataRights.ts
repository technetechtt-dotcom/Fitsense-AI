import { loadConsent, resetConsent } from "./consent";
import { clearFitProfile, getOrCreateFitProfile, listFitEvents } from "./fitProfile";
import { listScans } from "./storage";
import { getOrCreateProfile } from "./storage";
import type { FitEvent, FitProfile, ScanResult, UserProfile } from "../types";
import type { ConsentState } from "./consent";

/**
 * Data-rights primitives — GDPR Art. 15 (right of access) and Art. 17
 * (right to erasure).
 *
 * Both are implemented locally over the same storage layer the app uses.
 * Cloud-side erasure is delegated to `cloud/sync.ts` when consent is on;
 * we never make a backend call from here directly so this module stays
 * dependency-free and shippable in fully-offline builds.
 */

const EXPORT_VERSION = 1;

export interface FitSenseExport {
  exportVersion: number;
  exportedAtEpochMs: number;
  app: "fitsense-web";
  appVersion: string;
  consent: ConsentState;
  userProfile: UserProfile;
  fitProfile: FitProfile;
  fitEvents: FitEvent[];
  scans: ScanResult[];
}

export function collectExport(appVersion = "0.1.0"): FitSenseExport {
  return {
    exportVersion: EXPORT_VERSION,
    exportedAtEpochMs: Date.now(),
    app: "fitsense-web",
    appVersion,
    consent: loadConsent(),
    userProfile: getOrCreateProfile(),
    fitProfile: getOrCreateFitProfile(),
    fitEvents: listFitEvents(),
    scans: listScans(),
  };
}

/**
 * Download a JSON dump of every piece of data FitSense holds about the
 * current user. The blob is fully self-describing and machine-readable.
 */
export function downloadExport(filename = "fitsense-export.json"): void {
  if (typeof document === "undefined") return;
  const payload = collectExport();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke async to give the browser time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * Wipe every piece of local FitSense state.
 *
 * Caller's responsibility: invoke any cloud-side delete *before* this so
 * the local consent + profile are still around to authenticate the
 * server-side erasure. After this function runs the page should be
 * navigated to /splash so the user lands in a fresh-install state.
 */
export function eraseLocalData(): void {
  if (typeof window === "undefined") return;
  // Iterate over a snapshot of keys so deletion-during-iteration is safe.
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("fitsense:")) keys.push(k);
  }
  for (const k of keys) {
    localStorage.removeItem(k);
  }
  // Also flush the strongly-typed accessors so any in-memory cache is reset.
  clearFitProfile();
  resetConsent();
}
