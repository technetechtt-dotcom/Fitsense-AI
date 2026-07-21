import { tryGetFirebase } from "./firebaseClient";

/**
 * Anonymous auth wrapper.
 *
 * We never ask the user to create an account. Firestore reads/writes are
 * gated by a uid that the SDK manages transparently. The uid is also
 * persisted to localStorage by Firebase itself, so revisits resume the
 * same identity automatically.
 */

let signInPromise: Promise<string | null> | null = null;

/** Sign the user in anonymously (or reuse the existing session). */
export function ensureSignedIn(): Promise<string | null> {
  if (signInPromise) return signInPromise;
  signInPromise = (async () => {
    const fb = await tryGetFirebase();
    if (!fb) return null;
    const { signInAnonymously, onAuthStateChanged } = await import("firebase/auth");
    // If we're already signed in this browser, use that uid.
    const existing = fb.auth.currentUser;
    if (existing) return existing.uid;
    // Otherwise wait for either an existing persisted session to resolve
    // or for the anonymous sign-in to complete.
    const settled = await new Promise<string | null>((resolve) => {
      const unsub = onAuthStateChanged(fb.auth, (u) => {
        if (u) {
          unsub();
          resolve(u.uid);
        }
      });
      signInAnonymously(fb.auth).catch((err) => {
        console.warn("[fitsense] anonymous sign-in failed", err);
        unsub();
        resolve(null);
      });
    });
    return settled;
  })().catch(() => {
    signInPromise = null;
    return null;
  });
  return signInPromise;
}

/** Returns the current uid or null. Does not trigger sign-in. */
export async function currentUid(): Promise<string | null> {
  const fb = await tryGetFirebase();
  return fb?.auth.currentUser?.uid ?? null;
}

/** Firebase ID token for API requests (`Authorization: Bearer`). */
export async function getIdToken(): Promise<string | null> {
  const fb = await tryGetFirebase();
  if (!fb) return null;
  if (!fb.auth.currentUser) {
    await ensureSignedIn();
  }
  const user = fb.auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}

export interface LinkedAccount {
  uid: string;
  displayName?: string;
  email?: string;
}

/**
 * Upgrade the current anonymous identity to Google without changing its uid,
 * preserving cloud data already written under that user.
 */
export async function linkGoogleAccount(): Promise<LinkedAccount> {
  const fb = await tryGetFirebase();
  if (!fb) throw new Error("Firebase authentication is not configured.");
  await ensureSignedIn();
  const current = fb.auth.currentUser;
  if (!current) throw new Error("No current FitSense identity.");

  const { GoogleAuthProvider, linkWithPopup, signInWithPopup } =
    await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = current.isAnonymous
    ? await linkWithPopup(current, provider)
    : await signInWithPopup(fb.auth, provider);
  signInPromise = Promise.resolve(credential.user.uid);
  return {
    uid: credential.user.uid,
    displayName: credential.user.displayName ?? undefined,
    email: credential.user.email ?? undefined,
  };
}

export async function signOutCloudAccount(): Promise<void> {
  const fb = await tryGetFirebase();
  if (fb) {
    const { signOut } = await import("firebase/auth");
    await signOut(fb.auth);
  }
  resetAuthCache();
}

/** Force a re-auth on next call. Used by the erase flow. */
export function resetAuthCache(): void {
  signInPromise = null;
}
