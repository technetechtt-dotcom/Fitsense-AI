import type {
  FitSenseNative,
  NativeCapabilities,
  NativeFootMeasurement,
} from "./bridge";

/**
 * Mount `window.FitSenseNative` from the Capacitor `FitSenseAR` plugin
 * when the app boots inside the iOS shell.
 *
 * The Capacitor JS bridge is imported dynamically so the web bundle
 * stays usable in a plain browser (where the import either resolves to
 * a stub or is skipped entirely).
 *
 * Call {@link installCapacitorBridge} once during app bootstrap; it
 * detects Capacitor and a registered `FitSenseAR` plugin, and quietly
 * no-ops on plain web.
 */

interface FitSenseARPlugin {
  getCapabilities: () => Promise<NativeCapabilities>;
  measureFoot: () => Promise<NativeFootMeasurement>;
}

let installed = false;

export async function installCapacitorBridge(): Promise<boolean> {
  if (installed) return true;
  if (typeof window === "undefined") return false;
  try {
    const cap = await import("@capacitor/core");
    if (!cap.Capacitor.isNativePlatform()) return false;
    // `registerPlugin` returns a typed proxy for the named native plugin
    // — Capacitor 3+ idiomatic. On JS-only builds (web preview, Jest)
    // method calls throw, but `isNativePlatform()` guards us above.
    const plugin = cap.registerPlugin<FitSenseARPlugin>("FitSenseAR");
    const bridge: FitSenseNative = {
      getCapabilities: () => plugin.getCapabilities(),
      measureFoot: () => plugin.measureFoot(),
    };
    window.FitSenseNative = bridge;
    installed = true;
    return true;
  } catch (err) {
    console.warn("[fitsense] Capacitor bridge install failed", err);
    return false;
  }
}

/** True after we successfully installed the bridge. */
export function isCapacitorBridgeInstalled(): boolean {
  return installed;
}
