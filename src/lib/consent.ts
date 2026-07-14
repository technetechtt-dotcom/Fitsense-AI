/**
 * Consent state machine.
 *
 * The web app never uploads anything until the user has explicitly granted
 * the relevant consent. Three independently-toggleable choices:
 *
 *   - cloudSync           — push the local fit events / scans / profile to
 *                           the backend so they survive a re-install or
 *                           sync across devices.
 *   - aiPersonalization   — run the learned ranker on the local event log
 *                           and use its scores to re-order recommendations.
 *                           Even "denied" leaves the rule-based engine on.
 *   - anonymousAnalytics  — already-existing toggle, retained here so all
 *                           privacy controls live in one place.
 *
 * The whole policy is versioned. Bumping `POLICY_VERSION` re-prompts every
 * user on their next visit, regardless of previous choices.
 */

const STORAGE_KEY = "fitsense:consent";

/** Bump whenever the consent contract changes. Re-prompts every user. */
export const POLICY_VERSION = 1;

export type ConsentChoice = "granted" | "denied" | "unset";

export interface ConsentState {
  policyVersion: number;
  acceptedPolicyVersion: number | null;
  acceptedAtEpochMs: number | null;
  cloudSync: ConsentChoice;
  aiPersonalization: ConsentChoice;
  anonymousAnalytics: ConsentChoice;
}

export const DEFAULT_CONSENT: ConsentState = {
  policyVersion: POLICY_VERSION,
  acceptedPolicyVersion: null,
  acceptedAtEpochMs: null,
  cloudSync: "unset",
  aiPersonalization: "unset",
  anonymousAnalytics: "unset",
};

/** Subset of choices the consent UI persists in a single batch. */
export type ConsentChoices = Pick<
  ConsentState,
  "cloudSync" | "aiPersonalization" | "anonymousAnalytics"
>;

type Listener = (state: ConsentState) => void;

const listeners = new Set<Listener>();

export function loadConsent(): ConsentState {
  if (typeof window === "undefined") return { ...DEFAULT_CONSENT };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_CONSENT };
  try {
    const parsed = JSON.parse(raw) as ConsentState;
    return { ...DEFAULT_CONSENT, ...parsed, policyVersion: POLICY_VERSION };
  } catch {
    return { ...DEFAULT_CONSENT };
  }
}

export function saveConsent(state: ConsentState): ConsentState {
  const next: ConsentState = { ...state, policyVersion: POLICY_VERSION };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  for (const l of listeners) {
    try {
      l(next);
    } catch {
      // listeners must not break each other
    }
  }
  return next;
}

/**
 * Persist a partial update. Used by the Settings consent card.
 */
export function updateConsent(patch: Partial<ConsentChoices>): ConsentState {
  const current = loadConsent();
  const next: ConsentState = {
    ...current,
    ...patch,
    acceptedPolicyVersion: POLICY_VERSION,
    acceptedAtEpochMs: current.acceptedAtEpochMs ?? Date.now(),
  };
  return saveConsent(next);
}

/** Stamps the user as having seen + accepted the current policy. */
export function acknowledgePolicy(choices: ConsentChoices): ConsentState {
  return saveConsent({
    ...loadConsent(),
    ...choices,
    acceptedPolicyVersion: POLICY_VERSION,
    acceptedAtEpochMs: Date.now(),
  });
}

/** True when the policy hasn't been accepted (first launch, or version bump). */
export function needsPolicyPrompt(state: ConsentState = loadConsent()): boolean {
  return state.acceptedPolicyVersion !== POLICY_VERSION;
}

export function hasCloudSyncConsent(state: ConsentState = loadConsent()): boolean {
  return state.cloudSync === "granted";
}

export function hasAiPersonalizationConsent(
  state: ConsentState = loadConsent(),
): boolean {
  return state.aiPersonalization === "granted";
}

export function hasAnalyticsConsent(
  state: ConsentState = loadConsent(),
): boolean {
  return state.anonymousAnalytics === "granted";
}

/** Subscribe to consent changes. Returns an unsubscribe function. */
export function onConsentChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Hard reset of the consent state. Used by the account-delete flow before
 * wiping everything else, so the user gets a fresh consent prompt on next
 * visit.
 */
export function resetConsent(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  for (const l of listeners) {
    try {
      l({ ...DEFAULT_CONSENT });
    } catch {
      // ignore
    }
  }
}
