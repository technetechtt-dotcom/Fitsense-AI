# Photographic regression fixtures

Place real captures under this folder for instrumented OpenCV regression:

```
fixtures/
  a4/
    well_lit_01.jpg
    well_lit_01.json   # { "corners": [[x,y]×4], "lengthMm": …, "calibration": "a4_paper" }
  card/
    …
```

CI unit tests use **programmatic** bitmaps so the suite stays binary-free.
Instrumented tests may load assets from `androidTest/assets/fixtures/` when
present (optional; skipped if missing).

Never commit personally identifiable foot photos without study consent.
