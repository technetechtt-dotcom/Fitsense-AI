# 30-person Brannock study — operator run sheet

This is the **internal validation** protocol. Completing 30 participants requires a calibrated Brannock (or lab calipers), phones, and people. Software will not invent those millimetres.

## Before day 1

- [ ] Brannock serial + last calibration date recorded below
- [ ] ≥5 SA Android phones listed in [DEVICE_MATRIX.md](../DEVICE_MATRIX.md)
- [ ] Debug APK from CI `android-build` installed
- [ ] Consent script (POPIA) printed; participants can refuse
- [ ] Empty `docs/records/brannock-study-log.csv` (do not pre-fill mm)

**Brannock serial / calibration:** _fill on site_

## Per participant (both feet)

1. Consent. Assign `Pxx`.
2. Settings → Accuracy study GT — enter **this foot’s** Brannock length/width (mm).
3. Scan with A4 or card; confirm landmarks if gated.
4. Repeat the same foot three times (reject blur/coplanarity failures; do not average rejects).
5. Switch foot; update GT; repeat.
6. Export JSONL daily; never type guessed millimetres into GT.

## After ≥30 unique participants

```bash
npm run publish:accuracy -- path/to/real_export.jsonl
```

`Certified` in `docs/records/accuracy-report-latest.md` must be **YES**. Sample JSONL stays uncertified.

## Blockers that keep Certified = NO

- n < 30
- sample/synthetic filename
- any device cohort with n≥5 failing product-definition gates
