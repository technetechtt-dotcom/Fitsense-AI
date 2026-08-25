# Brannock study — Kimberley field kit (issue #11)

Software cannot complete this issue. Physical work only. Do **not** invent millimetres.

## Status (repo)

| Gate             | Value                 |
| ---------------- | --------------------- |
| Certified        | **NO**                |
| Synthetic/sample | **YES**               |
| n                | 3 (sample JSONL only) |

Commercial accuracy claims are **blocked** until Certified = YES.

## Obtain before recruitment

- [ ] Calibrated Brannock (or lab calipers with traceable calibration)
- [ ] Record serial, calibration date, operator initials in `docs/records/brannock-calibration.md`
- [ ] ≥5 affordable Android phones common in SA (list in `docs/DEVICE_MATRIX.md`)
- [ ] Debug APK from CI `android-build`
- [ ] POPIA consent script; refusal allowed

## Protocol

Follow [BRANNOCK_STUDY_30.md](./BRANNOCK_STUDY_30.md). Log rows only in `docs/records/brannock-study-log.csv` after real measures.

## Publish

```bash
npm run publish:accuracy -- path/to/real_export.jsonl
```

Certify only device cohorts that pass product-definition gates with n≥5 and overall n≥30.
