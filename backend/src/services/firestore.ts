import { readFileSync } from "node:fs";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { config } from "../config.js";

let db: Firestore | null = null;

export function isFirestoreReady(): boolean {
  return db !== null;
}

export function isFirebaseAdminReady(): boolean {
  return getApps().length > 0;
}

export function initFirebaseAdmin(): boolean {
  if (getApps().length > 0) {
    return true;
  }

  const inline = config.firebase.serviceAccountJson;
  try {
    if (inline) {
      const credential = cert(JSON.parse(inline) as ServiceAccount);
      initializeApp({ credential });
      return true;
    }

    initializeApp({
      credential: applicationDefault(),
    });
    return true;
  } catch (err) {
    console.warn(
      "[fitsense-api] Firebase Admin not configured.",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

export function initFirestore(): void {
  if (db) return;
  if (!initFirebaseAdmin()) {
    console.warn("[fitsense-api] Firestore sync routes disabled.");
    return;
  }
  db = getFirestore();
}

export function getDb(): Firestore {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }
  return db;
}

export async function verifyIdToken(
  authorization: string | undefined,
): Promise<string> {
  if (config.skipAuth) {
    throw new Error("Use requireAuth middleware with debug header in skip mode");
  }
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing Bearer token");
  }
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) throw new Error("Empty Bearer token");
  if (!initFirebaseAdmin()) {
    throw new Error("Auth unavailable - Firebase Admin not configured");
  }
  const decoded = await getAuth().verifyIdToken(token);
  return decoded.uid;
}

export async function deleteAuthUser(uid: string): Promise<void> {
  if (!initFirebaseAdmin()) return;
  try {
    await getAuth().deleteUser(uid);
  } catch {
    // User may already be deleted.
  }
}

/** Firestore paths mirror `src/lib/cloud/sync.ts` on the web client. */
export function userRef(uid: string) {
  return getDb().collection("users").doc(uid);
}

export function fitProfileRef(uid: string) {
  return userRef(uid).collection("fitProfile").doc("current");
}

export function fitEventRef(uid: string, eventId: string) {
  return userRef(uid).collection("fitEvents").doc(eventId);
}

export function scanRef(uid: string, scanId: string) {
  return userRef(uid).collection("scans").doc(scanId);
}

export async function pullUserData(uid: string) {
  const database = getDb();
  const [profileSnap, eventsSnap, scansSnap] = await Promise.all([
    fitProfileRef(uid).get(),
    database.collection("users").doc(uid).collection("fitEvents").get(),
    database.collection("users").doc(uid).collection("scans").get(),
  ]);

  const fitEvents = eventsSnap.docs.map((d) => d.data());
  const scans = scansSnap.docs.map((d) => d.data());

  return {
    fitProfile: profileSnap.exists ? profileSnap.data() : null,
    fitEvents,
    scans,
  };
}

export async function eraseUserData(uid: string): Promise<void> {
  const database = getDb();
  const userDoc = database.collection("users").doc(uid);

  const [eventsSnap, scansSnap, profileSnap] = await Promise.all([
    userDoc.collection("fitEvents").get(),
    userDoc.collection("scans").get(),
    userDoc.collection("fitProfile").get(),
  ]);

  const batch = database.batch();
  for (const d of eventsSnap.docs) batch.delete(d.ref);
  for (const d of scansSnap.docs) batch.delete(d.ref);
  for (const d of profileSnap.docs) batch.delete(d.ref);
  batch.delete(userDoc);
  await batch.commit();

  await deleteAuthUser(uid);
}

/** Optional helper for local dev: load project id from service account file. */
export function readProjectIdFromCredentials(): string | undefined {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) return undefined;
  try {
    const json = JSON.parse(readFileSync(path, "utf8")) as {
      project_id?: string;
    };
    return json.project_id;
  } catch {
    return undefined;
  }
}
