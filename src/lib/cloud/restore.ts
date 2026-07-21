import { hasAiPersonalizationConsent, hasCloudSyncConsent } from "../consent";
import {
  getOrCreateFitProfile,
  listFitEvents,
  persistInsights,
  saveFitProfile,
} from "../fitProfile";
import { deriveInsights } from "../fitLearning";
import { saveRanker, trainFromEvents } from "../ml/learnedRanker";
import {
  getOrCreateProfile,
  listScans,
  replaceAllScans,
  saveProfile,
} from "../storage";
import type { FitEvent, FitProfile, ScanResult } from "../../types";
import { primaryFoot } from "../../types";
import { pullAll } from "./sync";

const RESTORED_AT_KEY = "fitsense:cloudRestoredAt";

export function lastCloudRestoreAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(RESTORED_AT_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function markRestored(): void {
  localStorage.setItem(RESTORED_AT_KEY, String(Date.now()));
}

function mergeScans(local: ScanResult[], remote: ScanResult[]): ScanResult[] {
  const byId = new Map<string, ScanResult>();
  for (const s of local) byId.set(s.scanId, s);
  for (const s of remote) {
    const cur = byId.get(s.scanId);
    if (!cur || s.createdAtEpochMs > cur.createdAtEpochMs) {
      byId.set(s.scanId, s);
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => b.createdAtEpochMs - a.createdAtEpochMs,
  );
}

function mergeEvents(local: FitEvent[], remote: FitEvent[]): FitEvent[] {
  const byId = new Map<string, FitEvent>();
  for (const e of local) byId.set(e.eventId, e);
  for (const e of remote) byId.set(e.eventId, e);
  return Array.from(byId.values())
    .sort((a, b) => b.epochMs - a.epochMs)
    .slice(0, 200);
}

function pickFitProfile(local: FitProfile, remote: FitProfile | null): FitProfile {
  if (!remote) return local;
  if (remote.updatedAtEpochMs > local.updatedAtEpochMs) return remote;
  return local;
}

/**
 * Pull cloud data and merge into local storage. Idempotent — safe to call
 * on every launch when cloud sync consent is on.
 */
export async function restoreFromCloud(): Promise<{
  ok: boolean;
  scans: number;
  events: number;
  message: string;
}> {
  const pulled = await pullAll();
  if (
    !pulled.fitProfile &&
    pulled.fitEvents.length === 0 &&
    pulled.scans.length === 0
  ) {
    return {
      ok: true,
      scans: 0,
      events: 0,
      message: "Nothing to restore from the cloud yet.",
    };
  }

  const user = getOrCreateProfile();
  const localProfile = getOrCreateFitProfile();
  const mergedScans = mergeScans(listScans(), pulled.scans);
  replaceAllScans(mergedScans);

  const mergedEvents = mergeEvents(listFitEvents(), pulled.fitEvents);
  localStorage.setItem("fitsense:fitEvents", JSON.stringify(mergedEvents));

  const remoteProfile = pulled.fitProfile
    ? (() => {
        const rest = { ...pulled.fitProfile } as FitProfile & {
          _syncedAtEpochMs?: number;
        };
        delete rest._syncedAtEpochMs;
        return { ...rest, userId: user.userId } as FitProfile;
      })()
    : null;
  const nextProfile = pickFitProfile(localProfile, remoteProfile);
  saveFitProfile({ ...nextProfile, userId: user.userId });

  const insights = deriveInsights(nextProfile, mergedEvents);
  persistInsights(insights);

  if (hasAiPersonalizationConsent()) {
    const foot = mergedScans[0] ? primaryFoot(mergedScans[0]) : null;
    const preferred = new Set(
      (nextProfile.favouriteBrands ?? []).map((b) => b.toLowerCase()),
    );
    const snapshot = trainFromEvents(
      mergedEvents,
      nextProfile,
      foot ?? null,
      preferred,
    );
    saveRanker(snapshot);
  }

  if (mergedScans[0]) {
    const foot = primaryFoot(mergedScans[0]);
    if (foot) {
      saveProfile({
        ...user,
        cachedFootLengthMm: foot.lengthMm,
        cachedFootWidthMm: foot.widthMm,
      });
    }
  }

  markRestored();
  return {
    ok: true,
    scans: mergedScans.length,
    events: mergedEvents.length,
    message: `Restored ${mergedScans.length} scan(s) and ${mergedEvents.length} event(s).`,
  };
}

/** Auto-restore on launch if consent granted and not restored recently. */
export async function maybeAutoRestoreFromCloud(): Promise<void> {
  if (!hasCloudSyncConsent()) return;
  const last = lastCloudRestoreAt();
  const dayMs = 24 * 60 * 60 * 1000;
  if (last && Date.now() - last < dayMs) return;
  await restoreFromCloud();
}
