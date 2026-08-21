# Supported / certified devices (Phase 4 launch gate)

Machine-readable list: [supported-devices.json](./supported-devices.json).

## Status meanings

| Status      | Meaning                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| `candidate` | Targeted for SA launch; **not yet** Brannock-certified                  |
| `certified` | Passed verify checklist + accuracy gates on that cohort                 |
| `blocked`   | Known fail (camera/AR/quality) — do not recommend retail sizes silently |

## Operator workflow

1. Fill [DEVICE_MATRIX.md](./DEVICE_MATRIX.md) during physical sessions (≥5 SA phones).
2. Run `npm run analyze:accuracy -- path/to/export.jsonl --out docs/records/accuracy-report-latest.json`.
3. Promote a device from `candidate` → `certified` in `supported-devices.json` only when matrix **Pass** and report `pass: true`.
4. Ship with a **limited** certified list; expand Northern Cape → national after Kimberley pilot.

Web/Android read this list to warn on uncertified models without inventing millimetres.
