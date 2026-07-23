# Android physical device verification

CI builds a **debug APK** and uploads it as the `app-debug-apk` artifact (plus
`android-unit-test-reports`). JVM unit tests do **not** replace device checks.

## Install from CI

1. Open the green `android-build` job → **Artifacts** → download `app-debug-apk`.
2. Enable install from unknown sources / use `adb install -r app-debug.apk`.
3. Confirm package id `com.fitsense.ai.debug`.

## Checklist (record pass/fail)

| Check                                                            | Pass? | Notes |
| ---------------------------------------------------------------- | ----- | ----- |
| Cold start → splash → home                                       |       |       |
| Camera permission granted                                        |       |       |
| Reference (A4/card) detect + mm readout looks plausible          |       |       |
| Blur / coplanarity quality gate surfaces when expected           |       |       |
| Manual landmark refine works when auto-detect is uncertain       |       |       |
| Dual-foot path before recommendations (if enabled)               |       |       |
| No unlabeled demo / simulated millimetres in release-like builds |       |       |
| ARCore path on ARCore-capable hardware (optional)                |       |       |
| Handoff / sync against staging API (optional)                    |       |       |

## Accuracy note

Phone millimetre results must come from geometric measurement (reference
homography or AR depth). Never treat invented sizes as sizing truth.

Fill the cohort table in [DEVICE_MATRIX.md](./DEVICE_MATRIX.md) and run
[ACCURACY_STUDY.md](./ACCURACY_STUDY.md) analysis after physical sessions.

Copy this table into the PR or a pilot runbook when signing off a build.
