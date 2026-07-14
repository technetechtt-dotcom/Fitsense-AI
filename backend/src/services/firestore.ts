import { readFileSync } from "node:fs";
import admin from "firebase-admin";
import { config } from "../config.js";

let db: admin.firestore.Firestore | null = null;

export function isFirestoreReady(): boolean {
  return db !== null;
}

export function initFirestore(): void {
  if (db) return;

  if (admin.apps.length > 0) {
    db = admin.firestore();
    return;
  }

  const inline = config.firebase.serviceAccountJson;
  if (inline) {
    const cred = admin.credential.cert(JSON.parse(inline) as admin.ServiceAccount);
    admin.initializeApp({ credential: cred });
    db = admin.firestore();
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    db = admin.firestore();
  } catch (err) {
    console.warn(
      "[fitsense-api] Firebase Admin not configured — sync routes disabled.",
      err instanceof Error ? err.message : err,
    );
  }
}

export function getDb(): admin.firestore.Firestore {
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
  initFirestore();
  if (!db) throw new Error("Auth unavailable — Firebase not configured");
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded.uid;
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

  try {
    await admin.auth().deleteUser(uid);
  } catch {
    // User may already be deleted
  }
}

/** Optional helper for local dev — load project id from service account file. */
export function readProjectIdFromCredentials(): string | undefined {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) return undefined;
  try {
    const json = JSON.parse(readFileSync(path, "utf8")) as { project_id?: string };
    return json.project_id;
  } catch {
    return undefined;
  }
}
