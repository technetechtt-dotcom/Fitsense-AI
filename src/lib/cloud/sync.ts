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
import { ensureSignedIn, currentUid, resetAuthCache } from "./auth";
import { tryGetFirebase } from "./firebaseClient";
import type { FitEvent, FitProfile, ScanResult } from "../../types";

/**
 * Consent-gated cloud sync.
 *
 * When `VITE_API_BASE_URL` is set, sync goes through the FitSense API
 * (`backend/`) with Firebase ID tokens. Otherwise the client writes to
 * Firestore directly (legacy / offline-friendly path).
 */

let pendingProfile: FitProfile | null = null;
let profileTimer: ReturnType<typeof setTimeout> | null = null;
const PROFILE_DEBOUNCE_MS = 800;

export function pushFitProfile(profile: FitProfile): void {
  if (!hasCloudSyncConsent()) return;
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
  if (isApiConfigured()) {
    try {
      await pushFitProfileViaApi(profile);
    } catch (err) {
      console.warn("[fitsense] pushFitProfile (api) failed", err);
    }
    return;
  }
  const fb = await tryGetFirebase();
  if (!fb) return;
  const uid = await ensureSignedIn();
  if (!uid) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(fb.db, "users", uid, "fitProfile", "current"), {
      ...profile,
      _syncedAtEpochMs: Date.now(),
    });
  } catch (err) {
    console.warn("[fitsense] pushFitProfile failed", err);
  }
}

export async function pushFitEvent(event: FitEvent): Promise<void> {
  if (!hasCloudSyncConsent()) return;
  if (isApiConfigured()) {
    try {
      await pushFitEventViaApi(event);
    } catch (err) {
      console.warn("[fitsense] pushFitEvent (api) failed", err);
    }
    return;
  }
  const fb = await tryGetFirebase();
  if (!fb) return;
  const uid = await ensureSignedIn();
  if (!uid) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(fb.db, "users", uid, "fitEvents", event.eventId), event);
  } catch (err) {
    console.warn("[fitsense] pushFitEvent failed", err);
  }
}

export async function pushScan(scan: ScanResult): Promise<void> {
  if (!hasCloudSyncConsent()) return;
  if (isApiConfigured()) {
    try {
      await pushScanViaApi(scan);
    } catch (err) {
      console.warn("[fitsense] pushScan (api) failed", err);
    }
    return;
  }
  const fb = await tryGetFirebase();
  if (!fb) return;
  const uid = await ensureSignedIn();
  if (!uid) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(fb.db, "users", uid, "scans", scan.scanId), scan);
  } catch (err) {
    console.warn("[fitsense] pushScan failed", err);
  }
}

export async function deleteScanFromCloud(scanId: string): Promise<void> {
  if (!hasCloudSyncConsent()) return;
  if (isApiConfigured()) {
    try {
      await deleteScanViaApi(scanId);
    } catch (err) {
      console.warn("[fitsense] deleteScan (api) failed", err);
    }
    return;
  }
  const fb = await tryGetFirebase();
  if (!fb) return;
  const uid = await ensureSignedIn();
  if (!uid) return;
  try {
    const { deleteDoc, doc } = await import("firebase/firestore");
    await deleteDoc(doc(fb.db, "users", uid, "scans", scanId));
  } catch (err) {
    console.warn("[fitsense] deleteScan failed", err);
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
  if (!hasCloudSyncConsent()) return empty;

  if (isApiConfigured()) {
    try {
      await ensureSignedIn();
      return await pullAllViaApi();
    } catch (err) {
      console.warn("[fitsense] pullAll (api) failed", err);
      return empty;
    }
  }

  const fb = await tryGetFirebase();
  if (!fb) return empty;
  const uid = await ensureSignedIn();
  if (!uid) return empty;
  try {
    const { collection, doc, getDoc, getDocs } = await import("firebase/firestore");
    const [profileSnap, eventsSnap, scansSnap] = await Promise.all([
      getDoc(doc(fb.db, "users", uid, "fitProfile", "current")),
      getDocs(collection(fb.db, "users", uid, "fitEvents")),
      getDocs(collection(fb.db, "users", uid, "scans")),
    ]);
    const fitProfile = profileSnap.exists() ? (profileSnap.data() as FitProfile) : null;
    const fitEvents: FitEvent[] = [];
    eventsSnap.forEach((d) => fitEvents.push(d.data() as FitEvent));
    const scans: ScanResult[] = [];
    scansSnap.forEach((d) => scans.push(d.data() as ScanResult));
    return { fitProfile, fitEvents, scans };
  } catch (err) {
    console.warn("[fitsense] pullAll failed", err);
    return empty;
  }
}

export async function eraseCloudData(): Promise<void> {
  if (isApiConfigured()) {
    try {
      await eraseCloudDataViaApi();
      resetAuthCache();
    } catch (err) {
      console.warn("[fitsense] eraseCloudData (api) failed", err);
    }
    return;
  }
  const fb = await tryGetFirebase();
  if (!fb) return;
  const uid = await currentUid();
  if (!uid) return;
  try {
    const { collection, deleteDoc, doc, getDocs } = await import("firebase/firestore");
    const [eventsSnap, scansSnap, profileSnap] = await Promise.all([
      getDocs(collection(fb.db, "users", uid, "fitEvents")),
      getDocs(collection(fb.db, "users", uid, "scans")),
      getDocs(collection(fb.db, "users", uid, "fitProfile")),
    ]);
    const deletes: Promise<unknown>[] = [];
    eventsSnap.forEach((d) => deletes.push(deleteDoc(d.ref)));
    scansSnap.forEach((d) => deletes.push(deleteDoc(d.ref)));
    profileSnap.forEach((d) => deletes.push(deleteDoc(d.ref)));
    deletes.push(deleteDoc(doc(fb.db, "users", uid)));
    await Promise.all(deletes);
    try {
      await fb.auth.currentUser?.delete();
    } catch {
      // ignore
    }
    resetAuthCache();
  } catch (err) {
    console.warn("[fitsense] eraseCloudData failed", err);
  }
}
