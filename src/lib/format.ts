import type { MeasurementUnit } from "../types";

/**
 * Display helpers that honour the user's units preference.
 */

const MM_PER_INCH = 25.4;

export function formatLength(mm: number, units: MeasurementUnit): string {
  if (units === "in") {
    return `${(mm / MM_PER_INCH).toFixed(2)}″`;
  }
  return `${mm.toFixed(1)} mm`;
}

/** Same as [formatLength] but returns value + unit separately for tiles. */
export function splitLength(
  mm: number,
  units: MeasurementUnit,
): { value: string; unit: string } {
  if (units === "in") {
    return { value: (mm / MM_PER_INCH).toFixed(2), unit: "in" };
  }
  return { value: mm.toFixed(1), unit: "mm" };
}
