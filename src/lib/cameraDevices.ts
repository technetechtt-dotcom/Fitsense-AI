/**
 * Camera enumeration helpers.
 *
 * Modern phones expose 3–4 back cameras (main, ultra-wide, telephoto,
 * sometimes monochrome). The browser's `facingMode: environment` hint
 * picks one but not always the most useful — for foot measurement we
 * want the *standard* back camera (1× focal length), never the ultra-wide
 * because ultra-wides introduce barrel distortion that fights the
 * planar homography assumption.
 *
 * Device labels are only populated after the user grants camera
 * permission once, so the first enumeration may return anonymous
 * entries. {@link enumerateCameras} returns whatever's available and
 * the caller can re-call after `getUserMedia` succeeds.
 */

export interface CameraDevice {
  deviceId: string;
  label: string;
  facing: "user" | "environment" | "unknown";
  /** Heuristic: looks like an ultra-wide / wide / tele lens. */
  hint?: "main" | "ultra-wide" | "telephoto" | "depth";
}

export async function enumerateCameras(): Promise<CameraDevice[]> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return [];
  }
  const all = await navigator.mediaDevices.enumerateDevices();
  return all
    .filter((d) => d.kind === "videoinput")
    .map((d) => ({
      deviceId: d.deviceId,
      label: d.label || "Camera",
      facing: guessFacing(d.label),
      hint: guessHint(d.label),
    }));
}

/**
 * Pick the best camera for foot measurement: prefer the back-facing
 * standard lens, fall back to whichever back camera exists, and last
 * resort the front camera.
 */
export function pickPreferredCamera(cameras: CameraDevice[]): CameraDevice | null {
  if (cameras.length === 0) return null;
  const back = cameras.filter((c) => c.facing === "environment");
  if (back.length > 0) {
    const main = back.find((c) => c.hint === "main");
    if (main) return main;
    // Avoid ultra-wide/depth if we can.
    const safe = back.find((c) => c.hint !== "ultra-wide" && c.hint !== "depth");
    return safe ?? back[0];
  }
  return cameras[0];
}

function guessFacing(label: string): "user" | "environment" | "unknown" {
  const lc = label.toLowerCase();
  if (
    lc.includes("front") ||
    lc.includes("user") ||
    lc.includes("selfie") ||
    lc.includes("facetime")
  ) {
    return "user";
  }
  if (
    lc.includes("back") ||
    lc.includes("rear") ||
    lc.includes("environment") ||
    lc.includes("world")
  ) {
    return "environment";
  }
  return "unknown";
}

function guessHint(
  label: string,
): "main" | "ultra-wide" | "telephoto" | "depth" | undefined {
  const lc = label.toLowerCase();
  if (lc.includes("ultra")) return "ultra-wide";
  if (lc.includes("wide angle") && !lc.includes("ultra")) return "main";
  if (lc.includes("tele")) return "telephoto";
  if (lc.includes("depth") || lc.includes("tof")) return "depth";
  if (lc.includes("main") || lc.includes("standard")) return "main";
  return undefined;
}
