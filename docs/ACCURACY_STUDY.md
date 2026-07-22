# Physical accuracy study

Protocol companion to [MEASUREMENT_PROTOCOL.md](./MEASUREMENT_PROTOCOL.md).

## Collection (Android)

1. In **Settings → Accuracy study ground truth**, set known Brannock / caliper mm.
2. Scan with A4 or bank-card reference; confirm fallback landmarks when prompted.
3. Accept measurement — rows append to on-device `accuracy_dataset.jsonl`
   (`AccuracyDatasetStore`) including ground-truth fields when set.
4. Export the file from device storage / `adb pull` after the session.

## Analysis

```bash
node scripts/analyze-accuracy-dataset.mjs path/to/accuracy_dataset.jsonl
```

Default pass gates (length): median ≤ 2 mm, P95 ≤ 4 mm.

## Device matrix

Record model, OS, camera, lighting, and calibration type for each cohort.
Use [ANDROID_DEVICE_VERIFY.md](./ANDROID_DEVICE_VERIFY.md) for install checks.
