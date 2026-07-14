import { Camera, Info, RotateCcw, X } from "lucide-react";
import { detectPlatform } from "../lib/platform";

interface Props {
  message: string;
  recoverable: boolean;
  onRetry: () => void;
  onClose?: () => void;
}

/**
 * Modal shown when `useCamera` reports `denied`. Gives platform-specific
 * instructions (iOS / Android Chrome / desktop) so the user can actually
 * recover, instead of staring at a dead state.
 */
export function CameraPermissionHelp({
  message,
  recoverable,
  onRetry,
  onClose,
}: Props) {
  const platform = detectPlatform();
  const steps = STEPS_BY_PLATFORM[platform];
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-surface-0/85 backdrop-blur px-[max(1rem,env(safe-area-inset-left))] py-[max(1rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-sm max-h-[min(90dvh,100%)] overflow-y-auto rounded-3xl bg-surface-1 border border-ink-dim/40 shadow-glow p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-warning/20 grid place-items-center">
            <Camera className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold">Camera access blocked</h2>
            <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
              {message}
            </p>
          </div>
          {onClose ? (
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full grid place-items-center text-ink-muted hover:bg-ink-dim/30"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        <div className="rounded-2xl bg-surface-2 border border-ink-dim/30 p-3 text-xs space-y-2">
          <div className="flex items-center gap-2 text-ink-muted">
            <Info className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wide font-semibold">
              How to re-enable
            </span>
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-ink-soft">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>

        <button
          onClick={onRetry}
          className="w-full h-11 rounded-full bg-neon text-surface-0 font-semibold inline-flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          {recoverable ? "Try again" : "Refresh & retry"}
        </button>
      </div>
    </div>
  );
}

const STEPS_BY_PLATFORM: Record<
  ReturnType<typeof detectPlatform>,
  string[]
> = {
  ios: [
    "Open Settings → Safari → Camera",
    "Set FitSense's URL to “Allow”",
    "Return here and tap Try again",
  ],
  android: [
    "Tap the address bar's site-info icon (lock / tune symbol)",
    "Set Camera to Allow",
    "Reload the page",
  ],
  desktop: [
    "Click the camera icon in the address bar",
    "Choose Allow for this site",
    "Reload the page",
  ],
  unknown: [
    "Find your browser's site permissions",
    "Re-allow camera for this site",
    "Reload the page",
  ],
};
