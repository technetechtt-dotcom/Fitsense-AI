import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Camera,
  CameraIcon,
  CreditCard,
  FileText,
  Loader2,
  Play,
  Ruler,
  Sparkles,
  SwitchCamera,
  X,
} from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { TapMeasurement, AutoDetectChip } from "../components/TapMeasurement";
import { CameraPermissionHelp } from "../components/CameraPermissionHelp";
import { ArScanner } from "../components/ArScanner";
import { recommend } from "../lib/recommendation";
import { SHOE_CATALOG } from "../data/catalog";
import { getOrCreateProfile, saveScan } from "../lib/storage";
import {
  appendFitEvent,
  applyScanToFitProfile,
  getOrCreateFitProfile,
  listFitEvents,
  newEventId,
  persistInsights,
} from "../lib/fitProfile";
import { deriveInsights } from "../lib/fitLearning";
import { detectArSupport, type ArAvailability } from "../lib/webxr";
import { useCamera } from "../lib/useCamera";
import { captureBurst } from "../lib/cv/burst";
import { autoDetectReference } from "../lib/cv/autoDetectReference";
import { autoDetectFoot } from "../lib/cv/autoDetectFoot";
import { segmentFoot } from "../lib/cv/footSegmentation";
import { isMobileSafari } from "../lib/platform";
import {
  nativeCapabilities,
  nativeMeasureFoot,
  type NativeCapabilities,
} from "../lib/native/bridge";
import type {
  CalibrationReference,
  Foot,
  FootMeasurement,
  ScanResult,
} from "../types";
import type { Point } from "../lib/homography";
import type { RealMeasurementResult } from "../lib/realMeasurement";

type Phase = "permission" | "live" | "captured" | "ar" | "ar-unsupported";

interface CapturedFrame {
  dataUrl: string;
  widthPx: number;
  heightPx: number;
  /** Optional auto-detected reference corners (image-px). */
  suggestedRefCorners?: Point[];
  /**
   * Optional auto-detected foot landmarks (image-px). When the GrabCut
   * segmentation succeeds, widthMedial / widthLateral are also populated
   * so the tap-to-measure overlay can pre-fill the ball-of-foot width.
   */
  suggestedFoot?: {
    heel: Point;
    toe: Point;
    widthMedial?: Point;
    widthLateral?: Point;
  };
  /** Auto-detect status banner string. */
  autoNotice?: string;
}

/**
 * Foot-scan flow.
 *
 *   1. Permission-gate: explicit "Start camera" tap (required by iOS Safari).
 *   2. Live preview with calibration picker, camera switcher and an
 *      "Auto-detect" toggle.
 *   3. Capture → 5-frame burst → pick sharpest (quality + #5 burst).
 *   4. If auto-detect is on: OpenCV.js finds the reference quad (#1) and
 *      MediaPipe Pose finds heel + toe (#2), pre-populating taps.
 *   5. Tap-to-measure overlay finishes the homography; sanity warnings
 *      surface low-quality scans (#6).
 *   6. AR-plane path opens the WebXR session (#3) for 3D distance.
 */
export function Scan() {
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [phase, setPhase] = useState<Phase>("permission");
  const [calibration, setCalibration] = useState<CalibrationReference>(
    () => getOrCreateProfile().preferences.defaultCalibration,
  );
  const [captured, setCaptured] = useState<CapturedFrame | null>(null);
  const [arSupport, setArSupport] = useState<ArAvailability>({
    kind: "unknown",
  });
  const [autoDetect, setAutoDetect] = useState(true);
  const [captureBusy, setCaptureBusy] = useState<
    null | "burst" | "ml" | "cv" | "native"
  >(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [nativeCaps, setNativeCaps] = useState<NativeCapabilities | null>(null);
  const [scanFoot, setScanFoot] = useState<Foot>("right");

  const camera = useCamera({
    onStreamReady: (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {
          // Older Android browsers throw on autoplay; the explicit start
          // button already ran inside a gesture so this is benign.
        });
      }
    },
  });

  // Move from permission → live as soon as the camera is up.
  useEffect(() => {
    if (camera.state.kind === "live" && phase === "permission") {
      setPhase("live");
    }
  }, [camera.state.kind, phase]);

  // Probe AR support and native bridge once.
  useEffect(() => {
    let cancelled = false;
    detectArSupport().then((res) => !cancelled && setArSupport(res));
    nativeCapabilities().then((caps) => !cancelled && setNativeCaps(caps));
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Capture ─────────────────────────────────────────────────────
  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setCaptureError("Camera isn't ready yet — give it a moment.");
      return;
    }
    if (calibration === "arcore_plane") {
      if (arSupport.kind === "supported") {
        setPhase("ar");
      } else {
        setPhase("ar-unsupported");
      }
      return;
    }
    setCaptureError(null);
    try {
      setCaptureBusy("burst");
      const burst = await captureBurst(video, { frames: 5, intervalMs: 90 });
      if (!burst.quality.ok && burst.quality.issue) {
        setCaptureError(burst.quality.issue);
        setCaptureBusy(null);
        return;
      }

      // Now hand off the sharpest frame to the CV / ML pipeline if the
      // user has opted into auto-detect. Both steps are tolerant of
      // failure and just fall through to manual tapping.
      let suggestedRefCorners: Point[] | undefined;
      let suggestedFoot: CapturedFrame["suggestedFoot"];
      let autoNotice: string | undefined;
      if (autoDetect) {
        try {
          setCaptureBusy("cv");
          const ref = await autoDetectReference(
            burst.canvas,
            calibration as "a4_paper" | "credit_card",
          );
          if (ref) {
            suggestedRefCorners = ref.corners;
            autoNotice = `Auto-detected reference (${Math.round(
              ref.confidence * 100,
            )}% confidence)`;
          }
        } catch {
          // OpenCV failed to load or threw — proceed without auto-ref.
        }
        try {
          setCaptureBusy("ml");
          const foot = await autoDetectFoot(burst.canvas);
          if (foot) {
            suggestedFoot = { heel: foot.heel, toe: foot.toe };
            autoNotice = autoNotice
              ? `${autoNotice} + foot landmarks`
              : `Foot landmarks auto-detected`;
            // Derive ball-of-foot width via GrabCut segmentation seeded
            // from the heel/toe keypoints. Silent fallback on failure.
            try {
              const seg = await segmentFoot({
                canvas: burst.canvas,
                heel: foot.heel,
                toe: foot.toe,
              });
              if (seg && seg.confidence > 0.2) {
                suggestedFoot = {
                  ...suggestedFoot,
                  widthMedial: seg.widthMedial,
                  widthLateral: seg.widthLateral,
                };
                autoNotice = `${autoNotice} + width segmentation`;
              }
            } catch {
              // GrabCut failed (memory / GPU). The user can still tap.
            }
          }
        } catch {
          // MediaPipe failed — fall through.
        }
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
      setPhase("captured");
    } catch (err) {
      setCaptureError(
        err instanceof Error ? err.message : "Couldn't capture the frame.",
      );
    } finally {
      setCaptureBusy(null);
    }
  }, [calibration, autoDetect, arSupport.kind]);

  const retake = () => {
    setCaptured(null);
    setCaptureError(null);
    setPhase("live");
  };

  // ─── Persist + route ─────────────────────────────────────────────
  const onMeasured = useCallback(
    (measurement: FootMeasurement, sanityIssue: string | null) => {
      const userProfile = getOrCreateProfile();
      const fitProfile = getOrCreateFitProfile();
      const recommendation = recommend(measurement, SHOE_CATALOG, {
        preferredBrands: userProfile.preferences.preferredBrands,
        profile: fitProfile,
      });
      const footField =
        scanFoot === "left"
          ? { leftFoot: { ...measurement, foot: "left" as const } }
          : { rightFoot: { ...measurement, foot: "right" as const } };
      const scan: ScanResult = {
        scanId: crypto.randomUUID(),
        userId: userProfile.userId,
        createdAtEpochMs: Date.now(),
        ...footField,
        recommendation,
        arcoreUsed: calibration === "arcore_plane",
      };
      saveScan(scan);

      // Update the persistent fit profile with this scan's geometry,
      // log a scan event so the learning engine can spot growth trends,
      // then refresh the cached insight snapshot.
      const updated = applyScanToFitProfile(scan);
      appendFitEvent({
        eventId: newEventId(),
        fitId: updated.fitId,
        epochMs: scan.createdAtEpochMs,
        kind: "scan",
        scanId: scan.scanId,
        lengthMm: measurement.lengthMm,
        widthMm: measurement.widthMm,
        asymmetryMm: updated.asymmetryMm,
      });
      persistInsights(deriveInsights(updated, listFitEvents()));

      if (sanityIssue) {
        try {
          sessionStorage.setItem(`scan:${scan.scanId}:sanity`, sanityIssue);
        } catch {
          // ignore quota errors
        }
      }
      nav(`/results/${scan.scanId}`, { replace: true });
    },
    [calibration, nav, scanFoot],
  );

  const onTapMeasured = useCallback(
    (result: RealMeasurementResult) => {
      onMeasured(result.measurement, result.sanity.issue);
    },
    [onMeasured],
  );

  /**
   * If a native shell exposes `measureFoot`, the most accurate scan is a
   * single tap away. We surface it as a top-level CTA when the bridge is
   * present; otherwise the standard reference / AR pipeline takes over.
   */
  const runNativeScan = useCallback(async () => {
    setCaptureError(null);
    setCaptureBusy("native");
    try {
      const native = await nativeMeasureFoot();
      if (!native) {
        setCaptureError("Native scan unavailable — falling back to camera.");
        return;
      }
      onMeasured(
        {
          lengthMm: native.lengthMm,
          widthMm: native.widthMm,
          confidence: native.confidence,
          foot: "right",
          calibration: "arcore_plane",
          pixelsPerMm: 0,
        },
        null,
      );
    } finally {
      setCaptureBusy(null);
    }
  }, [onMeasured]);

  const fallbackCalibration: Exclude<
    CalibrationReference,
    "arcore_plane"
  > = calibration === "credit_card" ? "credit_card" : "a4_paper";

  // ─── Permission gate (iOS Safari needs an explicit gesture) ─────
  if (phase === "permission" && camera.state.kind !== "live") {
    return (
      <PermissionGate
        cameraState={camera.state}
        onStart={camera.start}
        onRetry={camera.retry}
        onBack={() => nav("/home")}
      />
    );
  }

  // ─── AR plane modes ──────────────────────────────────────────────
  if (phase === "ar") {
    return (
      <ArScanner
        onMeasured={(m) => onMeasured(m, null)}
        onCancel={() => setPhase("live")}
        onError={(message) => {
          setArSupport({ kind: "unsupported", reason: message });
          setPhase("ar-unsupported");
        }}
      />
    );
  }
  if (phase === "ar-unsupported") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-surface-0 px-[max(1rem,env(safe-area-inset-left))] sm:px-5 pt-[max(5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] max-w-3xl mx-auto w-full">
        <ArProbe
          support={arSupport}
          onUseReference={() => {
            setCalibration("a4_paper");
            setPhase("live");
          }}
          onClose={() => nav("/home")}
        />
      </div>
    );
  }

  // ─── Live preview + capture ─────────────────────────────────────
  return (
    <div className="relative min-h-[100dvh] min-h-screen w-full bg-surface-0 overflow-hidden">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover ${
          phase === "live" ? "opacity-100" : "opacity-0"
        }`}
      />

      {phase === "live" ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/85 pointer-events-none" />
          <FootSilhouette />
          <ReferenceHint calibration={calibration} />
        </>
      ) : null}

      <header className="absolute inset-x-0 top-0 z-10 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => nav(-1)}
          aria-label="Close"
          className="w-11 h-11 rounded-full bg-black/45 backdrop-blur grid place-items-center hover:bg-black/60"
        >
          <X className="w-5 h-5" />
        </button>
        {phase === "live" ? (
          <div className="flex-1 flex justify-center">
            <span className="px-4 py-1.5 rounded-full bg-black/55 backdrop-blur text-xs font-semibold text-neon">
              {captureLabel(calibration)}
            </span>
          </div>
        ) : (
          <div className="flex-1" />
        )}
        {phase === "live" && camera.state.kind === "live" ? (
          <CameraSwitcher
            cameras={camera.state.cameras}
            activeId={camera.state.device?.deviceId}
            onPick={camera.switchCamera}
          />
        ) : (
          <span className="w-11" />
        )}
      </header>

      {captureError ? (
        <div className="absolute top-20 inset-x-5 z-30 rounded-2xl bg-warning/15 border border-warning/40 px-4 py-2.5 text-xs text-warning flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{captureError}</span>
          <button
            onClick={() => setCaptureError(null)}
            className="ml-auto opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {captureBusy ? (
        <div className="absolute inset-0 z-30 grid place-items-center bg-surface-0/55 backdrop-blur-sm">
          <div className="bg-surface-1 border border-ink-dim/40 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-glow">
            <Loader2 className="w-5 h-5 text-neon animate-spin" />
            <span className="text-sm">
              {captureBusy === "burst"
                ? "Capturing burst…"
                : captureBusy === "cv"
                ? "Finding reference object…"
                : captureBusy === "native"
                ? "Running native depth scan…"
                : "Detecting foot landmarks…"}
            </span>
          </div>
        </div>
      ) : null}

      {phase === "captured" && captured ? (
        <div className="relative z-10 min-h-[100dvh] bg-surface-0/95 backdrop-blur pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-[max(1.5rem,env(safe-area-inset-bottom))] px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] overflow-y-auto overflow-x-hidden">
          <TapMeasurement
            imageDataUrl={captured.dataUrl}
            imageWidthPx={captured.widthPx}
            imageHeightPx={captured.heightPx}
            calibration={fallbackCalibration}
            onMeasured={onTapMeasured}
            onRetake={retake}
            suggestedRefCorners={captured.suggestedRefCorners}
            suggestedFoot={captured.suggestedFoot}
            banner={
              captured.autoNotice ? (
                <AutoDetectChip label={captured.autoNotice} />
              ) : null
            }
          />
        </div>
      ) : null}

      {phase === "live" ? (
        <footer className="absolute inset-x-0 bottom-0 z-10 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-3 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-2 sm:space-y-3">
          {nativeCaps?.hasDepthSensor ? (
            <button
              onClick={runNativeScan}
              disabled={captureBusy !== null}
              className="w-full rounded-2xl bg-violet/85 text-white text-sm font-semibold py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Use {nativeCaps.platform.includes("ios") ? "LiDAR" : "depth"} sensor for sub-mm accuracy
            </button>
          ) : null}
          <FootPicker value={scanFoot} onChange={setScanFoot} />
          <CalibrationPicker
            value={calibration}
            onChange={setCalibration}
            arSupport={arSupport}
          />
          <AutoDetectToggle value={autoDetect} onChange={setAutoDetect} />
          <PrimaryButton
            className="w-full"
            onClick={capture}
            disabled={captureBusy !== null}
            leadingIcon={<Camera className="w-5 h-5" />}
          >
            Capture
          </PrimaryButton>
        </footer>
      ) : null}

      {camera.state.kind === "denied" ? (
        <CameraPermissionHelp
          message={camera.state.message}
          recoverable={camera.state.recoverable}
          onRetry={camera.retry}
          onClose={() => nav("/home")}
        />
      ) : null}
    </div>
  );
}

// ─── Permission gate ────────────────────────────────────────────

function PermissionGate({
  cameraState,
  onStart,
  onRetry,
  onBack,
}: {
  cameraState: ReturnType<typeof useCamera>["state"];
  onStart: () => Promise<void>;
  onRetry: () => Promise<void>;
  onBack: () => void;
}) {
  const safari = isMobileSafari();
  return (
    <div className="min-h-[100dvh] min-h-screen bg-surface-0 px-[max(1rem,env(safe-area-inset-left))] sm:px-5 pt-[max(5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] grid place-items-center">
      <div className="max-w-sm w-full space-y-5 text-center mx-auto">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-neon/15 grid place-items-center">
          <CameraIcon className="w-7 h-7 text-neon" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold">Scan your foot</h1>
          <p className="text-sm text-ink-muted">
            We need access to your camera. Nothing is uploaded — every
            measurement runs on your device.
          </p>
          {safari ? (
            <p className="text-xs text-ink-soft">
              Safari requires you to tap below to allow the camera.
            </p>
          ) : null}
        </div>
        {cameraState.kind === "denied" ? (
          <CameraPermissionHelp
            message={cameraState.message}
            recoverable={cameraState.recoverable}
            onRetry={onRetry}
            onClose={onBack}
          />
        ) : null}
        {cameraState.kind === "unavailable" ? (
          <div className="rounded-2xl bg-coral/15 border border-coral/35 px-4 py-3 text-xs text-coral">
            {cameraState.message}
          </div>
        ) : null}
        <div className="space-y-2">
          <PrimaryButton
            className="w-full"
            onClick={onStart}
            disabled={cameraState.kind === "starting"}
            leadingIcon={
              cameraState.kind === "starting" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )
            }
          >
            {cameraState.kind === "starting" ? "Starting…" : "Start camera"}
          </PrimaryButton>
          <button
            onClick={onBack}
            className="w-full py-2 text-xs text-ink-muted hover:text-ink"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Live overlay UI ────────────────────────────────────────────

function FootSilhouette() {
  return (
    <svg
      className="absolute inset-0 m-auto pointer-events-none w-[min(200px,52vw)] h-auto max-h-[62vh]"
      viewBox="0 0 200 320"
      style={{ top: 0, bottom: 0, left: 0, right: 0, opacity: 0.5 }}
    >
      <defs>
        <linearGradient id="footStroke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00E5C7" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#00E5C7" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path
        d="M100 18 C 60 18, 38 70, 38 130 C 38 180, 50 220, 56 250 C 62 280, 80 305, 100 305 C 120 305, 138 280, 144 250 C 150 220, 162 180, 162 130 C 162 70, 140 18, 100 18 Z"
        fill="none"
        stroke="url(#footStroke)"
        strokeWidth={3}
        strokeDasharray="6 6"
      />
    </svg>
  );
}

function ReferenceHint({
  calibration,
}: {
  calibration: CalibrationReference;
}) {
  const label =
    calibration === "a4_paper"
      ? "Stand on a sheet of A4 paper (full weight)"
      : calibration === "credit_card"
      ? "Place a bank card flat next to your foot"
      : "Aim at the floor — we'll calibrate against the plane";
  return (
    <div className="absolute top-20 inset-x-5 z-10 flex justify-center pointer-events-none">
      <div className="rounded-full bg-black/55 backdrop-blur px-4 py-2 text-xs font-medium text-ink">
        {label}
      </div>
    </div>
  );
}

function FootPicker({
  value,
  onChange,
}: {
  value: Foot;
  onChange: (f: Foot) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["right", "left"] as const).map((foot) => (
        <button
          key={foot}
          type="button"
          onClick={() => onChange(foot)}
          className={`rounded-2xl py-2.5 text-xs font-semibold capitalize transition-colors ${
            value === foot
              ? "bg-neon text-surface-0"
              : "bg-black/55 backdrop-blur text-ink border border-white/10"
          }`}
        >
          {foot} foot
        </button>
      ))}
    </div>
  );
}

function CalibrationPicker({
  value,
  onChange,
  arSupport,
}: {
  value: CalibrationReference;
  onChange: (v: CalibrationReference) => void;
  arSupport: ArAvailability;
}) {
  const items: Array<{
    id: CalibrationReference;
    label: string;
    Icon: typeof FileText;
    disabled?: boolean;
    badge?: string;
  }> = [
    {
      id: "arcore_plane",
      label: "AR plane",
      Icon: Sparkles,
      disabled: arSupport.kind === "unsupported",
      badge: arSupport.kind === "supported" ? "beta" : undefined,
    },
    { id: "a4_paper", label: "A4 paper", Icon: FileText },
    { id: "credit_card", label: "Bank card", Icon: CreditCard },
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            disabled={it.disabled}
            className={`rounded-2xl px-3 py-3 text-xs font-semibold flex flex-col items-center gap-1 transition-colors ${
              active
                ? "bg-neon text-surface-0"
                : "bg-black/55 backdrop-blur text-ink border border-white/10 hover:border-white/25"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <it.Icon className="w-4 h-4" />
            <span>{it.label}</span>
            {it.badge ? (
              <span className="text-[9px] uppercase tracking-widest text-lime">
                {it.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function AutoDetectToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl bg-black/55 backdrop-blur border border-white/10 px-4 py-2.5 text-xs">
      <span className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-neon" />
        Auto-detect reference & foot
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="w-9 h-5 appearance-none rounded-full bg-ink-dim/40 checked:bg-neon relative cursor-pointer before:absolute before:top-0.5 before:left-0.5 before:w-4 before:h-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
      />
    </label>
  );
}

function CameraSwitcher({
  cameras,
  activeId,
  onPick,
}: {
  cameras: Array<{ deviceId: string; label: string; facing: string }>;
  activeId: string | undefined;
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (cameras.length <= 1) return <span className="w-11" />;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch camera"
        className="w-11 h-11 rounded-full bg-black/45 backdrop-blur grid place-items-center hover:bg-black/60"
      >
        <SwitchCamera className="w-5 h-5" />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl bg-surface-1 border border-ink-dim/40 shadow-glow p-1">
          {cameras.map((c) => (
            <button
              key={c.deviceId}
              onClick={() => {
                onPick(c.deviceId);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-ink-dim/20 ${
                c.deviceId === activeId ? "bg-neon/15 text-neon" : ""
              }`}
            >
              <div className="font-medium truncate">{c.label}</div>
              <div className="text-[10px] text-ink-muted">{c.facing}</div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ArProbe({
  support,
  onUseReference,
  onClose,
}: {
  support: ArAvailability;
  onUseReference: () => void;
  onClose: () => void;
}) {
  const message = useMemo(() => {
    if (support.kind === "supported") {
      return {
        title: "AR plane scanning",
        body:
          "Your device supports WebXR AR sessions. Tap below to switch into immersive AR — you'll point your camera at the floor, then tap your heel and longest toe to capture a 3D measurement.",
        tone: "info" as const,
      };
    }
    if (support.kind === "unsupported") {
      return {
        title: "AR plane isn't supported here",
        body:
          (support as { reason: string }).reason ??
          "Your device doesn't support WebXR AR sessions. Use A4 paper or a bank card instead — it's just as accurate.",
        tone: "warn" as const,
      };
    }
    return {
      title: "Checking AR support…",
      body: "One moment while we probe your device's WebXR capabilities.",
      tone: "info" as const,
    };
  }, [support]);
  return (
    <div className="max-w-md mx-auto rounded-3xl bg-card-grad border border-white/10 p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-2xl grid place-items-center ${
            message.tone === "warn" ? "bg-coral/20" : "bg-neon/20"
          }`}
        >
          {message.tone === "warn" ? (
            <AlertTriangle className="w-5 h-5 text-coral" />
          ) : (
            <Sparkles className="w-5 h-5 text-neon" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg leading-tight">{message.title}</h2>
          <p className="text-sm text-ink-muted mt-1 leading-relaxed">
            {message.body}
          </p>
        </div>
      </div>
      <div className="rounded-2xl bg-surface-2 border border-white/5 p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-ink-muted">
          What we recommend
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Ruler className="w-4 h-4 text-neon" />
          <span>A reference object gives sub-millimetre accuracy today.</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton variant="ghost" onClick={onClose}>
          Cancel
        </PrimaryButton>
        <PrimaryButton onClick={onUseReference}>
          Use A4 paper
        </PrimaryButton>
      </div>
    </div>
  );
}

function captureLabel(c: CalibrationReference): string {
  switch (c) {
    case "arcore_plane":
      return "AR plane (tap Capture to begin)";
    case "a4_paper":
      return "Calibrating against A4 paper";
    case "credit_card":
      return "Calibrating against bank card";
  }
}
