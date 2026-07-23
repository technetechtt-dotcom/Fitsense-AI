# Physical device matrix (Priority 5)

Compatibility + accuracy cohort roster for FitSense phone millimetre measurement.

Companion docs:

- [ANDROID_DEVICE_VERIFY.md](./ANDROID_DEVICE_VERIFY.md) — per-build install smoke
- [ACCURACY_STUDY.md](./ACCURACY_STUDY.md) — Brannock / known-foot collection
- [MEASUREMENT_PROTOCOL.md](./MEASUREMENT_PROTOCOL.md) — capture rules

## Minimum device targets

| Requirement        | Target                                       |
| ------------------ | -------------------------------------------- |
| Android OS         | 10+ (API 29+); prefer 12+ for CameraX        |
| Camera             | Rear autofocus; ≥ 8 MP usable stills         |
| RAM                | ≥ 3 GB                                       |
| Lighting scenarios | Bright indoor, mixed, dim (gated by quality) |
| Calibration        | A4 paper and ID-1 bank card                  |

## Cohort log (fill during physical sessions)

Copy a row per phone × OS × lighting × calibration. Mark **Pass** only when
[ANDROID_DEVICE_VERIFY.md](./ANDROID_DEVICE_VERIFY.md) checks succeed **and**
accuracy rows for that cohort meet product gates (see analysis script).

| Date | Manufacturer   | Model | Android | Camera notes | Lighting | Calibration | Verify | Accuracy n | Length med/P95 | Width med/P95 | Pass | Operator | Notes             |
| ---- | -------------- | ----- | ------- | ------------ | -------- | ----------- | ------ | ---------- | -------------- | ------------- | ---- | -------- | ----------------- |
|      | Samsung        |       |         |              | bright   | A4          |        |            |                |               |      |          | Seed SA mid-range |
|      | Samsung        |       |         |              | bright   | card        |        |            |                |               |      |          |                   |
|      | Xiaomi / Redmi |       |         |              | bright   | A4          |        |            |                |               |      |          | Budget cohort     |
|      | Google / Pixel |       |         |              | bright   | A4          |        |            |                |               |      |          |                   |
|      | Huawei / other |       |         |              | mixed    | A4          |        |            |                |               |      |          | Optional          |

## How device fields are captured

On each accepted Android measurement, `AccuracyDatasetStore` records:

- `deviceModel`, `manufacturer`, `osVersion`, `sdkInt`
- `appVersion`, `algorithmVersion`
- `calibration`, measured mm, confidence
- ground-truth mm + session notes from Settings

Export from **Settings → Export accuracy JSONL**, then:

```bash
node scripts/analyze-accuracy-dataset.mjs path/to/accuracy_dataset_export.jsonl --out docs/records/accuracy-report-latest.json
```

Use `--strict` for the tighter study gates in [ACCURACY_STUDY.md](./ACCURACY_STUDY.md).

## Sign-off

A matrix cohort is **approved** when:

1. Verify checklist is pass for that build/APK.
2. Overall (and cohort) analysis `pass: true` under product-definition thresholds.
3. No unlabeled demo / simulated millimetres on that path.
