#!/usr/bin/env node
/**
 * Analyze AccuracyDatasetStore JSONL exports from physical accuracy studies.
 *
 * Usage:
 *   node scripts/analyze-accuracy-dataset.mjs path/to/accuracy_dataset.jsonl
 *
 * Pass gates align with docs/PRODUCT_DEFINITION.md (acceptance thresholds):
 *   length median ≤ 2 mm, P95 ≤ 5 mm
 *   width  median ≤ 3 mm, P95 ≤ 6 mm
 *
 * Stricter pilot study gates (docs/ACCURACY_STUDY.md) can be requested with:
 *   --strict
 */
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const writePath = (() => {
  const i = args.indexOf("--out");
  return i >= 0 ? args[i + 1] : null;
})();
const path = args.find((a) => !a.startsWith("--") && a !== writePath);

if (!path) {
  console.error(
    "Usage: node scripts/analyze-accuracy-dataset.mjs <dataset.jsonl> [--strict] [--out report.json]",
  );
  process.exit(1);
}

const THRESHOLDS = strict
  ? {
      lengthMedianMm: 2.0,
      lengthP95Mm: 4.0,
      widthMedianMm: 2.5,
      widthP95Mm: 5.0,
    }
  : {
      lengthMedianMm: 2.0,
      lengthP95Mm: 5.0,
      widthMedianMm: 3.0,
      widthP95Mm: 6.0,
    };

const text = readFileSync(path, "utf8");
const chunks = [];
// Compact JSONL (one object per line) + legacy pretty-printed objects.
for (const line of text.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) chunks.push(trimmed);
}
if (chunks.length === 0) {
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        chunks.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
}

const rows = [];
for (const chunk of chunks) {
  try {
    const row = JSON.parse(chunk);
    if (
      typeof row.measuredLengthMm === "number" &&
      typeof row.groundTruthLengthMm === "number"
    ) {
      rows.push(row);
    }
  } catch {
    // skip
  }
}

if (rows.length === 0) {
  console.error("No rows with both measuredLengthMm and groundTruthLengthMm.");
  process.exit(2);
}

function percentile(sorted, p) {
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = percentile(sorted, 0.5);
  const p95 = percentile(sorted, 0.95);
  return {
    n: values.length,
    mae: mean,
    median: Number(median.toFixed(3)),
    p95: Number(p95.toFixed(3)),
  };
}

function cohortKey(row) {
  const model = row.deviceModel || "unknown";
  const os = row.osVersion || "unknown-os";
  const cal = row.calibration || "unknown-cal";
  return `${model} | Android ${os} | ${cal}`;
}

function analyze(subset) {
  const lengthErr = subset.map((r) =>
    Math.abs(r.measuredLengthMm - r.groundTruthLengthMm),
  );
  const widthErr = subset
    .filter((r) => typeof r.groundTruthWidthMm === "number")
    .map((r) => Math.abs(r.measuredWidthMm - r.groundTruthWidthMm));
  const length = stats(lengthErr);
  const width = widthErr.length ? stats(widthErr) : null;
  const passLength =
    length.median <= THRESHOLDS.lengthMedianMm && length.p95 <= THRESHOLDS.lengthP95Mm;
  const passWidth =
    !width ||
    (width.median <= THRESHOLDS.widthMedianMm && width.p95 <= THRESHOLDS.widthP95Mm);
  return { length, width, pass: passLength && passWidth };
}

const overall = analyze(rows);
const byDevice = {};
for (const row of rows) {
  const key = cohortKey(row);
  if (!byDevice[key]) byDevice[key] = [];
  byDevice[key].push(row);
}
const cohorts = Object.fromEntries(
  Object.entries(byDevice).map(([key, subset]) => [key, analyze(subset)]),
);

const MIN_CERTIFY_N = 30;
const sampleDataset = /accuracy-sample|synthetic|demo[_-]dataset/i.test(path);
const reasons = [];
if (sampleDataset) {
  reasons.push("source is a sample/synthetic dataset, not a Brannock study export");
}
if (rows.length < MIN_CERTIFY_N) {
  reasons.push(`n=${rows.length} is below the internal-validation floor (${MIN_CERTIFY_N})`);
}
const failingCohorts = Object.entries(cohorts).filter(
  ([, c]) => c.length.n >= 5 && !c.pass,
);
if (failingCohorts.length) {
  reasons.push(
    `cohorts below gate with n≥5: ${failingCohorts.map(([k]) => k).join("; ")}`,
  );
}
const certified = overall.pass && !sampleDataset && rows.length >= MIN_CERTIFY_N && failingCohorts.length === 0;

const report = {
  path,
  mode: strict ? "strict-study" : "product-definition",
  thresholds: THRESHOLDS,
  n: rows.length,
  overall,
  cohorts,
  /** Thresholds on this file only — not launch certification. */
  pass: overall.pass,
  sampleDataset,
  minCertifyN: MIN_CERTIFY_N,
  certified,
  reasons,
  length: overall.length,
  width: overall.width,
  lengthMedianAbsErrorMm: overall.length.median,
  lengthP95AbsErrorMm: overall.length.p95,
  widthMedianAbsErrorMm: overall.width?.median ?? null,
  widthP95AbsErrorMm: overall.width?.p95 ?? null,
};

const json = JSON.stringify(report, null, 2);
console.log(json);
if (writePath) writeFileSync(writePath, json + "\n", "utf8");
process.exit(report.pass ? 0 : 3);
