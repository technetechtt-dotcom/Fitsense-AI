/**
 * Lightweight WebXR feature detection for the "AR plane" calibration mode.
 *
 * Real-world cross-platform AR plane scanning on the web is currently only
 * reliably available on Android Chrome ≥ 81 (ARCore-backed). iOS Safari
 * has no WebXR AR session support at the time of writing. Desktop browsers
 * have it almost universally disabled.
 *
 * This module owns honest capability detection:
 * if the browser reports `immersive-ar` is supported we let the user pick
 * the AR-plane chip; otherwise we surface a clear fallback prompt and
 * route them to the tap-to-measure flow with A4 / bank card.
 * The real session and hit-test implementation lives in `arSession.ts`.
 */

import "./webxr-types";

export type ArAvailability =
  | { kind: "unsupported"; reason: string }
  | { kind: "supported"; sessionMode: "immersive-ar" }
  | { kind: "unknown" };

/**
 * Probes for `immersive-ar` support. Safe to call from anywhere; resolves
 * within a single event loop tick on browsers without a WebXR runtime.
 */
export async function detectArSupport(): Promise<ArAvailability> {
  if (typeof navigator === "undefined") {
    return { kind: "unsupported", reason: "Not in a browser context." };
  }
  const xr = navigator.xr;
  if (!xr || typeof xr.isSessionSupported !== "function") {
    return {
      kind: "unsupported",
      reason: "Your browser doesn't expose WebXR.",
    };
  }
  try {
    const supported = await xr.isSessionSupported("immersive-ar");
    if (supported) {
      return { kind: "supported", sessionMode: "immersive-ar" };
    }
    return {
      kind: "unsupported",
      reason: "Your device/browser doesn't support immersive AR. Try Android Chrome.",
    };
  } catch {
    // Some browsers throw for cross-origin / unsecured contexts.
    return { kind: "unknown" };
  }
}
