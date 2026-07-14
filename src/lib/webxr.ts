/**
 * Lightweight WebXR feature detection for the "AR plane" calibration mode.
 *
 * Real-world cross-platform AR plane scanning on the web is currently only
 * reliably available on Android Chrome ≥ 81 (ARCore-backed). iOS Safari
 * has no WebXR AR session support at the time of writing. Desktop browsers
 * have it almost universally disabled.
 *
 * Rather than ship a half-working WebXR session and a WebGL renderer just
 * to render a reticle, we use this module for honest capability detection:
 * if the browser reports `immersive-ar` is supported we let the user pick
 * the AR-plane chip; otherwise we surface a clear fallback prompt and
 * route them to the tap-to-measure flow with A4 / bank card.
 *
 * The hooks here are intentionally extension points: when we promote the
 * AR-plane mode out of beta we can fill in `startArSession` with a real
 * `requestSession({ requiredFeatures: ['hit-test'] })` call.
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
      reason:
        "Your device/browser doesn't support immersive AR. Try Android Chrome.",
    };
  } catch {
    // Some browsers throw for cross-origin / unsecured contexts.
    return { kind: "unknown" };
  }
}

/**
 * Placeholder until a full XR renderer ships. Resolves with a session-
 * placeholder; callers should always be prepared to fall back to the
 * tap-to-measure flow on rejection.
 */
export async function startArSession(): Promise<{ supported: boolean }> {
  const support = await detectArSupport();
  return { supported: support.kind === "supported" };
}
