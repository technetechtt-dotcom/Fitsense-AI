import type {
  CalibrationReference,
  FootMeasurement,
  ScanResult,
  SizeRecommendation,
} from "../types";

/**
 * Simulated measurement for embed fallbacks and demos when camera / WebXR
 * is unavailable. The main app scan flow uses the real CV pipeline in
 * `Scan.tsx` and `realMeasurement.ts`.
 */
export function simulatedMeasurement(
  calibration: CalibrationReference = "arcore_plane",
  seedMm = 261 + (Math.random() * 18 - 9),
): FootMeasurement {
  const lengthMm = round1(clamp(seedMm, 215, 320));
  const widthMm = round1(lengthMm * (0.37 + Math.random() * 0.05));
  const confidence = round2(0.7 + Math.random() * 0.25);
  return {
    lengthMm,
    widthMm,
    confidence,
    foot: "right",
    calibration,
    pixelsPerMm: 12,
  };
}

export function buildScanResult(
  userId: string,
  measurement: FootMeasurement,
  recommendation: SizeRecommendation,
  scanId: string = crypto.randomUUID(),
): ScanResult {
  return {
    scanId,
    userId,
    createdAtEpochMs: Date.now(),
    rightFoot: measurement,
    recommendation,
    arcoreUsed: measurement.calibration === "arcore_plane",
    deviceModel: navigator.userAgent,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
