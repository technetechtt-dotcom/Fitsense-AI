import { resetConsent } from "./consent";
import { resetRanker } from "./ml/learnedRanker";

const ONBOARDING_KEY = "fitsense:onboarded";

/**
 * Wipe all FitSense local state for sign-out / session reset.
 * Keeps onboarding completion so returning users skip the intro carousel.
 */
export function wipeSessionData(): void {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("fitsense:") && k !== ONBOARDING_KEY) {
      keys.push(k);
    }
  }
  for (const k of keys) {
    localStorage.removeItem(k);
  }
  resetConsent();
  resetRanker();
}
