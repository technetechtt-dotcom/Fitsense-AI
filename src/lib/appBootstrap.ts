import { initAnalytics, logScreenView } from "./analytics";
import { isApiConfigured } from "./api/config";
import { checkApiHealth } from "./api/status";
import { ensureSignedIn } from "./cloud/auth";
import { maybeAutoRestoreFromCloud } from "./cloud/restore";
import { syncAnalyticsFromConsent } from "./analytics";
import { acknowledgePolicy, hasCloudSyncConsent, loadConsent } from "./consent";
import { installWebMonitoring } from "./monitoring";
import { installSyncOutboxListeners, flushSyncOutbox } from "./cloud/syncOutbox";
import { getMerchantOrgId, loadMerchantBrandFits } from "./api/merchantApi";

let booted = false;

/**
 * One-time app initialisation: analytics consent, optional cloud restore.
 */
export async function bootstrapApp(): Promise<void> {
  if (booted || typeof window === "undefined") return;
  booted = true;

  initAnalytics();
  installWebMonitoring();
  installSyncOutboxListeners();

  // Migrate legacy profiles that stored analytics on UserPreferences.
  const legacy = localStorage.getItem("fitsense:profile");
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy) as {
        preferences?: { analyticsOptIn?: boolean };
      };
      const consent = loadConsent();
      if (
        parsed.preferences?.analyticsOptIn &&
        consent.anonymousAnalytics === "unset"
      ) {
        acknowledgePolicy({
          cloudSync: consent.cloudSync === "unset" ? "denied" : consent.cloudSync,
          aiPersonalization:
            consent.aiPersonalization === "unset"
              ? "granted"
              : consent.aiPersonalization,
          anonymousAnalytics: "granted",
        });
      }
      if (parsed.preferences && "analyticsOptIn" in parsed.preferences) {
        delete parsed.preferences.analyticsOptIn;
        localStorage.setItem("fitsense:profile", JSON.stringify(parsed));
      }
    } catch {
      // ignore corrupt profile
    }
  }

  await syncAnalyticsFromConsent();

  if (isApiConfigured()) {
    const health = await checkApiHealth();
    if (!health.ok) {
      console.warn(
        "[fitsense] API unreachable — handoff and sync via API will fail until the server is running (npm run dev:api).",
      );
    } else if (getMerchantOrgId()) {
      try {
        await loadMerchantBrandFits();
      } catch (err) {
        console.warn("[fitsense] merchant brand-fit load failed", err);
      }
    }
  }

  if (hasCloudSyncConsent()) {
    if (isApiConfigured()) {
      await ensureSignedIn();
    }
    await maybeAutoRestoreFromCloud();
    await flushSyncOutbox();
  }
}

/** Track route changes when analytics consent is on. */
export function trackRoute(pathname: string): void {
  const screen = pathname.replace(/^\//, "") || "splash";
  void logScreenView(screen);
}
