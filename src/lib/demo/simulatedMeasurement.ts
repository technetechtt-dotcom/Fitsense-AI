import type { CalibrationReference, FootMeasurement } from "../../types";

/**
 * Development-only fake data. Import dynamically from a DEV-only branch.
 * Never save, sync, hand off, or recommend retail products from this value.
 */
export function simulatedMeasurement(
  calibration: CalibrationReference = "arcore_plane",
  seedMm = 261 + (Math.random() * 18 - 9),
): FootMeasurement {
  if (!import.meta.env.DEV) {
    throw new Error("Simulated measurement is unavailable outside development.");
  }

  const lengthMm = round1(clamp(seedMm, 215, 320));
  const widthMm = round1(lengthMm * (0.37 + Math.random() * 0.05));
  return {
    lengthMm,
    widthMm,
    confidence: 0,
    foot: "right",
    calibration,
    pixelsPerMm: 0,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
