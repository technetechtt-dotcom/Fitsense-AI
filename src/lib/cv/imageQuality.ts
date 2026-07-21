/**
 * Cheap image-quality metrics computed on a canvas without OpenCV.
 *
 * Used by the scanner to gate captures: too blurry, too dark, or
 * reference-too-small frames are rejected up front so we don't bother
 * the user with a wonky measurement.
 *
 * All three metrics operate on a downscaled copy of the source (320 px
 * wide max) to keep frame-time predictable on low-end Android.
 */

export interface ImageQuality {
  /** Laplacian variance — proxy for sharpness. Typical thresholds: */
  /*    < 60 = blurry, 60..120 = soft, > 120 = sharp. */
  sharpness: number;
  /** Mean luminance in 0..255 — < 35 = too dark, > 235 = blown out. */
  meanLuminance: number;
  /** Fraction of pixels near black; high values indicate severe shadow/clipping. */
  shadowFraction: number;
  /** Fraction of pixels near white; high values indicate glare/clipping. */
  highlightFraction: number;
  /** Composite OK flag. */
  ok: boolean;
  /** Human-readable reason if not OK. */
  issue: string | null;
}

const MAX_PROBE_WIDTH = 320;
const SHARPNESS_FLOOR = 55;
const LUMINANCE_MIN = 35;
const LUMINANCE_MAX = 235;
const CLIPPED_FRACTION_MAX = 0.3;

/**
 * Compute sharpness + brightness for a captured frame.
 */
export function probeImageQuality(canvas: HTMLCanvasElement): ImageQuality {
  const { width, height } = canvas;
  if (width === 0 || height === 0) {
    return emptyResult("Empty frame.");
  }

  // Downscale for speed.
  const scale = Math.min(1, MAX_PROBE_WIDTH / width);
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return emptyResult("Couldn't allocate probe canvas.");
  ctx.drawImage(canvas, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);

  // Convert to grayscale (8-bit). Reuse a typed array for the kernel.
  const gray = new Uint8ClampedArray(w * h);
  let lumSum = 0;
  let shadowPixels = 0;
  let highlightPixels = 0;
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
    gray[j] = lum;
    lumSum += lum;
    if (lum < 20) shadowPixels++;
    if (lum > 245) highlightPixels++;
  }
  const meanLuminance = lumSum / (w * h);
  const shadowFraction = shadowPixels / (w * h);
  const highlightFraction = highlightPixels / (w * h);

  // Laplacian (3×3 kernel) → variance.
  let sumSq = 0;
  let sum = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v =
        -gray[i - w - 1] -
        gray[i - w] -
        gray[i - w + 1] -
        gray[i - 1] +
        gray[i] * 8 -
        gray[i + 1] -
        gray[i + w - 1] -
        gray[i + w] -
        gray[i + w + 1];
      sum += v;
      sumSq += v * v;
      n++;
    }
  }
  const mean = sum / n;
  const sharpness = sumSq / n - mean * mean;

  let issue: string | null = null;
  if (sharpness < SHARPNESS_FLOOR) {
    issue = "Photo looks blurry — hold the device steady and try again.";
  } else if (meanLuminance < LUMINANCE_MIN) {
    issue = "Too dark — move to better light and try again.";
  } else if (meanLuminance > LUMINANCE_MAX) {
    issue = "Photo is overexposed — soften the lighting and try again.";
  } else if (shadowFraction > CLIPPED_FRACTION_MAX) {
    issue = "Severe shadows hide the foot or reference — use bright, even light.";
  } else if (highlightFraction > CLIPPED_FRACTION_MAX) {
    issue = "Glare hides the foot or reference — avoid flash and reflective light.";
  }
  return {
    sharpness,
    meanLuminance,
    shadowFraction,
    highlightFraction,
    ok: issue === null,
    issue,
  };
}

function emptyResult(issue: string): ImageQuality {
  return {
    sharpness: 0,
    meanLuminance: 0,
    shadowFraction: 1,
    highlightFraction: 0,
    ok: false,
    issue,
  };
}
