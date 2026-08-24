#!/usr/bin/env node
/**
 * Publish accuracy analysis into docs/records with a human-readable summary.
 * Usage:
 *   node scripts/publish-accuracy-report.mjs path/to/accuracy_dataset.jsonl
 *
 * Sample JSONL is labelled uncertified. Launch certification requires n≥30
 * real Brannock rows — never invent millimetres.
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

if (analyze.status !== 0 && analyze.status !== 3) {
  console.error(analyze.stdout || analyze.stderr || "analyze failed");
  process.exit(analyze.status ?? 1);
}
if (analyze.stdout) console.log(analyze.stdout);

const report = JSON.parse(readFileSync(outJson, "utf8"));
const length = report.overall?.length ?? report.length ?? {};
const width = report.overall?.width ?? report.width ?? {};
const mm = (v) => (typeof v === "number" && Number.isFinite(v) ? String(v) : "—");
const certified = Boolean(report.certified);
const sample = Boolean(report.sampleDataset);
const reasons = Array.isArray(report.reasons) ? report.reasons : [];

const lines = [
  "# Accuracy report (latest)",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Source: \`${inputRel}\``,
  "",
  sample || !certified
    ? "> **Not certified.** This file is a tooling/sample result or does not meet the n≥30 Brannock floor. Do not treat millimetre errors as launch truth."
    : "> Certified against product-definition gates on a real study export.",
  "",
  `| Metric | Value |`,
  `| ------ | ----- |`,
  `| Certified | ${certified ? "YES" : "NO"} |`,
  `| Thresholds pass (this file) | ${report.pass ? "YES" : "NO"} |`,
  `| Sample / synthetic source | ${sample ? "YES" : "NO"} |`,
  `| n | ${report.n ?? "—"} |`,
  `| Length median abs error (mm) | ${mm(length.median ?? report.lengthMedianAbsErrorMm)} |`,
  `| Length P95 (mm) | ${mm(length.p95 ?? report.lengthP95AbsErrorMm)} |`,
  `| Width median abs error (mm) | ${mm(width.median ?? report.widthMedianAbsErrorMm)} |`,
  `| Width P95 (mm) | ${mm(width.p95 ?? report.widthP95AbsErrorMm)} |`,
  "",
];

if (reasons.length) {
  lines.push("Certification blockers:");
  lines.push("");
  for (const r of reasons) lines.push(`- ${r}`);
  lines.push("");
}

lines.push(
  "Replace sample JSONL with real Brannock study exports before launch certification.",
);
lines.push(
  "See [ACCURACY_STUDY.md](../ACCURACY_STUDY.md) and [SUPPORTED_DEVICES.md](../SUPPORTED_DEVICES.md).",
);
lines.push("");

writeFileSync(outMd, lines.join("\n"), "utf8");
console.log(`published → ${relative(cwd, outMd).replace(/\\/g, "/")}`);
process.exit(0);
