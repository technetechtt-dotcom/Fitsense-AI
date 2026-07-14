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
    const { signInAnonymously, onAuthStateChanged } = await import(
      "firebase/auth"
    );
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

/** Force a re-auth on next call. Used by the erase flow. */
export function resetAuthCache(): void {
  signInPromise = null;
}
