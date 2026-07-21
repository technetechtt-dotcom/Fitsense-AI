import { useEffect, useRef, useState } from "react";
import { Check, Crosshair, X } from "lucide-react";
import { startArSession, type ArSessionHandle, type ArStatus } from "../lib/arSession";
import type { FootMeasurement } from "../types";

interface Props {
  onMeasured: (measurement: FootMeasurement) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}

/**
 * Wraps {@link startArSession} in a fullscreen React component. The
 * canvas itself isn't visible to the user — WebXR composites onto the
 * device display directly. We render the host UI (status pill + capture
 * button) as a regular DOM overlay.
 *
 * Note: WebXR's immersive-ar mode hides the rest of the page on most
 * Android Chrome builds. Our overlay still works because XR sessions
 * dispatch input events as `select` on the session object — but for
 * MVP simplicity we use a regular HTML button positioned on top of
 * the canvas and rely on the user being able to tap it through the
 * passthrough view. If a browser refuses to render DOM during XR we'd
 * need to migrate to `XRSession.requestAnimationFrame` + `select` events.
 */
export function ArScanner({ onMeasured, onCancel, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleRef = useRef<ArSessionHandle | null>(null);
  const [status, setStatus] = useState<ArStatus>({ kind: "searching" });

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    (async () => {
      try {
        const handle = await startArSession(canvas, {
          onStatus: (s) => !cancelled && setStatus(s),
          onMeasured: (m) => {
            if (cancelled) return;
            onMeasured(m);
          },
          onEnded: () => {
            if (cancelled) return;
            // If the user dismisses the AR view without capturing both
            // points, treat it as a cancel.
            if (status.kind !== "measuring") onCancel();
          },
        });
        if (cancelled) {
          handle.end();
          return;
        }
        handleRef.current = handle;
      } catch (err) {
        if (cancelled) return;
        onError(err instanceof Error ? err.message : "AR session failed.");
      }
    })();
    return () => {
      cancelled = true;
      handleRef.current?.end();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = (() => {
    switch (status.kind) {
      case "searching":
        return "Aim at the floor — looking for a plane…";
      case "ready":
        return "Move the reticle onto your heel.";
      case "heel-locked":
        return "Heel locked. Now aim at your longest toe.";
      case "toe-locked":
        return "Length locked. Aim at one side of the ball of your foot.";
      case "width-a-locked":
        return "Now aim at the opposite side of the ball of your foot.";
      case "measuring":
        return "Measuring…";
      case "error":
        return status.message;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-x-0 top-0 p-4 z-10 flex items-center gap-3">
        <button
          onClick={() => {
            handleRef.current?.end();
            onCancel();
          }}
          className="w-11 h-11 rounded-full bg-black/55 backdrop-blur grid place-items-center"
          aria-label="Exit AR"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 flex justify-center">
          <span className="px-4 py-1.5 rounded-full bg-black/65 backdrop-blur text-xs font-semibold text-neon">
            {label}
          </span>
        </div>
        <span className="w-11" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 pb-8 z-10 flex flex-col items-center gap-3">
        <button
          onClick={() => handleRef.current?.capture()}
          disabled={
            status.kind === "searching" ||
            status.kind === "measuring" ||
            status.kind === "error"
          }
          className="w-20 h-20 rounded-full bg-neon text-surface-0 shadow-glow grid place-items-center disabled:opacity-40 transition-opacity"
        >
          {status.kind === "heel-locked" ||
          status.kind === "toe-locked" ||
          status.kind === "width-a-locked" ? (
            <Check className="w-8 h-8" />
          ) : (
            <Crosshair className="w-8 h-8" />
          )}
        </button>
        <span className="text-xs text-ink-muted">
          {status.kind === "heel-locked"
            ? "Tap to lock toe"
            : status.kind === "toe-locked"
              ? "Tap to lock first width point"
              : status.kind === "width-a-locked"
                ? "Tap to lock second width point"
                : "Tap to lock heel"}
        </span>
      </div>
    </div>
  );
}
