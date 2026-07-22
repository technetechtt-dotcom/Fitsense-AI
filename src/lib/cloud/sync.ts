import { hasCloudSyncConsent } from "../consent";
import { isApiConfigured } from "../api/config";
import {
  deleteScanViaApi,
  eraseCloudDataViaApi,
  pullAllViaApi,
  pushFitEventViaApi,
  pushFitProfileViaApi,
  pushScanViaApi,
} from "../api/syncApi";
import { ensureSignedIn, resetAuthCache } from "./auth";
import type { FitEvent, FitProfile, ScanResult } from "../../types";

/**
 * Consent-gated cloud sync through the FitSense API (`backend/`).
 */

let pendingProfile: FitProfile | null = null;
let profileTimer: ReturnType<typeof setTimeout> | null = null;
const PROFILE_DEBOUNCE_MS = 800;

export function pushFitProfile(profile: FitProfile): void {
  if (!hasCloudSyncConsent() || !isApiConfigured()) return;
  pendingProfile = profile;
  if (profileTimer) clearTimeout(profileTimer);
  profileTimer = setTimeout(() => {
    const next = pendingProfile;
    pendingProfile = null;
    profileTimer = null;
    if (next) void flushProfile(next);
  }, PROFILE_DEBOUNCE_MS);
}

async function flushProfile(profile: FitProfile): Promise<void> {
  try {
    await pushFitProfileViaApi(profile);
  } catch (err) {
    console.warn("[fitsense] pushFitProfile (api) failed", err);
  }
}

export async function pushFitEvent(event: FitEvent): Promise<void> {
  if (!hasCloudSyncConsent() || !isApiConfigured()) return;
  try {
    await pushFitEventViaApi(event);
  } catch (err) {
    console.warn("[fitsense] pushFitEvent (api) failed — queuing", err);
    const { enqueueFitEvent } = await import("./syncOutbox");
    enqueueFitEvent(event);
  }
}

export async function pushScan(scan: ScanResult): Promise<void> {
  if (!hasCloudSyncConsent() || !isApiConfigured()) return;
  try {
    await pushScanViaApi(scan);
  } catch (err) {
    console.warn("[fitsense] pushScan (api) failed — queuing", err);
    const { enqueueScan } = await import("./syncOutbox");
    enqueueScan(scan);
  }
}

export async function deleteScanFromCloud(scanId: string): Promise<void> {
  if (!hasCloudSyncConsent() || !isApiConfigured()) return;
  try {
    await deleteScanViaApi(scanId);
  } catch (err) {
    console.warn("[fitsense] deleteScan (api) failed", err);
  }
}

export interface CloudPullResult {
  fitProfile: FitProfile | null;
  fitEvents: FitEvent[];
  scans: ScanResult[];
}

export async function pullAll(): Promise<CloudPullResult> {
  const empty: CloudPullResult = {
    fitProfile: null,
    fitEvents: [],
    scans: [],
  };
  if (!hasCloudSyncConsent() || !isApiConfigured()) return empty;

  try {
    await ensureSignedIn();
    return await pullAllViaApi();
  } catch (err) {
    console.warn("[fitsense] pullAll (api) failed", err);
    return empty;
  }
}

export async function eraseCloudData(): Promise<void> {
  if (!isApiConfigured()) return;
  try {
    await eraseCloudDataViaApi();
    resetAuthCache();
  } catch (err) {
    console.warn("[fitsense] eraseCloudData (api) failed", err);
  }
}
