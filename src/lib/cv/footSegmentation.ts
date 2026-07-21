import type { Point } from "../homography";
import { loadOpenCv } from "./opencvLoader";

/**
 * GrabCut-based foot segmentation.
 *
 * Why GrabCut and not a custom CNN?  A trained foot-segmentation network
 * would be ideal but is out of scope to ship + serve here. GrabCut gives
 * us a strong silhouette in seconds when we *seed* it from points we
 * already trust — the heel and toe landmarks emitted by MediaPipe Pose.
 *
 * Pipeline:
 *
 *   1. Convert the RGBA frame to 3-channel RGB (OpenCV grabCut requires
 *      a CV_8UC3 input).
 *   2. Build a probable-foreground rectangle around the heel→toe segment
 *      with a margin proportional to the foot length. Everything outside
 *      a generous outer rect is definite background.
 *   3. Run `grabCut` with `GC_INIT_WITH_RECT` for a few iterations.
 *   4. Threshold the resulting mask to a binary foot mask (foreground +
 *      probable foreground).
 *   5. Walk along the heel→toe axis sampling the perpendicular extent of
 *      the foot mask. Pick the *maximum* — this is the ball-of-foot
 *      width, which is what every shoe last is sized against.
 *
 * Returns the medial + lateral points that bound the widest foot section
 * in **image-pixel coordinates**. Callers feed these into the existing
 * homography pipeline so the result is in millimetres without changes.
 */

export interface SegmentationInput {
  /** Canvas containing the captured frame. */
  canvas: HTMLCanvasElement;
  heel: Point;
  toe: Point;
}

export interface SegmentationOutput {
  widthMedial: Point;
  widthLateral: Point;
  /** Pixel width — useful for sanity checks. */
  widthPx: number;
  /**
   * Where along the heel→toe axis the widest section sits (0 = heel,
   * 1 = toe). For most adult feet the ball-of-foot is around 0.7.
   */
  ballPosition: number;
  /** 0..1 — proportional to mask area inside the foot bbox. */
  confidence: number;
}

const GRABCUT_ITERATIONS = 3;

export async function segmentFoot(
  input: SegmentationInput,
): Promise<SegmentationOutput | null> {
  const cv = await loadOpenCv();
  const { canvas, heel, toe } = input;
  if (canvas.width === 0 || canvas.height === 0) return null;

  const src = cv.imread(canvas);
  const rgb = new cv.Mat();
  const mask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
  const bgdModel = cv.Mat.zeros(1, 65, cv.CV_64FC1);
  const fgdModel = cv.Mat.zeros(1, 65, cv.CV_64FC1);

  try {
    cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);

    const lengthPx = Math.hypot(toe.x - heel.x, toe.y - heel.y);
    if (lengthPx < 30) return null;

    // Bounding rect around heel→toe with a width-margin large enough to
    // contain the foot. Adult foot width is ≈ 0.4× length, so a half-width
    // of 0.3× length on each side is generous.
    const halfMargin = lengthPx * 0.4;
    const minX = Math.max(0, Math.min(heel.x, toe.x) - halfMargin);
    const maxX = Math.min(src.cols - 1, Math.max(heel.x, toe.x) + halfMargin);
    const minY = Math.max(0, Math.min(heel.y, toe.y) - halfMargin);
    const maxY = Math.min(src.rows - 1, Math.max(heel.y, toe.y) + halfMargin);
    const rectW = maxX - minX;
    const rectH = maxY - minY;
    if (rectW < 20 || rectH < 20) return null;

    const rect = new cv.Rect(
      Math.round(minX),
      Math.round(minY),
      Math.round(rectW),
      Math.round(rectH),
    );

    cv.grabCut(
      rgb,
      mask,
      rect,
      bgdModel,
      fgdModel,
      GRABCUT_ITERATIONS,
      cv.GC_INIT_WITH_RECT,
    );

    // Convert the 4-state mask into a binary 0/1 foreground mask.
    // Foreground = GC_FGD (1) or GC_PR_FGD (3).
    const fgMask = binariseMask(mask, cv);

    // Walk along the heel→toe axis sampling perpendicular extent.
    const sampleCount = 48;
    const dx = toe.x - heel.x;
    const dy = toe.y - heel.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len; // unit along axis
    const uy = dy / len;
    const nx = -uy; // unit perpendicular (right-hand)
    const ny = ux;

    let bestWidthPx = 0;
    let bestMedial: Point | null = null;
    let bestLateral: Point | null = null;
    let bestT = 0;
    let totalFgPx = 0;

    // Sample at most halfMargin pixels each side of the axis.
    const halfSearch = halfMargin;

    for (let i = 1; i < sampleCount - 1; i++) {
      const t = i / (sampleCount - 1);
      const cx = heel.x + ux * (len * t);
      const cy = heel.y + uy * (len * t);

      // Walk outward in both perpendicular directions until we leave the
      // foreground mask. The width of the foreground band centred on the
      // axis is `posExtent + negExtent`.
      const posExtent = walkOutwards(fgMask, cv, cx, cy, nx, ny, halfSearch);
      const negExtent = walkOutwards(fgMask, cv, cx, cy, -nx, -ny, halfSearch);
      totalFgPx += posExtent + negExtent;
      const widthPx = posExtent + negExtent;
      if (widthPx > bestWidthPx) {
        bestWidthPx = widthPx;
        bestMedial = {
          x: cx - nx * negExtent,
          y: cy - ny * negExtent,
        };
        bestLateral = {
          x: cx + nx * posExtent,
          y: cy + ny * posExtent,
        };
        bestT = t;
      }
    }

    if (!bestMedial || !bestLateral || bestWidthPx < 8) return null;

    // Confidence: fraction of expected foot area we actually filled.
    const expectedArea = lengthPx * lengthPx * 0.35;
    const confidence = clamp01(totalFgPx / (expectedArea * (sampleCount / 48)));

    return {
      widthMedial: bestMedial,
      widthLateral: bestLateral,
      widthPx: bestWidthPx,
      ballPosition: bestT,
      confidence,
    };
  } finally {
    src.delete();
    rgb.delete();
    mask.delete();
    bgdModel.delete();
    fgdModel.delete();
  }
}

function binariseMask(
  mask: import("./opencvLoader").OcvMat,
  cv: Awaited<ReturnType<typeof loadOpenCv>>,
): Uint8Array {
  // OpenCV.js exposes raw mask bytes through `mask.data`. Each pixel is
  // a single uchar: 0=BG, 1=FG, 2=PR_BG, 3=PR_FG.
  const out = new Uint8Array(mask.rows * mask.cols);
  const src = mask.data;
  for (let i = 0; i < src.length; i++) {
    out[i] = src[i] === cv.GC_FGD || src[i] === cv.GC_PR_FGD ? 1 : 0;
  }
  // Stash dimensions on the buffer for the caller — keeps the helper
  // signature flat.
  (out as unknown as { cols: number }).cols = mask.cols;
  (out as unknown as { rows: number }).rows = mask.rows;
  return out;
}

/**
 * Walk outward from (cx, cy) along a unit-vector until we hit a non-foot
 * pixel or the image boundary. Returns the distance traveled in pixels.
 */
function walkOutwards(
  mask: Uint8Array,
  _cv: Awaited<ReturnType<typeof loadOpenCv>>,
  cx: number,
  cy: number,
  ux: number,
  uy: number,
  maxDist: number,
): number {
  const cols = (mask as unknown as { cols: number }).cols;
  const rows = (mask as unknown as { rows: number }).rows;
  const stepCount = Math.ceil(maxDist);
  let lastInside = 0;
  // We tolerate up to 2 pixels of mask noise — only break after we see a
  // run of background.
  let bgRun = 0;
  const BG_TOLERANCE = 2;
  for (let s = 1; s <= stepCount; s++) {
    const x = Math.round(cx + ux * s);
    const y = Math.round(cy + uy * s);
    if (x < 0 || x >= cols || y < 0 || y >= rows) break;
    const v = mask[y * cols + x];
    if (v === 1) {
      lastInside = s;
      bgRun = 0;
    } else {
      bgRun++;
      if (bgRun > BG_TOLERANCE) break;
    }
  }
  return lastInside;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
