import {
  applyHomography,
  computeHomography,
  distance,
  sortCornersTL,
  type Point,
} from "./homography";
import type { CalibrationReference, FootMeasurement } from "../types";

/**
 * Real (non-simulated) foot measurement using a tap-to-mark workflow.
 *
 *   1. The user captures a single frame containing both a reference
 *      object (A4 paper or ID-1 bank card) and the foot, lying on the
 *      same flat plane.
 *   2. The user taps the 4 corners of the reference and key foot points
 *      (heel + longest toe; optionally the widest medial/lateral edges).
 *   3. We compute a planar homography from the image-space corners to
 *      the known mm-space rectangle of the reference, then project the
 *      foot taps through that homography to read off real distances.
 *
 * This is fundamentally how every offline foot-measurement app works.
 * The homography correctly accounts for perspective distortion as long
 * as the reference and foot are coplanar.
 */

/** Real-world dimensions of supported reference objects, in millimetres. */
const REFERENCE_DIMENSIONS_MM: Record<
  Exclude<CalibrationReference, "arcore_plane">,
  { widthMm: number; heightMm: number; label: string }
> = {
  a4_paper: { widthMm: 210, heightMm: 297, label: "A4 paper (ISO 216)" },
  credit_card: {
    widthMm: 85.6,
    heightMm: 53.98,
    label: "Bank card (ISO/IEC 7810 ID-1)",
  },
};

/**
 * A validated weight-bearing scan measures the loaded foot directly, so the
 * default correction is zero. Population-average offsets must never be added
 * silently to a value presented as a real measurement.
 */
export const DEFAULT_HEEL_PAD_OFFSET_MM = 0;

/** Development/experimental seated-scan estimate; not launch-validated. */
export const EXPERIMENTAL_UNWEIGHTED_OFFSET_MM = 4;

/** All points the user taps on the captured frame. */
export interface TapPoints {
  /** Any 4 corners of the reference. Order is normalised internally. */
  refCorners: Point[];
  /** Tip of the heel. */
  heel: Point;
  /** Tip of the longest toe. */
  toe: Point;
  /** Optional: widest medial edge (inner side of foot). */
  widthMedial?: Point;
  /** Optional: widest lateral edge (outer side of foot). */
  widthLateral?: Point;
  /** Which foot was scanned. Default "right". */
  foot?: "left" | "right";
  /** Pixel dimensions of the source image (for confidence scoring). */
  imageWidthPx?: number;
  imageHeightPx?: number;
}

export interface RealMeasurementResult {
  measurement: FootMeasurement;
  /** Homography matrix used (exposed for debug overlays). */
  H: ReturnType<typeof computeHomography>;
  /** Reference object label, for UX. */
  referenceLabel: string;
  /** Whether the width was measured or estimated from length. */
  widthSource: "measured" | "estimated";
  /** Reference sanity report — surfaced to the user when something's off. */
  sanity: ReferenceSanity;
}

/**
 * Diagnostic report on how trustworthy the tapped reference quad is.
 *
 * `aspectMismatch` compares the tapped quad's aspect ratio (already
 * normalised so we accept either landscape or portrait orientation)
 * against the known ratio of the chosen reference. `scaleConsistency`
 * is the coefficient of variation across the four px/mm ratios — if
 * the user tapped corners at extreme perspective the consistency drops
 * and we flag it so they can re-tap.
 */
export interface ReferenceSanity {
  /** 0..1 — 1 = perfect aspect ratio match. */
  aspectScore: number;
  /** 0..1 — 1 = pixels-per-mm identical across all four edges. */
  scaleConsistencyScore: number;
  /** Overall pass/fail. */
  ok: boolean;
  /** Human-readable issue if not OK. */
  issue: string | null;
}

/**
 * Compute a real {@link FootMeasurement} from user-tapped points.
 *
 * Throws if the homography is degenerate (e.g. user tapped 3 colinear
 * corners) — callers should catch and prompt the user to re-tap.
 */
export interface ComputeRealMeasurementOptions {
  /**
   * Explicit millimetres added to the raw measurement for an experimental
   * non-weight-bearing protocol. Validated standing scans must use `0`.
   */
  heelPadOffsetMm?: number;
}

export function computeRealMeasurement(
  taps: TapPoints,
  calibration: CalibrationReference,
  options: ComputeRealMeasurementOptions = {},
): RealMeasurementResult {
  if (calibration === "arcore_plane") {
    throw new Error(
      "AR-plane mode uses WebXR scale directly; not a tap-to-measure target.",
    );
  }
  const dims = REFERENCE_DIMENSIONS_MM[calibration];
  if (taps.refCorners.length !== 4) {
    throw new Error("Need exactly 4 reference corners to calibrate.");
  }

  const ordered = sortCornersTL(taps.refCorners);
  const topEdgePx = distance(ordered[0], ordered[1]);
  const rightEdgePx = distance(ordered[1], ordered[2]);
  const bottomEdgePx = distance(ordered[3], ordered[2]);
  const leftEdgePx = distance(ordered[0], ordered[3]);
  const horizontalPx = (topEdgePx + bottomEdgePx) / 2;
  const verticalPx = (leftEdgePx + rightEdgePx) / 2;
  const longMm = Math.max(dims.widthMm, dims.heightMm);
  const shortMm = Math.min(dims.widthMm, dims.heightMm);
  const worldWidthMm = horizontalPx >= verticalPx ? longMm : shortMm;
  const worldHeightMm = horizontalPx >= verticalPx ? shortMm : longMm;
  const dst: Point[] = [
    { x: 0, y: 0 },
    { x: worldWidthMm, y: 0 },
    { x: worldWidthMm, y: worldHeightMm },
    { x: 0, y: worldHeightMm },
  ];
  const H = computeHomography(ordered, dst);

  const heelMm = applyHomography(H, taps.heel);
  const toeMm = applyHomography(H, taps.toe);
  const rawLengthMm = distance(heelMm, toeMm);
  const heelPadOffsetMm = options.heelPadOffsetMm ?? DEFAULT_HEEL_PAD_OFFSET_MM;
  const lengthMm = rawLengthMm + heelPadOffsetMm;

  let widthMm: number;
  let widthSource: "measured" | "estimated";
  if (taps.widthMedial && taps.widthLateral) {
    const medialMm = applyHomography(H, taps.widthMedial);
    const lateralMm = applyHomography(H, taps.widthLateral);
    widthMm = distance(medialMm, lateralMm);
    widthSource = "measured";
  } else {
    // 0.38 is the population-average ratio of foot width to length
    // (e.g. https://en.wikipedia.org/wiki/Shoe_size).
    widthMm = lengthMm * 0.38;
    widthSource = "estimated";
  }

  // pixels-per-mm is computed from the average edge length of the
  // reference quad — a stable scale value useful for downstream tooling
  // (e.g. drawing overlays in image space at a given mm size).
  const pxPerMmTop = topEdgePx / worldWidthMm;
  const pxPerMmBottom = bottomEdgePx / worldWidthMm;
  const pxPerMmLeft = leftEdgePx / worldHeightMm;
  const pxPerMmRight = rightEdgePx / worldHeightMm;
  const pixelsPerMm = (pxPerMmTop + pxPerMmBottom + pxPerMmLeft + pxPerMmRight) / 4;

  const referenceSanity = computeSanity(
    [pxPerMmTop, pxPerMmBottom, pxPerMmLeft, pxPerMmRight],
    [topEdgePx, bottomEdgePx, leftEdgePx, rightEdgePx],
    { widthMm: worldWidthMm, heightMm: worldHeightMm },
    {
      widthPx: taps.imageWidthPx ?? 0,
      heightPx: taps.imageHeightPx ?? 0,
      areaPx: quadArea(ordered),
      fullyVisible: referenceHasFrameMargin(
        ordered,
        taps.imageWidthPx ?? 0,
        taps.imageHeightPx ?? 0,
      ),
    },
  );
  const dimensionIssue = validateDimensions(lengthMm, widthMm, widthSource);
  const issue = referenceSanity.issue ?? dimensionIssue;
  const sanity: ReferenceSanity = {
    ...referenceSanity,
    ok: issue === null,
    issue,
  };

  const confidence = computeConfidence({
    pixelsPerMm,
    ordered,
    image: {
      width: taps.imageWidthPx ?? 0,
      height: taps.imageHeightPx ?? 0,
    },
    widthSource,
    sanity,
  });

  return {
    measurement: {
      lengthMm,
      widthMm,
      confidence,
      dimensionConfidence: {
        length: confidence,
        width: widthSource === "measured" ? confidence : 0,
      },
      foot: taps.foot ?? "right",
      calibration,
      pixelsPerMm,
    },
    H,
    referenceLabel: dims.label,
    widthSource,
    sanity,
  };
}

/**
 * Sanity-checks the tapped reference quad against the chosen reference's
 * known dimensions. Two signals:
 *
 *  - **aspect mismatch**: tapped quad's outer aspect ratio vs the
 *    expected aspect of the reference (orientation-agnostic).
 *  - **scale consistency**: standard deviation / mean of the four
 *    px-per-mm ratios across the 4 reference edges. High variance
 *    means the user is at a steep angle, dramatically reducing accuracy.
 */
function computeSanity(
  pxPerMm: [number, number, number, number],
  edgesPx: [number, number, number, number],
  dims: { widthMm: number; heightMm: number },
  image: {
    widthPx: number;
    heightPx: number;
    areaPx: number;
    fullyVisible: boolean;
  },
): ReferenceSanity {
  const expectedAspect = dims.heightMm / dims.widthMm;
  // Aspect of tapped quad — orientation-invariant.
  const horiz = (edgesPx[0] + edgesPx[1]) / 2;
  const vert = (edgesPx[2] + edgesPx[3]) / 2;
  const observedAspect =
    horiz === 0 || vert === 0 ? 0 : Math.max(horiz, vert) / Math.min(horiz, vert);
  const expected = expectedAspect >= 1 ? expectedAspect : 1 / expectedAspect;
  const aspectDelta = Math.abs(observedAspect - expected) / expected;
  const aspectScore = clamp01(1 - aspectDelta / 0.25);

  // px/mm coefficient of variation.
  const mean = pxPerMm.reduce((s, v) => s + v, 0) / pxPerMm.length;
  if (mean <= 0) {
    return {
      aspectScore,
      scaleConsistencyScore: 0,
      ok: false,
      issue: "Reference quad has zero size — please re-tap the corners.",
    };
  }
  const variance = pxPerMm.reduce((s, v) => s + (v - mean) ** 2, 0) / pxPerMm.length;
  const cv = Math.sqrt(variance) / mean;
  const scaleConsistencyScore = clamp01(1 - cv / 0.2);

  let issue: string | null = null;
  const frameArea = image.widthPx * image.heightPx;
  const frameFraction = frameArea > 0 ? image.areaPx / frameArea : 0;
  if (!Number.isFinite(mean) || mean < 0.5 || mean > 100) {
    issue =
      "The reference produced an impossible scale. Reposition it and retap all four corners.";
  } else if (!image.fullyVisible) {
    issue =
      "The reference touches or leaves the frame. Retake with all four edges visible and a clear margin.";
  } else if (frameArea <= 0 || frameFraction < 0.05) {
    issue =
      "The reference is too small in the photo. Move the phone closer while keeping the whole foot visible.";
  } else if (aspectScore < 0.7) {
    issue =
      "The corners you tapped don't match the chosen reference's shape — make sure you've picked A4 or a bank card correctly.";
  } else if (scaleConsistencyScore < 0.7) {
    issue =
      "The camera angle looks steep, which hurts accuracy. Try shooting from straight above for a sharper result.";
  }
  return {
    aspectScore,
    scaleConsistencyScore,
    ok: issue === null,
    issue,
  };
}

function referenceHasFrameMargin(
  corners: Point[],
  widthPx: number,
  heightPx: number,
): boolean {
  if (widthPx <= 0 || heightPx <= 0) return false;
  const margin = Math.max(4, Math.min(widthPx, heightPx) * 0.01);
  return corners.every(
    (point) =>
      point.x >= margin &&
      point.y >= margin &&
      point.x <= widthPx - margin &&
      point.y <= heightPx - margin,
  );
}

function validateDimensions(
  lengthMm: number,
  widthMm: number,
  widthSource: "measured" | "estimated",
): string | null {
  if (!Number.isFinite(lengthMm) || lengthMm < 120 || lengthMm > 360) {
    return "Heel-to-toe length is implausible. Check the heel and longest-toe points.";
  }
  if (widthSource !== "measured") {
    return "Ball width must be measured for a valid scan. Mark both sides of the widest forefoot.";
  }
  if (!Number.isFinite(widthMm) || widthMm < 45 || widthMm > 160) {
    return "Ball width is implausible. Check both ball-of-foot landmarks.";
  }
  const ratio = widthMm / lengthMm;
  if (ratio < 0.25 || ratio > 0.55) {
    return "The measured width-to-length ratio is implausible. Correct the foot landmarks and try again.";
  }
  return null;
}

/**
 * Heuristic 0..1 score combining scale density, aspect-ratio sanity of the
 * reference quad and presence of explicit width taps. Surfaced in the
 * Results screen so users can see how much they should trust the number.
 */
function computeConfidence(input: {
  pixelsPerMm: number;
  ordered: Point[];
  image: { width: number; height: number };
  widthSource: "measured" | "estimated";
  sanity: ReferenceSanity;
}): number {
  let score = 0.4;
  // Higher px/mm density → finer measurement.
  if (input.pixelsPerMm >= 3) score += 0.15;
  else if (input.pixelsPerMm >= 1.5) score += 0.07;
  // Reference should occupy a reasonable share of the frame.
  if (input.image.width > 0 && input.image.height > 0) {
    const area = quadArea(input.ordered);
    const frameArea = input.image.width * input.image.height;
    const ratio = area / frameArea;
    if (ratio >= 0.05 && ratio <= 0.6) score += 0.1;
  }
  if (input.widthSource === "measured") score += 0.1;
  // Sanity-check contribution dominates: if the corners look wrong we
  // shouldn't pretend the measurement is trustworthy.
  score += 0.15 * input.sanity.aspectScore;
  score += 0.1 * input.sanity.scaleConsistencyScore;
  return Math.max(0, Math.min(1, score));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function quadArea(p: Point[]): number {
  // Shoelace formula, taking absolute value to avoid winding-order issues.
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    const a = p[i];
    const b = p[(i + 1) % 4];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function referenceDimensions(
  calibration: CalibrationReference,
): { widthMm: number; heightMm: number; label: string } | null {
  if (calibration === "arcore_plane") return null;
  return REFERENCE_DIMENSIONS_MM[calibration];
}
