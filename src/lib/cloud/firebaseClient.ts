import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

/**
 * Lazy Firebase initialiser.
 *
 * The Firebase SDK is heavy (≈ 130 kB after tree-shaking the modular
 * imports we use). We never want it in the main entry chunk — load it
 * the first time a sync operation is actually attempted.
 *
 * All config is read from Vite env vars (see `.env.example`). When the
 * project hasn't been configured we return `null` from
 * {@link tryGetFirebase} so callers degrade to local-only behaviour.
 */

const env = import.meta.env;

export interface FirebaseHandle {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

function readConfig(): FirebaseConfig | null {
  const apiKey = env.VITE_FIREBASE_API_KEY;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const appId = env.VITE_FIREBASE_APP_ID;
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN;
  if (!apiKey || !projectId || !appId || !authDomain) return null;
  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  };
}

let cached: Promise<FirebaseHandle | null> | null = null;

/**
 * Returns a handle to the initialised app, or `null` when the project
 * hasn't been configured. Resolves quickly on cold paths because Firebase
 * itself caches.
 */
export function tryGetFirebase(): Promise<FirebaseHandle | null> {
  if (cached) return cached;
  cached = (async () => {
    const config = readConfig();
    if (!config) return null;
    const [{ initializeApp, getApps }, { getAuth }, { getFirestore }] =
      await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
        import("firebase/firestore"),
      ]);
    const app = getApps().find((a) => a.name === "[DEFAULT]") ?? initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);
    return { app, auth, db };
  })().catch((err) => {
    console.warn("[fitsense] Firebase init failed", err);
    cached = null;
    return null;
  });
  return cached;
}

/** Tagged "is the project configured at all" probe — cheap, no network. */
export function isFirebaseConfigured(): boolean {
  return readConfig() !== null;
}
