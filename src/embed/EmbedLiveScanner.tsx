import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Play, X, AlertTriangle } from "lucide-react";
import { useCamera } from "../lib/useCamera";
import { captureBurst } from "../lib/cv/burst";
import { autoDetectReference } from "../lib/cv/autoDetectReference";
import { autoDetectFoot } from "../lib/cv/autoDetectFoot";
import { TapMeasurement, AutoDetectChip } from "../components/TapMeasurement";
import type {
  CalibrationReference,
  FootMeasurement,
} from "../types";
import type { Point } from "../lib/homography";
import type { RealMeasurementResult } from "../lib/realMeasurement";

interface Props {
  calibration: Exclude<CalibrationReference, "arcore_plane">;
  onMeasured: (m: FootMeasurement) => void;
  onCancel: () => void;
}

interface CapturedFrame {
  dataUrl: string;
  widthPx: number;
  heightPx: number;
  suggestedRefCorners?: Point[];
  suggestedFoot?: { heel: Point; toe: Point };
  autoNotice?: string;
}

/**
 * Real scanner mounted inside the embed iframe (#10).
 *
 * Until now the embed used [`simulatedMeasurement`] for demo speed; this
 * component replaces that with the actual capture → burst → auto-detect
 * → tap-to-measure pipeline. It deliberately mirrors the host Scan.tsx
 * flow but with a more compact UI suited to the iframe modal — the goal
 * is for the partner experience to deliver the same measurement quality
 * as the standalone app.
 *
 * Notes for partners:
 *   - WebXR AR sessions are currently unsupported inside the iframe
 *     unless the host adds `allow="xr-spatial-tracking"` to the embed
 *     iframe AND the page is served over HTTPS. Until partners opt in
 *     we steer users towards A4 / card mode in the embed.
 *   - Camera access in the iframe requires the host to pass
 *     `allow="camera"` (or `permissions-policy: camera=*`). The SDK
 *     bootstrap already sets this in `sdk.ts`.
 */
export function EmbedLiveScanner({
  calibration,
  onMeasured,
  onCancel,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [captured, setCaptured] = useState<CapturedFrame | null>(null);
  const [busy, setBusy] = useState<null | "burst" | "cv" | "ml">(null);
  const [error, setError] = useState<string | null>(null);

  const camera = useCamera({
    onStreamReady: (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => undefined);
      }
    },
  });

  // Best-effort cleanup on unmount.
  useEffect(() => {
    return () => camera.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setError("Camera isn't ready yet.");
      return;
    }
    setError(null);
    try {
      setBusy("burst");
      const burst = await captureBurst(video, { frames: 5, intervalMs: 90 });
      if (!burst.quality.ok && burst.quality.issue) {
        setError(burst.quality.issue);
        setBusy(null);
        return;
      }
      let suggestedRefCorners: Point[] | undefined;
      let suggestedFoot: CapturedFrame["suggestedFoot"];
      let autoNotice: string | undefined;
      try {
        setBusy("cv");
        const ref = await autoDetectReference(burst.canvas, calibration);
        if (ref) {
          suggestedRefCorners = ref.corners;
          autoNotice = `Auto-detected reference (${Math.round(
            ref.confidence * 100,
          )}%)`;
        }
      } catch {
        // OpenCV failed; fall through.
      }
      try {
        setBusy("ml");
        const foot = await autoDetectFoot(burst.canvas);
        if (foot) {
          suggestedFoot = { heel: foot.heel, toe: foot.toe };
          autoNotice = autoNotice
            ? `${autoNotice} + foot landmarks`
            : "Foot landmarks auto-detected";
        }
      } catch {
        // MediaPipe failed; fall through.
      }
      const dataUrl = burst.canvas.toDataURL("image/jpeg", 0.88);
      setCaptured({
        dataUrl,
        widthPx: burst.canvas.width,
        heightPx: burst.canvas.height,
        suggestedRefCorners,
        suggestedFoot,
        autoNotice,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Capture failed.");
    } finally {
      setBusy(null);
    }
  }, [calibration]);

  const onTapMeasured = useCallback(
    (result: RealMeasurementResult) => onMeasured(result.measurement),
    [onMeasured],
  );

  // ─── Permission gate ────────────────────────────────────────────
  if (
    camera.state.kind === "idle" ||
    camera.state.kind === "starting" ||
    camera.state.kind === "denied" ||
    camera.state.kind === "unavailable"
  ) {
    return (
      <div className="fs-step" style={{ textAlign: "center" }}>
        <Camera size={48} className="fs-camera-icon" />
        <h2 className="fs-h2">Scan your foot</h2>
        <p className="fs-muted">
          We'll use your device camera to measure your foot — nothing is
          uploaded.
        </p>
        {camera.state.kind === "denied" ? (
          <p className="fs-error">{camera.state.message}</p>
        ) : null}
        {camera.state.kind === "unavailable" ? (
          <p className="fs-error">{camera.state.message}</p>
        ) : null}
        <div className="fs-stack">
          <button
            className="fs-btn fs-btn-primary"
            onClick={camera.state.kind === "denied" ? camera.retry : camera.start}
            disabled={camera.state.kind === "starting"}
          >
            {camera.state.kind === "starting" ? (
              <>
                <Loader2 size={18} className="fs-spin" />
                <span style={{ marginLeft: 8 }}>Starting…</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span style={{ marginLeft: 8 }}>
                  {camera.state.kind === "denied" ? "Try again" : "Start camera"}
                </span>
              </>
            )}
          </button>
          <button className="fs-btn fs-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ─── Captured frame → tap-to-measure ──────────────────────────
  if (captured) {
    return (
      <div className="fs-step">
        <div className="fs-scan-header">
          <button
            onClick={() => {
              setCaptured(null);
              setError(null);
            }}
            className="fs-icon-btn"
            aria-label="Re-take"
          >
            <X size={16} />
          </button>
          <strong>
            {calibration === "a4_paper" ? "A4 paper" : "Bank card"} calibration
          </strong>
        </div>
        <TapMeasurement
          imageDataUrl={captured.dataUrl}
          imageWidthPx={captured.widthPx}
          imageHeightPx={captured.heightPx}
          calibration={calibration}
          onMeasured={onTapMeasured}
          onRetake={() => {
            setCaptured(null);
            setError(null);
          }}
          suggestedRefCorners={captured.suggestedRefCorners}
          suggestedFoot={captured.suggestedFoot}
          banner={
            captured.autoNotice ? (
              <AutoDetectChip label={captured.autoNotice} />
            ) : null
          }
        />
      </div>
    );
  }

  // ─── Live preview ───────────────────────────────────────────────
  return (
    <div className="fs-live">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="fs-video"
      />
      <div className="fs-live-overlay">
        <div className="fs-live-hint">
          {calibration === "a4_paper"
            ? "Stand on a sheet of A4 paper, foot flat"
            : "Place a bank card flat next to your foot"}
        </div>
        {error ? (
          <div className="fs-live-error">
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        ) : null}
        {busy ? (
          <div className="fs-live-busy">
            <Loader2 size={16} className="fs-spin" />
            <span>
              {busy === "burst"
                ? "Capturing burst…"
                : busy === "cv"
                ? "Finding reference…"
                : "Detecting foot…"}
            </span>
          </div>
        ) : null}
      </div>
      <div className="fs-live-actions">
        <button
          type="button"
          className="fs-btn fs-btn-primary"
          onClick={capture}
          disabled={busy !== null}
        >
          <Camera size={18} />
          <span style={{ marginLeft: 8 }}>Capture</span>
        </button>
        <button className="fs-btn fs-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
