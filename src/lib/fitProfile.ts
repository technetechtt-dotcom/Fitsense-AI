import type {
  FitEvent,
  FitInsights,
  FitProfile,
  ScanResult,
} from "../types";
import { FIT_PROFILE_DEFAULT, primaryFoot } from "../types";
import { getOrCreateProfile } from "./storage";
import { pushFitEvent, pushFitProfile } from "./cloud/sync";
import { trainOnEvent } from "./ml/learnedRanker";

/**
 * Storage layer for the persistent Fit Profile and its append-only event
 * log. Mirrors the shape of `storage.ts` but kept in a separate module so
 * the fit-profile additions can be evolved independently — eventually the
 * server will host these too.
 */

const KEYS = {
  profile: "fitsense:fitProfile",
  events: "fitsense:fitEvents",
} as const;

/**
 * Idempotent profile fetch — creates one if none exists for the user.
 *
 * The user's preferred-brands list (managed from Settings) is treated as
 * the source of truth and synced into `favouriteBrands` on every read,
 * so the two stays cannot drift.
 */
export function getOrCreateFitProfile(): FitProfile {
  const user = getOrCreateProfile();
  const userBrands = [...(user.preferences.preferredBrands ?? [])];
  const raw = localStorage.getItem(KEYS.profile);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as FitProfile;
      if (parsed.userId === user.userId) {
        return {
          ...FIT_PROFILE_DEFAULT,
          ...parsed,
          favouriteBrands: userBrands,
        };
      }
    } catch {
      // fall through to fresh creation
    }
  }
  const fresh: FitProfile = {
    ...FIT_PROFILE_DEFAULT,
    fitId: crypto.randomUUID(),
    userId: user.userId,
    createdAtEpochMs: Date.now(),
    updatedAtEpochMs: Date.now(),
    favouriteBrands: userBrands,
  };
  localStorage.setItem(KEYS.profile, JSON.stringify(fresh));
  return fresh;
}

/** Replace the profile and persist. Touches `updatedAtEpochMs`. */
export function saveFitProfile(profile: FitProfile): FitProfile {
  const next: FitProfile = { ...profile, updatedAtEpochMs: Date.now() };
  localStorage.setItem(KEYS.profile, JSON.stringify(next));
  // Best-effort cloud sync (consent-gated + debounced inside).
  pushFitProfile(next);
  return next;
}

/** Patch-style update — merges into the existing profile. */
export function updateFitProfile(patch: Partial<FitProfile>): FitProfile {
  const current = getOrCreateFitProfile();
  return saveFitProfile({ ...current, ...patch });
}

/**
 * Stamp the latest scan's measurements onto the fit profile.
 *
 * We always use the primary foot (right by default) for length/width,
 * and compute `asymmetryMm` only when both feet were scanned.
 */
export function applyScanToFitProfile(scan: ScanResult): FitProfile {
  const profile = getOrCreateFitProfile();
  const foot = primaryFoot(scan);
  if (!foot) return profile;
  const lengthMm = foot.lengthMm;
  const widthMm = foot.widthMm;
  let asymmetryMm: number | undefined;
  if (scan.leftFoot && scan.rightFoot) {
    asymmetryMm = scan.leftFoot.lengthMm - scan.rightFoot.lengthMm;
  }
  const next: FitProfile = {
    ...profile,
    lengthMm,
    widthMm,
    asymmetryMm: asymmetryMm ?? profile.asymmetryMm,
    widthClass: classifyWidth(lengthMm, widthMm, profile),
    updatedAtEpochMs: Date.now(),
  };
  return saveFitProfile(next);
}

function classifyWidth(
  lengthMm: number,
  widthMm: number,
  prev: FitProfile,
): FitProfile["widthClass"] {
  // If the user explicitly chose a width class, don't auto-overwrite it.
  // We assume the user knows their own feet better than a single scan.
  if (prev.widthClass !== "regular") return prev.widthClass;
  if (lengthMm === 0) return "regular";
  const ratio = widthMm / lengthMm;
  if (ratio < 0.36) return "narrow";
  if (ratio < 0.40) return "regular";
  if (ratio < 0.44) return "wide";
  return "extra_wide";
}

// ─── Event log ─────────────────────────────────────────────────────────

export function listFitEvents(): FitEvent[] {
  const raw = localStorage.getItem(KEYS.events);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as FitEvent[];
    return arr.sort((a, b) => b.epochMs - a.epochMs);
  } catch {
    return [];
  }
}

/** Append-only insert; never deletes or rewrites past events. */
export function appendFitEvent<E extends FitEvent>(event: E): E {
  const all = listFitEvents();
  all.unshift(event);
  // Trim the log to a reasonable cap — older events are summarised into
  // insights anyway. 200 keeps the local-storage payload < 50 kB.
  const trimmed = all.slice(0, 200);
  localStorage.setItem(KEYS.events, JSON.stringify(trimmed));
  // Best-effort cloud push (no-op without consent).
  void pushFitEvent(event);
  // Online training step (no-op without AI personalisation consent).
  trainOnLatestEvent(event);
  return event;
}

/**
 * Feed a freshly-appended event into the learned ranker. Uses the most
 * recent profile geometry as the foot reference so feature vectors are
 * well-defined even when the user hasn't re-scanned recently.
 */
function trainOnLatestEvent(event: FitEvent): void {
  try {
    const profile = getOrCreateFitProfile();
    const preferredBrandsLc = new Set(
      (profile.favouriteBrands ?? []).map((b) => b.toLowerCase()),
    );
    const foot =
      profile.lengthMm && profile.widthMm
        ? {
            lengthMm: profile.lengthMm,
            widthMm: profile.widthMm,
            confidence: 1,
            foot: "right" as const,
            calibration: "a4_paper" as const,
            pixelsPerMm: 0,
          }
        : null;
    trainOnEvent(event, profile, foot, preferredBrandsLc);
  } catch {
    // Never break the event log on a training failure.
  }
}

/**
 * Remove a single event from the log. Useful when the user manually
 * disowns a mis-attributed signal (e.g. accidentally tapped Returned).
 *
 * Returns `true` if an event was removed.
 */
export function removeFitEvent(eventId: string): boolean {
  const all = listFitEvents();
  const next = all.filter((e) => e.eventId !== eventId);
  if (next.length === all.length) return false;
  localStorage.setItem(KEYS.events, JSON.stringify(next));
  return true;
}

export function clearFitProfile(): void {
  localStorage.removeItem(KEYS.profile);
  localStorage.removeItem(KEYS.events);
}

/** Helper used by event-creation sites that don't want to import randomUUID. */
export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

/** Persist insights computed by `fitLearning.deriveInsights`. */
export function persistInsights(insights: FitInsights): FitProfile {
  return updateFitProfile({ insights });
}
