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
 * Heel-pad compression offset, in millimetres.
 *
 * Adult feet measured unweighted (e.g. seated, foot flat next to a piece
 * of A4) are 3–5 mm shorter than the same foot measured while standing,
 * because the heel-pad fat layer compresses under bodyweight. Production
 * shoe-fitting tools therefore add this offset before mapping to a shoe
 * size — otherwise we systematically recommend shoes that are too small.
 *
 * Default value of 4 mm is a population mid-point. Users can opt out
 * (e.g. for children or already-standing scans) via Settings.
 */
export const DEFAULT_HEEL_PAD_OFFSET_MM = 4;

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
   * mm added to the raw length measurement to compensate for heel-pad
   * squish when scanning the foot under load. Defaults to
   * {@link DEFAULT_HEEL_PAD_OFFSET_MM}. Set to `0` if the user explicitly
   * scanned without weight on the foot.
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
  const dst: Point[] = [
    { x: 0, y: 0 },
    { x: dims.widthMm, y: 0 },
    { x: dims.widthMm, y: dims.heightMm },
    { x: 0, y: dims.heightMm },
  ];
  const H = computeHomography(ordered, dst);

  const heelMm = applyHomography(H, taps.heel);
  const toeMm = applyHomography(H, taps.toe);
  const rawLengthMm = distance(heelMm, toeMm);
  const heelPadOffsetMm =
    options.heelPadOffsetMm ?? DEFAULT_HEEL_PAD_OFFSET_MM;
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
  const topEdgePx = distance(ordered[0], ordered[1]);
  const rightEdgePx = distance(ordered[1], ordered[2]);
  const bottomEdgePx = distance(ordered[3], ordered[2]);
  const leftEdgePx = distance(ordered[0], ordered[3]);
  const pxPerMmTop = topEdgePx / dims.widthMm;
  const pxPerMmBottom = bottomEdgePx / dims.widthMm;
  const pxPerMmLeft = leftEdgePx / dims.heightMm;
  const pxPerMmRight = rightEdgePx / dims.heightMm;
  const pixelsPerMm =
    (pxPerMmTop + pxPerMmBottom + pxPerMmLeft + pxPerMmRight) / 4;

  const sanity = computeSanity(
    [pxPerMmTop, pxPerMmBottom, pxPerMmLeft, pxPerMmRight],
    [topEdgePx, bottomEdgePx, leftEdgePx, rightEdgePx],
    dims,
  );

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
): ReferenceSanity {
  const expectedAspect = dims.heightMm / dims.widthMm;
  // Aspect of tapped quad — orientation-invariant.
  const horiz = (edgesPx[0] + edgesPx[1]) / 2;
  const vert = (edgesPx[2] + edgesPx[3]) / 2;
  const observedAspect =
    horiz === 0 || vert === 0
      ? 0
      : Math.max(horiz, vert) / Math.min(horiz, vert);
  const expected =
    expectedAspect >= 1 ? expectedAspect : 1 / expectedAspect;
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
  const variance =
    pxPerMm.reduce((s, v) => s + (v - mean) ** 2, 0) / pxPerMm.length;
  const cv = Math.sqrt(variance) / mean;
  const scaleConsistencyScore = clamp01(1 - cv / 0.20);

  let issue: string | null = null;
  if (aspectScore < 0.55) {
    issue =
      "The corners you tapped don't match the chosen reference's shape — make sure you've picked A4 or a bank card correctly.";
  } else if (scaleConsistencyScore < 0.55) {
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
