import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { needsPolicyPrompt } from "../lib/consent";

/** Prompts users to review consent on Settings when policy is not accepted. */
export function ConsentBanner() {
  if (!needsPolicyPrompt()) return null;

  return (
    <Link
      to="/settings"
      className="block rounded-2xl border border-neon/35 bg-neon/10 p-4 hover:bg-neon/15 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-neon/20 grid place-items-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-neon" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-semibold">Your data, your choice</div>
          <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
            Review cloud sync, AI personalisation, and analytics in Settings
            before you continue.
          </p>
        </div>
        <span className="text-neon text-xs font-semibold shrink-0 self-center">
          Review →
        </span>
      </div>
    </Link>
  );
}
