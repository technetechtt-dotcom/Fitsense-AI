# Physical accuracy study

Protocol companion to [MEASUREMENT_PROTOCOL.md](./MEASUREMENT_PROTOCOL.md) and
[DEVICE_MATRIX.md](./DEVICE_MATRIX.md).

## Collection (Android)

1. In **Settings → Accuracy study ground truth**, enter known Brannock / caliper
   length and width (mm). Add session notes (lighting / operator).
2. Scan with A4 or bank-card reference; confirm fallback landmarks when prompted.
3. Accept measurement — rows append to on-device `accuracy_dataset.jsonl`
   (`AccuracyDatasetStore`) including device OS/manufacturer and ground truth.
4. **Export accuracy JSONL** from Settings (share sheet), or:
   `adb pull /data/data/com.fitsense.ai.debug/files/accuracy_dataset.jsonl`

Do not use invented millimetres. Clear GT when switching participants or feet
if left/right ground truth differs.

## Analysis

```bash
# Product-definition gates (default): length med≤2 / P95≤5; width med≤3 / P95≤6
node scripts/analyze-accuracy-dataset.mjs path/to/accuracy_dataset.jsonl --out docs/records/accuracy-report-latest.json

# Stricter study gates: length med≤2 / P95≤4; width med≤2.5 / P95≤5
node scripts/analyze-accuracy-dataset.mjs path/to/accuracy_dataset.jsonl --strict
```

The script prints overall stats and per-device cohorts (`deviceModel | OS | calibration`).

## Thresholds

| Gate                         | Product definition (default) | Strict study (`--strict`) |
| ---------------------------- | ---------------------------- | ------------------------- |
| Length median absolute error | ≤ 2 mm                       | ≤ 2 mm                    |
| Length P95                   | ≤ 5 mm                       | ≤ 4 mm                    |
| Width median                 | ≤ 3 mm                       | ≤ 2.5 mm                  |
| Width P95                    | ≤ 6 mm                       | ≤ 5 mm                    |

Source of truth for launch acceptance: [PRODUCT_DEFINITION.md](./PRODUCT_DEFINITION.md).

## Device matrix

Fill [DEVICE_MATRIX.md](./DEVICE_MATRIX.md) during physical sessions. Use
[ANDROID_DEVICE_VERIFY.md](./ANDROID_DEVICE_VERIFY.md) for install smoke checks.
