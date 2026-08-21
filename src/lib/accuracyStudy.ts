/**
 * Web accuracy-study ground truth — mirrors Android Settings GT entry.
 * Rows are stored locally; export JSONL for analyze-accuracy-dataset.mjs.
 * Never invent millimetres.
 */
const STORAGE_KEY = "fitsense:accuracyStudyRows";

export type AccuracyStudyRow = {
  recordedAtEpochMs: number;
  foot: "left" | "right" | "unknown";
  measuredLengthMm: number | null;
  measuredWidthMm: number | null;
  groundTruthLengthMm: number;
  groundTruthWidthMm: number;
  calibration: string;
  confidence: number | null;
  deviceModel: string;
  manufacturer: string;
  osVersion: string;
  sessionNotes: string;
  source: "web";
};

export type AccuracyGroundTruth = {
  lengthMm: number;
  widthMm: number;
  foot: "left" | "right" | "unknown";
  sessionNotes: string;
};

let pendingGt: AccuracyGroundTruth | null = null;

export function setAccuracyGroundTruth(gt: AccuracyGroundTruth | null): void {
  pendingGt = gt;
}

export function getAccuracyGroundTruth(): AccuracyGroundTruth | null {
  return pendingGt;
}

export function listAccuracyRows(): AccuracyStudyRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AccuracyStudyRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearAccuracyRows(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function appendAccuracyRow(
  partial: Omit<
    AccuracyStudyRow,
    "recordedAtEpochMs" | "source" | "deviceModel" | "manufacturer" | "osVersion"
  > &
    Partial<Pick<AccuracyStudyRow, "deviceModel" | "manufacturer" | "osVersion">>,
): AccuracyStudyRow {
  const row: AccuracyStudyRow = {
    recordedAtEpochMs: Date.now(),
    source: "web",
    deviceModel: partial.deviceModel ?? navigator.userAgent.slice(0, 80),
    manufacturer: partial.manufacturer ?? "web",
    osVersion: partial.osVersion ?? navigator.platform,
    foot: partial.foot,
    measuredLengthMm: partial.measuredLengthMm,
    measuredWidthMm: partial.measuredWidthMm,
    groundTruthLengthMm: partial.groundTruthLengthMm,
    groundTruthWidthMm: partial.groundTruthWidthMm,
    calibration: partial.calibration,
    confidence: partial.confidence,
    sessionNotes: partial.sessionNotes,
  };
  const next = [...listAccuracyRows(), row].slice(-500);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return row;
}

/** Record GT against the latest measured foot when both are present. */
export function recordAccuracyIfReady(input: {
  measuredLengthMm: number;
  measuredWidthMm: number;
  calibration: string;
  confidence: number | null;
  foot?: "left" | "right" | "unknown";
}): AccuracyStudyRow | null {
  const gt = pendingGt;
  if (!gt) return null;
  return appendAccuracyRow({
    foot: input.foot ?? gt.foot,
    measuredLengthMm: input.measuredLengthMm,
    measuredWidthMm: input.measuredWidthMm,
    groundTruthLengthMm: gt.lengthMm,
    groundTruthWidthMm: gt.widthMm,
    calibration: input.calibration,
    confidence: input.confidence,
    sessionNotes: gt.sessionNotes,
  });
}

export function exportAccuracyJsonl(): string {
  return listAccuracyRows()
    .map((r) => JSON.stringify(r))
    .join("\n");
}
