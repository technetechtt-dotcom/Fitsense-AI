import { probeImageQuality, type ImageQuality } from "./imageQuality";

/**
 * Burst-capture helper.
 *
 * Records N frames in quick succession from a `<video>` element, scores
 * each with {@link probeImageQuality}, and returns the sharpest frame
 * (composited to a fresh canvas at the video's native resolution).
 *
 * This dramatically improves capture reliability — a single tap on the
 * shutter is unlikely to be perfectly steady, but the *best of five* is
 * usually pin-sharp.
 */

export interface BurstResult {
  /** The selected sharpest frame, drawn to a fresh canvas. */
  canvas: HTMLCanvasElement;
  /** Quality metrics for the picked frame. */
  quality: ImageQuality;
  /** Number of candidate frames captured before scoring. */
  framesCaptured: number;
}

export interface BurstOptions {
  /** Number of frames to capture. Default 5. */
  frames?: number;
  /** Spacing between frames in ms. Default 90 (~ 11 fps capture). */
  intervalMs?: number;
  /** Optional callback fired before each capture (for animation). */
  onTick?: (frameIndex: number, total: number) => void;
}

export async function captureBurst(
  video: HTMLVideoElement,
  options: BurstOptions = {},
): Promise<BurstResult> {
  const frames = Math.max(1, options.frames ?? 5);
  const interval = Math.max(20, options.intervalMs ?? 90);
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    throw new Error("Video is not ready — wait for the camera to warm up.");
  }
  const candidates: Array<{ canvas: HTMLCanvasElement; q: ImageQuality }> = [];
  for (let i = 0; i < frames; i++) {
    options.onTick?.(i, frames);
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Couldn't allocate capture canvas.");
    ctx.drawImage(video, 0, 0, c.width, c.height);
    const q = probeImageQuality(c);
    candidates.push({ canvas: c, q });
    if (i < frames - 1) {
      await new Promise((r) => setTimeout(r, interval));
    }
  }
  // Pick the sharpest frame whose luminance is acceptable.
  const usable = candidates.filter(
    (c) => c.q.meanLuminance >= 35 && c.q.meanLuminance <= 235,
  );
  const pool = usable.length > 0 ? usable : candidates;
  pool.sort((a, b) => b.q.sharpness - a.q.sharpness);
  const best = pool[0];
  return {
    canvas: best.canvas,
    quality: best.q,
    framesCaptured: candidates.length,
  };
}
