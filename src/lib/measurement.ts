import type { FootMeasurement, ScanResult, SizeRecommendation } from "../types";

export function buildScanResult(
  userId: string,
  measurement: FootMeasurement,
  recommendation: SizeRecommendation,
  scanId: string = crypto.randomUUID(),
  measurementKind: "measured" | "simulated" = "measured",
): ScanResult {
  return {
    scanId,
    userId,
    createdAtEpochMs: Date.now(),
    rightFoot: measurement,
    recommendation,
    arcoreUsed: measurement.calibration === "arcore_plane",
    deviceModel: navigator.userAgent,
    provenance: {
      measurementKind,
      method:
        measurementKind === "simulated"
          ? "demo"
          : measurement.calibration === "arcore_plane"
            ? "webxr"
            : "reference",
      algorithmVersion: "web-0.2.0",
      widthSource: measurementKind === "simulated" ? "estimated" : "measured",
      qualityStatus: measurementKind === "simulated" ? "rejected" : "accepted",
      pairedFeet: false,
    },
  };
}
