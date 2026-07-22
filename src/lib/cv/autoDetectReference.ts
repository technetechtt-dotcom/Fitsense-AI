import type { Point } from "../homography";
import { sortCornersTL } from "../homography";
import { loadOpenCv } from "./opencvLoader";
import type { CalibrationReference } from "../../types";

/**
 * Classical-CV auto-detection for the calibration reference (A4 paper or
 * ID-1 bank card) in a captured frame.
 *
 * Pipeline:
 *   1. RGBA → grayscale
 *   2. 5×5 Gaussian blur (denoise)
 *   3. Canny edge detection (50/150)
 *   4. Contour discovery (RETR_LIST)
 *   5. For each contour, simplify with approxPolyDP (ε = 2 % of arcLength)
 *   6. Keep convex quadrilaterals whose pixel area is ≥ 2 % of frame area
 *   7. Of those, score by closeness to the expected aspect ratio of the
 *      target reference; return the highest-scoring quad.
 *
 * Returns either the 4 corner points (image-px, TL→TR→BR→BL) or `null`
 * if nothing convincing was found. Callers can fall back to manual taps.
 */

const MIN_AREA_FRACTION = 0.05;
const MAX_AREA_FRACTION = 0.85;

const EXPECTED_ASPECT: Record<Exclude<CalibrationReference, "arcore_plane">, number> = {
  a4_paper: 297 / 210, // ≈ 1.414
  credit_card: 85.6 / 53.98, // ≈ 1.586
};

export interface AutoDetectResult {
  corners: Point[];
  /** Confidence in 0..1 — combines aspect-ratio match and frame coverage. */
  confidence: number;
  /** Pixel area of the detected quad. */
  areaPx: number;
}

export async function autoDetectReference(
  canvas: HTMLCanvasElement,
  calibration: Exclude<CalibrationReference, "arcore_plane">,
): Promise<AutoDetectResult | null> {
  const cv = await loadOpenCv();
  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  let best: AutoDetectResult | null = null;

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, 50, 150);
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    const frameArea = canvas.width * canvas.height;
    const expectedAspect = EXPECTED_ASPECT[calibration];

    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const arc = cv.arcLength(c, true);
      if (arc < 200) {
        c.delete();
        continue;
      }
      const approx = new cv.Mat();
      cv.approxPolyDP(c, approx, arc * 0.02, true);

      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        const area = Math.abs(cv.contourArea(approx));
        const areaFraction = area / frameArea;
        if (areaFraction >= MIN_AREA_FRACTION && areaFraction <= MAX_AREA_FRACTION) {
          const corners = matRowsToPoints(approx);
          const score = scoreQuad(corners, expectedAspect, areaFraction);
          if (!best || score > best.confidence) {
            best = {
              corners: sortCornersTL(corners),
              confidence: score,
              areaPx: area,
            };
          }
        }
      }
      approx.delete();
      c.delete();
    }
  } finally {
    src.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }

  // Require at least a modest confidence — better to fall back to taps
  // than confidently show wrong corners.
  if (!best || best.confidence < 0.65) return null;
  return best;
}

function matRowsToPoints(mat: { rows: number; data32S: Int32Array }): Point[] {
  const out: Point[] = [];
  for (let r = 0; r < mat.rows; r++) {
    out.push({
      x: mat.data32S[r * 2],
      y: mat.data32S[r * 2 + 1],
    });
  }
  return out;
}

function scoreQuad(
  corners: Point[],
  expectedAspect: number,
  areaFraction: number,
): number {
  const sorted = sortCornersTL(corners);
  // Average horizontal and vertical edge lengths
  const topPx = distance(sorted[0], sorted[1]);
  const bottomPx = distance(sorted[3], sorted[2]);
  const leftPx = distance(sorted[0], sorted[3]);
  const rightPx = distance(sorted[1], sorted[2]);
  const horiz = (topPx + bottomPx) / 2;
  const vert = (leftPx + rightPx) / 2;
  if (horiz === 0 || vert === 0) return 0;
  // Allow either orientation (landscape vs portrait).
  const aspect = Math.max(horiz, vert) / Math.min(horiz, vert);
  const aspectDelta = Math.abs(aspect - expectedAspect) / expectedAspect;
  // 0 delta → 1.0; ≥ 0.25 → 0.0
  const aspectScore = clamp01(1 - aspectDelta / 0.25);
  // Quads that occupy 5–40 % of the frame are ideal.
  const ideal = 0.18;
  const areaScore = clamp01(
    1 - Math.abs(areaFraction - ideal) / Math.max(ideal, 1 - ideal),
  );
  return 0.7 * aspectScore + 0.3 * areaScore;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
