import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  CornerUpLeft,
  Footprints,
  Maximize2,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";
import type { CalibrationReference } from "../types";
import {
  computeRealMeasurement,
  EXPERIMENTAL_UNWEIGHTED_OFFSET_MM,
  referenceDimensions,
  type RealMeasurementResult,
  type TapPoints,
} from "../lib/realMeasurement";
import { sortCornersTL, type Point } from "../lib/homography";
import { getOrCreateProfile } from "../lib/storage";
import type { Foot } from "../types";

interface SuggestedFoot {
  heel: Point;
  toe: Point;
  widthMedial?: Point;
  widthLateral?: Point;
}

interface Props {
  imageDataUrl: string;
  imageWidthPx: number;
  imageHeightPx: number;
  calibration: Exclude<CalibrationReference, "arcore_plane">;
  foot: Exclude<Foot, "unknown">;
  onMeasured: (result: RealMeasurementResult) => void;
  onRetake: () => void;
  /** Pre-populated reference quad from OpenCV.js auto-detect (#1). */
  suggestedRefCorners?: Point[];
  /** Pre-populated foot landmarks from MediaPipe Pose (#2). */
  suggestedFoot?: SuggestedFoot;
  /**
   * Optional banner shown above the tap canvas — used by the host page
   * to surface auto-detect status or sanity warnings.
   */
  banner?: React.ReactNode;
}

type Stage =
  | "accept-suggestions" // explicit confirm when CV/fallback pre-filled points
  | "ref-corners" // 0..4 reference corners
  | "heel"
  | "toe"
  | "width-medial"
  | "width-lateral"
  | "confirm";

interface State {
  refCorners: Point[];
  heel?: Point;
  toe?: Point;
  widthMedial?: Point;
  widthLateral?: Point;
  measureWidth: boolean;
  stage: Stage;
  error: string | null;
}

const INITIAL: State = {
  refCorners: [],
  measureWidth: true,
  stage: "ref-corners",
  error: null,
};

/**
 * Interactive overlay that walks the user through tapping the reference
 * object's corners and the foot landmarks on a still photo.
 *
 * The image is rendered into a sized container while taps are stored in
 * the image's native pixel space, so the homography stays correct
 * regardless of how the photo is scaled to the device's viewport.
 */
export function TapMeasurement({
  imageDataUrl,
  imageWidthPx,
  imageHeightPx,
  calibration,
  foot,
  onMeasured,
  onRetake,
  suggestedRefCorners,
  suggestedFoot,
  banner,
}: Props) {
  const [state, setState] = useState<State>(() =>
    seedState(INITIAL, { suggestedRefCorners, suggestedFoot }),
  );
  const imageRef = useRef<HTMLImageElement | null>(null);
  // Re-seed if the parent provides new suggestions after a fresh capture.
  useEffect(() => {
    setState((prev) => seedState(prev, { suggestedRefCorners, suggestedFoot }));
  }, [suggestedRefCorners, suggestedFoot]);

  const ref = referenceDimensions(calibration);
  const refLabel = ref?.label ?? "Reference";

  const stageInstruction = useMemo(() => {
    switch (state.stage) {
      case "ref-corners":
        return `Tap each of the 4 corners of your ${
          calibration === "a4_paper" ? "A4 paper" : "bank card"
        } (${state.refCorners.length}/4)`;
      case "heel":
        return "Tap the tip of your heel";
      case "toe":
        return "Tap the tip of your longest toe";
      case "width-medial":
        return state.measureWidth
          ? "Tap the innermost edge of the ball of the foot"
          : "";
      case "width-lateral":
        return state.measureWidth
          ? "Tap the outermost edge of the ball of the foot"
          : "";
      case "accept-suggestions":
        return "Auto-detect placed these landmarks — confirm they look correct, or drag/reset to edit.";
      case "confirm":
        return "Looks good? Confirm to compute your measurement.";
    }
  }, [state, calibration]);

  const onTap = (e: React.PointerEvent<HTMLDivElement>) => {
    const img = imageRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    // Convert the tap to the image's native pixel coordinates.
    const xPx = ((e.clientX - rect.left) / rect.width) * imageWidthPx;
    const yPx = ((e.clientY - rect.top) / rect.height) * imageHeightPx;
    const p: Point = { x: xPx, y: yPx };

    setState((prev) => recordTap(prev, p));
  };

  const undo = () =>
    setState((prev) => {
      switch (prev.stage) {
        case "ref-corners":
          if (prev.refCorners.length === 0) return prev;
          return {
            ...prev,
            refCorners: prev.refCorners.slice(0, -1),
            error: null,
          };
        case "heel":
          return {
            ...prev,
            refCorners: prev.refCorners.slice(0, -1),
            stage: "ref-corners",
            error: null,
          };
        case "toe":
          return { ...prev, heel: undefined, stage: "heel", error: null };
        case "width-medial":
          return { ...prev, toe: undefined, stage: "toe", error: null };
        case "width-lateral":
          return {
            ...prev,
            widthMedial: undefined,
            stage: "width-medial",
            error: null,
          };
        case "confirm":
          if (prev.measureWidth && prev.widthLateral) {
            return {
              ...prev,
              widthLateral: undefined,
              stage: "width-lateral",
              error: null,
            };
          }
          return { ...prev, toe: undefined, stage: "toe", error: null };
        case "accept-suggestions":
          return { ...prev, stage: "confirm", error: null };
      }
    });

  const reset = () => setState(INITIAL);

  const confirm = () => {
    if (!state.heel || !state.toe) {
      setState((prev) => ({
        ...prev,
        error: "Tap both heel and toe before confirming.",
      }));
      return;
    }
    try {
      const taps: TapPoints = {
        refCorners: state.refCorners,
        heel: state.heel,
        toe: state.toe,
        widthMedial: state.widthMedial,
        widthLateral: state.widthLateral,
        foot,
        imageWidthPx,
        imageHeightPx,
      };
      const prefs = getOrCreateProfile().preferences;
      const result = computeRealMeasurement(taps, calibration, {
        heelPadOffsetMm:
          import.meta.env.DEV && prefs.applyHeelPadOffset
            ? EXPERIMENTAL_UNWEIGHTED_OFFSET_MM
            : 0,
      });
      if (!result.sanity.ok) {
        setState((prev) => ({
          ...prev,
          error:
            result.sanity.issue ??
            "This scan is unreliable. Correct the points or retake the photo.",
        }));
        return;
      }
      onMeasured(result);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error:
          err instanceof Error
            ? err.message
            : "Could not compute measurement. Try re-tapping the corners.",
      }));
    }
  };

  const orderedCorners = useMemo(
    () =>
      state.refCorners.length === 4
        ? sortCornersTL(state.refCorners)
        : state.refCorners,
    [state.refCorners],
  );

  const allTapped = state.refCorners.length === 4 && state.heel && state.toe;

  return (
    <div className="flex flex-col gap-3">
      {banner ? <div>{banner}</div> : null}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black select-none touch-none"
        style={{ aspectRatio: `${imageWidthPx} / ${imageHeightPx}` }}
      >
        <img
          ref={imageRef}
          src={imageDataUrl}
          alt="Captured frame"
          className="block w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        <div className="absolute inset-0 cursor-crosshair" onPointerDown={onTap} />

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${imageWidthPx} ${imageHeightPx}`}
          preserveAspectRatio="none"
        >
          {orderedCorners.length === 4 && (
            <polygon
              points={orderedCorners.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="rgba(0,229,199,0.12)"
              stroke="#00E5C7"
              strokeWidth={Math.max(2, imageWidthPx / 320)}
              strokeDasharray={Math.max(6, imageWidthPx / 80)}
            />
          )}
          {state.refCorners.map((p, i) => (
            <Marker
              key={`ref-${i}`}
              p={p}
              color="#00E5C7"
              label={`${i + 1}`}
              scaleHint={imageWidthPx}
            />
          ))}
          {state.heel && (
            <Marker p={state.heel} color="#B8FF5C" label="H" scaleHint={imageWidthPx} />
          )}
          {state.toe && (
            <Marker p={state.toe} color="#B8FF5C" label="T" scaleHint={imageWidthPx} />
          )}
          {state.widthMedial && (
            <Marker
              p={state.widthMedial}
              color="#7C4DFF"
              label="M"
              scaleHint={imageWidthPx}
            />
          )}
          {state.widthLateral && (
            <Marker
              p={state.widthLateral}
              color="#7C4DFF"
              label="L"
              scaleHint={imageWidthPx}
            />
          )}
          {state.heel && state.toe && (
            <line
              x1={state.heel.x}
              y1={state.heel.y}
              x2={state.toe.x}
              y2={state.toe.y}
              stroke="#B8FF5C"
              strokeWidth={Math.max(2, imageWidthPx / 360)}
              strokeDasharray={Math.max(4, imageWidthPx / 120)}
            />
          )}
          {state.widthMedial && state.widthLateral && (
            <line
              x1={state.widthMedial.x}
              y1={state.widthMedial.y}
              x2={state.widthLateral.x}
              y2={state.widthLateral.y}
              stroke="#7C4DFF"
              strokeWidth={Math.max(2, imageWidthPx / 360)}
              strokeDasharray={Math.max(4, imageWidthPx / 120)}
            />
          )}
        </svg>
      </div>

      <motion.div
        key={state.stage}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card-grad border border-white/5 p-4 flex items-start gap-3"
      >
        <StageIcon stage={state.stage} />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-ink-muted">
            Reference · {refLabel}
          </div>
          <div className="text-sm font-medium">{stageInstruction}</div>
          {state.error ? (
            <div className="text-xs text-coral mt-1">{state.error}</div>
          ) : null}
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <button
          onClick={undo}
          className="rounded-xl py-2.5 text-xs font-semibold bg-surface-2 hover:bg-surface-3 flex items-center justify-center gap-1.5"
        >
          <CornerUpLeft className="w-3.5 h-3.5" />
          Undo
        </button>
        <button
          onClick={reset}
          className="rounded-xl py-2.5 text-xs font-semibold bg-surface-2 hover:bg-surface-3 flex items-center justify-center gap-1.5"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Reset
        </button>
        <button
          onClick={onRetake}
          className="rounded-xl py-2.5 text-xs font-semibold bg-surface-2 hover:bg-surface-3"
        >
          Re-take
        </button>
      </div>

      <label className="flex items-center gap-2 text-xs text-ink-muted">
        <input
          type="checkbox"
          checked={state.measureWidth}
          onChange={(e) => {
            const measureWidth = e.target.checked;
            setState((prev) => ({
              ...prev,
              measureWidth,
              widthMedial: measureWidth ? prev.widthMedial : undefined,
              widthLateral: measureWidth ? prev.widthLateral : undefined,
              stage:
                prev.stage === "width-medial" || prev.stage === "width-lateral"
                  ? measureWidth
                    ? prev.stage
                    : "confirm"
                  : prev.stage,
            }));
          }}
        />
        Also tap foot width (more accurate)
      </label>

      {state.stage === "accept-suggestions" ? (
        <PrimaryButton
          disabled={!allTapped}
          onClick={() =>
            setState((prev) => ({ ...prev, stage: "confirm", error: null }))
          }
          leadingIcon={<Check className="w-5 h-5" />}
        >
          I confirm these landmarks
        </PrimaryButton>
      ) : (
        <PrimaryButton
          disabled={!allTapped || state.stage !== "confirm"}
          onClick={confirm}
          leadingIcon={<Check className="w-5 h-5" />}
        >
          Confirm measurement
        </PrimaryButton>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Seed the tap state from auto-detect suggestions. The user always has
 * the option to tweak the suggested points via Undo/Reset; we just give
 * them a head-start when the CV pipeline is confident.
 */
function seedState(
  base: State,
  suggestions: {
    suggestedRefCorners?: Point[];
    suggestedFoot?: SuggestedFoot;
  },
): State {
  // Don't clobber user-edited state once they've already started tapping.
  if (base.refCorners.length > 0 || base.heel || base.toe) return base;
  let next = base;
  let usedSuggestions = false;
  if (suggestions.suggestedRefCorners && suggestions.suggestedRefCorners.length === 4) {
    next = {
      ...next,
      refCorners: sortCornersTL(suggestions.suggestedRefCorners),
      stage: "heel",
    };
    usedSuggestions = true;
  }
  if (suggestions.suggestedFoot && (next.stage === "heel" || usedSuggestions)) {
    next = {
      ...next,
      heel: suggestions.suggestedFoot.heel,
      toe: suggestions.suggestedFoot.toe,
      widthMedial: suggestions.suggestedFoot.widthMedial,
      widthLateral: suggestions.suggestedFoot.widthLateral,
      stage:
        suggestions.suggestedFoot.widthMedial && suggestions.suggestedFoot.widthLateral
          ? "confirm"
          : next.measureWidth
            ? "width-medial"
            : "confirm",
    };
    usedSuggestions = true;
  }
  // Require explicit acceptance of auto/fallback landmarks before measuring.
  if (usedSuggestions && next.heel && next.toe) {
    return { ...next, stage: "accept-suggestions", error: null };
  }
  return next;
}

/** Decorative chip used by callers when auto-detect successfully pre-fills. */
export function AutoDetectChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neon/15 border border-neon/35 px-2.5 py-1 text-[10px] uppercase tracking-widest text-neon">
      <Sparkles className="w-3 h-3" />
      {label}
    </span>
  );
}

function recordTap(state: State, p: Point): State {
  switch (state.stage) {
    case "ref-corners": {
      const refCorners = [...state.refCorners, p];
      if (refCorners.length >= 4) {
        return {
          ...state,
          refCorners: refCorners.slice(0, 4),
          stage: "heel",
          error: null,
        };
      }
      return { ...state, refCorners, error: null };
    }
    case "heel":
      return { ...state, heel: p, stage: "toe", error: null };
    case "toe":
      return {
        ...state,
        toe: p,
        stage: state.measureWidth ? "width-medial" : "confirm",
        error: null,
      };
    case "width-medial":
      return { ...state, widthMedial: p, stage: "width-lateral", error: null };
    case "width-lateral":
      return { ...state, widthLateral: p, stage: "confirm", error: null };
    case "accept-suggestions":
    case "confirm":
      return state;
  }
}

function StageIcon({ stage }: { stage: Stage }) {
  if (stage === "ref-corners") {
    return (
      <div className="w-9 h-9 rounded-xl bg-neon/20 grid place-items-center">
        <Maximize2 className="w-4 h-4 text-neon" />
      </div>
    );
  }
  if (stage === "heel" || stage === "toe") {
    return (
      <div className="w-9 h-9 rounded-xl bg-lime/20 grid place-items-center">
        <Footprints className="w-4 h-4 text-lime" />
      </div>
    );
  }
  if (stage === "width-medial" || stage === "width-lateral") {
    return (
      <div className="w-9 h-9 rounded-xl bg-violet/20 grid place-items-center">
        <Maximize2 className="w-4 h-4 text-violet" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-neon/20 grid place-items-center">
      <Check className="w-4 h-4 text-neon" />
    </div>
  );
}

function Marker({
  p,
  color,
  label,
  scaleHint,
}: {
  p: Point;
  color: string;
  label: string;
  scaleHint: number;
}) {
  const r = Math.max(8, scaleHint / 60);
  const fontSize = Math.max(10, scaleHint / 50);
  return (
    <g>
      <circle
        cx={p.x}
        cy={p.y}
        r={r * 1.4}
        fill="rgba(10,15,28,0.55)"
        stroke={color}
        strokeWidth={Math.max(2, scaleHint / 320)}
      />
      <circle cx={p.x} cy={p.y} r={r * 0.45} fill={color} />
      <text
        x={p.x}
        y={p.y - r * 1.7}
        fontSize={fontSize}
        fontWeight={700}
        fill={color}
        textAnchor="middle"
        style={{ paintOrder: "stroke" }}
        stroke="rgba(10,15,28,0.85)"
        strokeWidth={Math.max(2, scaleHint / 360)}
      >
        {label}
      </text>
    </g>
  );
}
