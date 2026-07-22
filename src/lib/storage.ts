import type { ScanResult, UserPreferences, UserProfile } from "../types";
import { DEFAULT_PREFERENCES } from "../types";
import { logAnalyticsEvent } from "./analytics";
import { deleteScanFromCloud, pushScan } from "./cloud/sync";
import { wipeSessionData } from "./session";

/**
 * Web persistence layer — local-first storage for scans and profile data.
 * Uses localStorage so the demo works offline.
 */

const KEYS = {
  profile: "fitsense:profile",
  scans: "fitsense:scans",
  onboarded: "fitsense:onboarded",
} as const;

// ---- Profile ---------------------------------------------------------------

export function getOrCreateProfile(): UserProfile {
  const raw = localStorage.getItem(KEYS.profile);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as UserProfile;
      // Merge in any preference fields that have been added since the
      // profile was first written — keeps older clients forward-compatible
      // when we add new toggles (e.g. `applyHeelPadOffset`).
      return {
        ...parsed,
        preferences: {
          ...DEFAULT_PREFERENCES,
          ...(parsed.preferences ?? {}),
        },
      };
    } catch {
      // Fall through and regenerate below.
    }
  }
  const fresh: UserProfile = {
    userId: crypto.randomUUID(),
    isAnonymous: true,
    preferences: { ...DEFAULT_PREFERENCES },
    createdAtEpochMs: Date.now(),
    updatedAtEpochMs: Date.now(),
  };
  localStorage.setItem(KEYS.profile, JSON.stringify(fresh));
  return fresh;
}

export function saveProfile(profile: UserProfile): UserProfile {
  const next = { ...profile, updatedAtEpochMs: Date.now() };
  localStorage.setItem(KEYS.profile, JSON.stringify(next));
  return next;
}

export function updatePreferences(patch: Partial<UserPreferences>): UserProfile {
  const current = getOrCreateProfile();
  return saveProfile({
    ...current,
    preferences: { ...current.preferences, ...patch },
  });
}

export function signOut(): void {
  wipeSessionData();
}

/** Replace the full scan list (used by cloud restore). */
export function replaceAllScans(scans: ScanResult[]): void {
  const sorted = [...scans].sort((a, b) => b.createdAtEpochMs - a.createdAtEpochMs);
  localStorage.setItem(KEYS.scans, JSON.stringify(sorted));
}

// ---- Scans -----------------------------------------------------------------

export function listScans(): ScanResult[] {
  const raw = localStorage.getItem(KEYS.scans);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as ScanResult[];
    return arr.sort((a, b) => b.createdAtEpochMs - a.createdAtEpochMs);
  } catch {
    return [];
  }
}

export function getScan(scanId: string): ScanResult | undefined {
  return listScans().find((s) => s.scanId === scanId);
}

export function saveScan(scan: ScanResult): ScanResult {
  const all = listScans().filter((s) => s.scanId !== scan.scanId);
  all.unshift(scan);
  localStorage.setItem(KEYS.scans, JSON.stringify(all));

  // Cache the latest foot metrics on the profile.
  const profile = getOrCreateProfile();
  const foot = scan.rightFoot ?? scan.leftFoot;
  if (foot) {
    saveProfile({
      ...profile,
      cachedFootLengthMm: foot.lengthMm,
      cachedFootWidthMm: foot.widthMm,
    });
  }
  void pushScan(scan);
  void logAnalyticsEvent("scan_saved", { scan_id: scan.scanId });
  return scan;
}

export function deleteScan(scanId: string): void {
  const remaining = listScans().filter((s) => s.scanId !== scanId);
  localStorage.setItem(KEYS.scans, JSON.stringify(remaining));
  void deleteScanFromCloud(scanId);
}

// ---- Onboarding ------------------------------------------------------------

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(KEYS.onboarded) === "true";
}

export function markOnboardingComplete(): void {
  localStorage.setItem(KEYS.onboarded, "true");
}
