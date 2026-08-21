# Physical accuracy study

Protocol companion to [MEASUREMENT_PROTOCOL.md](./MEASUREMENT_PROTOCOL.md) and
[DEVICE_MATRIX.md](./DEVICE_MATRIX.md).

## Recruitment (Phase 2)

| Stage               | Target                                 | Notes                                                         |
| ------------------- | -------------------------------------- | ------------------------------------------------------------- |
| Internal validation | ≥ 30 participants                      | Staff / friends / family; both feet; Brannock GT              |
| Expansion           | 100–300 participants                   | Kimberley + NC catchment; age/sex mix                         |
| Publish             | Accuracy, repeatability, failure rates | `npm run publish:accuracy -- path/to.jsonl` → `docs/records/` |

### Brannock / calibrated tool

1. Obtain a calibrated Brannock device (or laboratory calipers with documented calibration).
2. Record serial / calibration date in study notes.
3. Measure each foot once after the last capture of that session — never invent mm.

### Phone cohort (≥5 SA Android phones)

Seed rows in [DEVICE_MATRIX.md](./DEVICE_MATRIX.md) (Samsung, Xiaomi/Redmi, Pixel, Huawei/Nokia). Promote to [SUPPORTED_DEVICES.md](./SUPPORTED_DEVICES.md) only when certify gates pass.

## Collection (Android)

1. In **Settings → Accuracy study ground truth**, enter known Brannock / caliper
   length and width (mm). Add session notes (lighting / operator).
2. Scan with A4 or bank-card reference; confirm fallback landmarks when prompted.
3. Accept measurement — rows append to on-device `accuracy_dataset.jsonl`
   (`AccuracyDatasetStore`) including device OS/manufacturer and ground truth.
4. **Export accuracy JSONL** from Settings (share sheet), or:
   `adb pull /data/data/com.fitsense.ai.debug/files/accuracy_dataset.jsonl`

### Collection (Web)

Settings → **Accuracy study (Brannock GT)** — save GT, scan, export JSONL. Same analysis pipeline.

Do not use invented millimetres. Clear GT when switching participants or feet
if left/right ground truth differs.

## Analysis

```bash
# Product-definition gates (default): length med≤2 / P95≤5; width med≤3 / P95≤6
npm run analyze:accuracy -- path/to/accuracy_dataset.jsonl --out docs/records/accuracy-report-latest.json

# Publish markdown + JSON into docs/records/
npm run publish:accuracy -- path/to/accuracy_dataset.jsonl

# Stricter study gates: length med≤2 / P95≤4; width med≤2.5 / P95≤5
npm run analyze:accuracy -- path/to/accuracy_dataset.jsonl --strict
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
Certify into [SUPPORTED_DEVICES.md](./SUPPORTED_DEVICES.md) for limited launch.
