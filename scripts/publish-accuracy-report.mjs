#!/usr/bin/env node
/**
 * Publish accuracy analysis into docs/records with a human-readable summary.
 * Usage:
 *   node scripts/publish-accuracy-report.mjs path/to/accuracy_dataset.jsonl
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { relative, resolve } from "node:path";

const cwd = process.cwd();
const inputAbs = resolve(process.argv[2] ?? "docs/records/accuracy-sample.jsonl");
const inputRel = relative(cwd, inputAbs).replace(/\\/g, "/") || inputAbs;
const outJson = resolve("docs/records/accuracy-report-latest.json");
const outMd = resolve("docs/records/accuracy-report-latest.md");

mkdirSync(resolve("docs/records"), { recursive: true });

const analyze = spawnSync(
  process.execPath,
  [resolve("scripts/analyze-accuracy-dataset.mjs"), inputAbs, "--out", outJson],
  { encoding: "utf8" },
);

if (analyze.status !== 0) {
  console.error(analyze.stdout || analyze.stderr || "analyze failed");
  process.exit(analyze.status ?? 1);
}
console.log(analyze.stdout);

const report = JSON.parse(readFileSync(outJson, "utf8"));
const lines = [
  "# Accuracy report (latest)",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Source: \`${inputRel}\``,
  "",
  `| Metric | Value |`,
  `| ------ | ----- |`,
  `| Pass | ${report.pass ? "YES" : "NO"} |`,
  `| n | ${report.n ?? report.count ?? "—"} |`,
  `| Length median abs error (mm) | ${report.length?.median ?? report.lengthMedianAbsErrorMm ?? "—"} |`,
  `| Length P95 (mm) | ${report.length?.p95 ?? report.lengthP95AbsErrorMm ?? "—"} |`,
  `| Width median abs error (mm) | ${report.width?.median ?? report.widthMedianAbsErrorMm ?? "—"} |`,
  `| Width P95 (mm) | ${report.width?.p95 ?? report.widthP95AbsErrorMm ?? "—"} |`,
  "",
  "Replace sample JSONL with real Brannock study exports before launch certification.",
  "See [ACCURACY_STUDY.md](../ACCURACY_STUDY.md) and [SUPPORTED_DEVICES.md](../SUPPORTED_DEVICES.md).",
  "",
];
writeFileSync(outMd, lines.join("\n"), "utf8");
console.log(`published → ${relative(cwd, outMd).replace(/\\/g, "/")}`);
