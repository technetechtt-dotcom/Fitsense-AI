#!/usr/bin/env node
/**
 * Analyze AccuracyDatasetStore JSONL exports from physical accuracy studies.
 *
 * Usage:
 *   node scripts/analyze-accuracy-dataset.mjs path/to/accuracy_dataset.jsonl
 */
import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/analyze-accuracy-dataset.mjs <dataset.jsonl>");
  process.exit(1);
}

const lines = readFileSync(path, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

const rows = [];
for (const line of lines) {
  try {
    const row = JSON.parse(line);
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
  const mae = mean;
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  const median = sorted[Math.floor(sorted.length / 2)];
  return { n: values.length, mae, median, p95 };
}

const lengthErr = rows.map((r) => Math.abs(r.measuredLengthMm - r.groundTruthLengthMm));
const widthErr = rows
  .filter((r) => typeof r.groundTruthWidthMm === "number")
  .map((r) => Math.abs(r.measuredWidthMm - r.groundTruthWidthMm));

const length = stats(lengthErr);
const width = widthErr.length ? stats(widthErr) : null;

const passLength = length.median <= 2.0 && length.p95 <= 4.0;
const passWidth = !width || (width.median <= 2.5 && width.p95 <= 5.0);

const report = {
  path,
  length,
  width,
  pass: passLength && passWidth,
  thresholds: {
    lengthMedianMm: 2.0,
    lengthP95Mm: 4.0,
    widthMedianMm: 2.5,
    widthP95Mm: 5.0,
  },
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 3);
