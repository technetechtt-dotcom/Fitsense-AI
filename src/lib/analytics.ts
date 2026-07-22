import { hasAnalyticsConsent, onConsentChange } from "./consent";

let collectionEnabled = false;

/**
 * Apply analytics collection state from consent.
 * Analytics are currently local-only until a provider is configured.
 */
export async function syncAnalyticsFromConsent(): Promise<void> {
  if (typeof window === "undefined") return;
  collectionEnabled = hasAnalyticsConsent();
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
  if (import.meta.env.DEV) {
    console.debug("[fitsense] screen_view", screenName);
  }
}

/** Log a custom event when analytics consent is granted. */
export async function logAnalyticsEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  if (!collectionEnabled || !hasAnalyticsConsent()) return;
  if (import.meta.env.DEV) {
    console.debug("[fitsense] event", name, params);
  }
}
