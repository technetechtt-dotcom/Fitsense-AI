import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CloudUpload, Brain, BarChart3, ShieldCheck } from "lucide-react";
import {
  acknowledgePolicy,
  loadConsent,
  needsPolicyPrompt,
  onConsentChange,
  type ConsentChoice,
  type ConsentChoices,
} from "../lib/consent";
import { restoreFromCloud } from "../lib/cloud/restore";
import { syncAnalyticsFromConsent } from "../lib/analytics";

/**
 * Inline consent card for Settings. Replaces the first-launch modal;
 * users review and save choices here.
 */
export function DataConsentCard() {
  const [needsReview, setNeedsReview] = useState(() => needsPolicyPrompt());
  const [choices, setChoices] = useState<ConsentChoices>(() => {
    const state = loadConsent();
    return {
      cloudSync: state.cloudSync === "unset" ? "denied" : state.cloudSync,
      aiPersonalization:
        state.aiPersonalization === "unset" ? "granted" : state.aiPersonalization,
      anonymousAnalytics:
        state.anonymousAnalytics === "unset" ? "denied" : state.anonymousAnalytics,
    };
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return onConsentChange((state) => {
      setNeedsReview(needsPolicyPrompt(state));
      setChoices({
        cloudSync: state.cloudSync === "unset" ? "denied" : state.cloudSync,
        aiPersonalization:
          state.aiPersonalization === "unset"
            ? "granted"
            : state.aiPersonalization,
        anonymousAnalytics:
          state.anonymousAnalytics === "unset"
            ? "denied"
            : state.anonymousAnalytics,
      });
    });
  }, []);

  const accept = async () => {
    acknowledgePolicy(choices);
    void syncAnalyticsFromConsent();
    if (choices.cloudSync === "granted") {
      await restoreFromCloud();
    }
    setNeedsReview(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const declineAll = async () => {
    acknowledgePolicy({
      cloudSync: "denied",
      aiPersonalization: "denied",
      anonymousAnalytics: "denied",
    });
    void syncAnalyticsFromConsent();
    setChoices({
      cloudSync: "denied",
      aiPersonalization: "denied",
      anonymousAnalytics: "denied",
    });
    setNeedsReview(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const setChoice = (key: keyof ConsentChoices, value: ConsentChoice) => {
    setChoices((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  return (
    <div
      className={`rounded-2xl border p-4 space-y-4 ${
        needsReview
          ? "border-neon/40 bg-neon/5"
          : "border-white/5 bg-surface-2"
      }`}
    >
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-neon/15 grid place-items-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-neon" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold">Your data, your choice</h3>
          <p className="text-xs text-ink-muted leading-relaxed mt-1">
            FitSense works fully offline by default. Turn on only what you
            need — you can change these anytime.
          </p>
          {needsReview ? (
            <p className="text-xs text-neon mt-2 font-medium">
              Please review and save your choices.
            </p>
          ) : null}
        </div>
      </header>

      <ChoiceRow
        icon={<CloudUpload className="w-4 h-4 text-neon" />}
        title="Sync to the cloud"
        body="Push your fit events to our backend so they survive a re-install and follow you across devices. Camera frames are never uploaded."
        value={choices.cloudSync}
        onChange={(v) => setChoice("cloudSync", v)}
      />

      <ChoiceRow
        icon={<Brain className="w-4 h-4 text-neon" />}
        title="AI personalisation"
        body="Run the learned ranker on your local event log to re-order recommendations. Stays on-device — no data leaves your browser."
        value={choices.aiPersonalization}
        onChange={(v) => setChoice("aiPersonalization", v)}
      />

      <ChoiceRow
        icon={<BarChart3 className="w-4 h-4 text-neon" />}
        title="Anonymous analytics"
        body="Share anonymised scan-success rates and screen views with us so we can improve the product. No personally-identifying data."
        value={choices.anonymousAnalytics}
        onChange={(v) => setChoice("anonymousAnalytics", v)}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={declineAll}
          className="px-4 py-3 rounded-2xl bg-surface-3 border border-white/8 text-sm font-semibold hover:bg-surface-2"
        >
          Decline all
        </button>
        <button
          type="button"
          onClick={accept}
          className="px-4 py-3 rounded-2xl bg-neon text-onyx text-sm font-semibold hover:bg-neon-dim"
        >
          {saved ? "Saved" : "Save choices"}
        </button>
      </div>

      <p className="text-[10px] text-ink-muted leading-relaxed text-center">
        By saving you agree to our{" "}
        <Link to="/privacy" className="underline hover:text-ink">
          Privacy policy
        </Link>
        . Export or delete your data anytime under Privacy controls below.
      </p>
    </div>
  );
}

interface ChoiceRowProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  value: ConsentChoice;
  onChange: (v: ConsentChoice) => void;
}

function ChoiceRow({ icon, title, body, value, onChange }: ChoiceRowProps) {
  const granted = value === "granted";
  return (
    <div className="rounded-2xl bg-surface-3 border border-white/5 p-3 flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-surface-2 grid place-items-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <p className="text-[11px] text-ink-muted leading-relaxed mt-0.5">
          {body}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={granted}
        aria-label={`${granted ? "Disable" : "Enable"} ${title}`}
        onClick={() => onChange(granted ? "denied" : "granted")}
        className={`shrink-0 w-10 h-6 rounded-full relative transition-colors ${
          granted ? "bg-neon" : "bg-surface-2 border border-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
            granted ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
