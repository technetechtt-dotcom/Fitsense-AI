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

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  const median = sorted[Math.floor(sorted.length / 2)];
  return { n: values.length, mae: mean, median, p95 };
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

const report = {
  path,
  mode: strict ? "strict-study" : "product-definition",
  thresholds: THRESHOLDS,
  n: rows.length,
  overall,
  cohorts,
  pass: overall.pass,
};

const json = JSON.stringify(report, null, 2);
console.log(json);
if (writePath) writeFileSync(writePath, json + "\n", "utf8");
process.exit(report.pass ? 0 : 3);
