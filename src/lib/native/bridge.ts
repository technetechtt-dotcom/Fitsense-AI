/**
 * Native bridge — the web layer's contract with an optional Capacitor
 * (or React Native, Cordova, …) shell that ships the FitSense web app
 * inside a native container.
 *
 * The web app is intentionally self-sufficient: every feature works in
 * a vanilla browser. When a host *does* expose a native bridge though,
 * we can take advantage of:
 *
 *   - **LiDAR / ToF depth maps** (iPhone Pro, Pixel 8 Pro, Samsung S24 Ultra)
 *     for sub-millimetre accuracy without a reference object.
 *   - **ARCore / ARKit raw camera intrinsics** for tighter homography fit.
 *   - **Background privacy attestation** — only the depth/scan metadata
 *     leaves the device, never the camera frames themselves.
 *
 * Hosts opt-in by attaching a `FitSenseNative` object on the global
 * `window` object before the web bundle boots. The shape is the
 * contract documented in NATIVE.md.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DepthFrame {
  /** Raw float32 buffer, row-major, with `width*height` elements. */
  data: Float32Array;
  width: number;
  height: number;
  /**
   * Camera intrinsics aligned with the depth map. Optional; if absent we
   * fall back to a heuristic mapping.
   */
  intrinsics?: {
    fx: number;
    fy: number;
    cx: number;
    cy: number;
  };
  /** Capture timestamp in milliseconds (epoch). */
  capturedAtEpochMs: number;
}

/** Result of a native single-shot foot measurement. */
export interface NativeFootMeasurement {
  lengthMm: number;
  widthMm: number;
  archHeightMm?: number;
  confidence: number;
  /** 'lidar' | 'arkit' | 'arcore' | 'fallback' */
  source: string;
}

export interface NativeCapabilities {
  hasDepthSensor: boolean;
  hasArkit: boolean;
  hasArcore: boolean;
  /** Free-form string the host can populate for diagnostics. */
  platform: string;
}

/**
 * Optional native bridge implementation, mounted by the host shell on
 * `window.FitSenseNative` before the web bundle boots.
 */
export interface FitSenseNative {
  /** Quick capability probe so the web app can branch UX. */
  getCapabilities: () => Promise<NativeCapabilities> | NativeCapabilities;
  /**
   * One-shot foot measurement using whichever hardware the host can
   * reach (LiDAR > AR > camera-only). Must NOT upload frames anywhere.
   */
  measureFoot?: () => Promise<NativeFootMeasurement>;
  /**
   * Stream depth frames. Returns an unsubscribe function. The web layer
   * uses this for live debugging / advanced fitting flows. Optional.
   */
  subscribeDepth?: (cb: (frame: DepthFrame) => void) => () => void;
  /** Host-managed permission helper (open native settings, etc.). */
  openCameraSettings?: () => void;
}

declare global {
  interface Window {
    FitSenseNative?: FitSenseNative;
  }
}

/** True if a host shell mounted a bridge. */
export function hasNativeBridge(): boolean {
  return typeof window !== "undefined" && !!window.FitSenseNative;
}

/** Returns the bridge or `null` if unmounted. */
export function getNativeBridge(): FitSenseNative | null {
  if (typeof window === "undefined") return null;
  return window.FitSenseNative ?? null;
}

/**
 * Optional capability snapshot. Returns `null` when no bridge is
 * installed so callers can degrade to web-only flows.
 */
export async function nativeCapabilities(): Promise<NativeCapabilities | null> {
  const bridge = getNativeBridge();
  if (!bridge) return null;
  try {
    const result = await bridge.getCapabilities();
    return result;
  } catch {
    return null;
  }
}

/**
 * Run the native one-shot measurement, if available.
 *
 * Returns `null` when the bridge is unmounted or the host hasn't
 * implemented `measureFoot`. Callers should keep their reference-based
 * fallback path live regardless.
 */
export async function nativeMeasureFoot(): Promise<NativeFootMeasurement | null> {
  const bridge = getNativeBridge();
  if (!bridge?.measureFoot) return null;
  try {
    return await bridge.measureFoot();
  } catch {
    return null;
  }
}
