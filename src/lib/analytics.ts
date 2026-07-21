import { hasAnalyticsConsent, onConsentChange } from "./consent";
import { tryGetFirebase } from "./cloud/firebaseClient";

let collectionEnabled = false;

/**
 * Apply Firebase Analytics collection state from consent.
 * No-ops when Firebase is not configured.
 */
export async function syncAnalyticsFromConsent(): Promise<void> {
  if (typeof window === "undefined") return;
  const enabled = hasAnalyticsConsent();
  collectionEnabled = enabled;
  const fb = await tryGetFirebase();
  if (!fb) return;
  try {
    const { getAnalytics, isSupported, setAnalyticsCollectionEnabled } =
      await import("firebase/analytics");
    const supported = await isSupported();
    if (!supported) return;
    const analytics = getAnalytics(fb.app);
    setAnalyticsCollectionEnabled(analytics, enabled);
  } catch (err) {
    console.warn("[fitsense] analytics consent sync failed", err);
  }
}

/** Call once at app boot — wires consent listener + initial state. */
export function initAnalytics(): void {
  if (typeof window === "undefined") return;
  void syncAnalyticsFromConsent();
  onConsentChange(() => {
    void syncAnalyticsFromConsent();
  });
}

/** Log a screen view when analytics consent is granted. */
export async function logScreenView(screenName: string): Promise<void> {
  if (!collectionEnabled || !hasAnalyticsConsent()) return;
  const fb = await tryGetFirebase();
  if (!fb) return;
  try {
    const { getAnalytics, isSupported, logEvent } = await import("firebase/analytics");
    if (!(await isSupported())) return;
    const analytics = getAnalytics(fb.app);
    logEvent(analytics, "screen_view", {
      firebase_screen: screenName,
      firebase_screen_class: screenName,
    });
  } catch {
    // ignore
  }
}

/** Log a custom event when analytics consent is granted. */
export async function logAnalyticsEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  if (!collectionEnabled || !hasAnalyticsConsent()) return;
  const fb = await tryGetFirebase();
  if (!fb) return;
  try {
    const { getAnalytics, isSupported, logEvent } = await import("firebase/analytics");
    if (!(await isSupported())) return;
    const analytics = getAnalytics(fb.app);
    logEvent(analytics, name, params);
  } catch {
    // ignore
  }
}
