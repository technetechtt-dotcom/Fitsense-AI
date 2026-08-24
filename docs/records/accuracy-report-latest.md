# Accuracy report (latest)

Generated: 2026-08-24T10:33:34.097Z
Source: `docs/records/accuracy-sample.jsonl`

> **Not certified.** This file is a tooling/sample result or does not meet the n≥30 Brannock floor. Do not treat millimetre errors as launch truth.

| Metric                       | Value |
| ---------------------------- | ----- |
| Certified                    | NO    |
| Thresholds pass (this file)  | YES   |
| Sample / synthetic source    | YES   |
| n                            | 3     |
| Length median abs error (mm) | 1.5   |
| Length P95 (mm)              | 2.67  |
| Width median abs error (mm)  | 0.9   |
| Width P95 (mm)               | 1.17  |

Certification blockers:

- source is a sample/synthetic dataset, not a Brannock study export
- n=3 is below the internal-validation floor (30)

Replace sample JSONL with real Brannock study exports before launch certification.
See [ACCURACY_STUDY.md](../ACCURACY_STUDY.md) and [SUPPORTED_DEVICES.md](../SUPPORTED_DEVICES.md).
