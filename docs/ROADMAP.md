# FitSense product roadmap

## Priority 0 — Deployed platform (release gates)

| Gate                                             | Status                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| Separate staging + production Blueprint services | In repo (`render.yaml`); sync on Render + distinct Neon             |
| Distinct `AUTH_SECRET` + `HANDOFF_SECRET`        | Required in prod/staging (no shared fallback)                       |
| Auto production deploy                           | **Off** until gates green                                           |
| Four CI jobs on every `main` push                | `web-and-sdk`, `backend`, `render-api-build`, `android-build`       |
| APK + unit-test report artifacts                 | Uploaded from `android-build`                                       |
| Staging smoke + record artifact                  | `staging-smoke` when `STAGING_API_BASE_URL` set                     |
| Direct push to `main`                            | Current policy — see [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md) |

See [RENDER_NEON.md](./RENDER_NEON.md), [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md),
[docs/records/](./records/).

---

## After Priority 0 (ordered)

1. **Backend testing (P1)** — Postgres handoff/sync, concurrency, auth revocation, migrations tests.
2. **Versioned DB migrations (P2)** — framework; remove runtime DDL from request paths.
3. **Android cloud integration (P3)** — complete auth/sync/offline queue/conflict UX.
4. **Harden measurement (P4)** — quality gates, reference, landmarks; never invent mm.
5. **Physical device matrix (P5)** + **accuracy study (P6)** — Brannock ground truth.
6. **Portable Fit Identity (P7)** — passkeys, multi-device, merchant consent.
7. **Recommendations + catalogue + merchant (P8–11)** — real footwear data and outcomes.
8. **Web UX, SA readiness, POPIA, security, ops (P12–16)** — then Kimberley pilot (P18).

### Landed in code (partial — continue hardening)

- Android `DeviceAuthClient` + `SyncClient` + Settings cloud sync / erase
- Android durable sync outbox with exponential backoff, pull/merge, export, server logout
- Recoverable Fit Identity via `/v1/fit-identity/recovery-codes` (one-time codes)
- Merchant Fit ID share grants (`FSMS1.`) under consent + org API key redeem (`docs/FIT_IDENTITY.md`)
- Android Settings portable Fit Identity (FSP1 export/import, recovery, share)
- Explicit fallback landmark confirmation (web + Android)
- Reference aspect scoring + photographic fixture metadata
- Contour↔manual landmark disagreement gate (retake when delta too large)
- Explainable confidence factor notes on Android markup
- Withhold retail size when measurement confidence is below floor (web + Android)
- Reference detector: OpenCV Mat release, convexity, corner-angle, multi-quad ambiguity reject
- Image quality: blur/exposure/glare + border-clipping proxy (web + Android)
- Android markup undo / reset to auto-detect seeds
- Accuracy study JSONL + `scripts/analyze-accuracy-dataset.mjs` (cohort + product/strict gates)
- Device matrix template (`docs/DEVICE_MATRIX.md`) + Settings GT entry / JSONL export
- Enriched accuracy rows: manufacturer, OS, SDK, app/algorithm version
- Telemetry endpoint + Timber/web monitoring hooks
- Backup/restore drill test + POPIA retention job + Privacy copy
- Pen-test scope + key rotation docs
- Merchant orgs/roles, catalogue+inventory ingest, brand/model fit, outcomes, pilot metrics
- Regional locales (en-ZA / af / xh / zu) + UK sizing; offline sync outbox; low-data mode
- Kimberley / Northern Cape pilot runbook (`docs/ops/PILOT_KIMBERLEY.md`)
- CI Postgres handoff/sync/schema tests; staging Blueprint; smoke record path

**P4 still open:** live quality HUD before shutter, socks/footwear detector, true coplanarity / fold detection, magnified landmark loupe, floor suitability ML.

**P5/P6 still open:** fill device matrix with real phones; complete Brannock participant study; per-foot GT; web/iOS study path.

**P7 still open:** WebAuthn passkeys / durable account linking (no stubs).

---

## Phases 2–12 (detail)

### Phase 2 — Measurement trust

- Geometric phone mm (reference / AR depth); quality gates; dual-foot before recommendations.

### Phase 3 — Accuracy study

- Formal Brannock/known-size study; thresholds for length/width error.

### Phase 4 — Mobile sync

- Android sync client; offline queue; clear not-yet-synced states.

### Phase 5 — Recommendations

- Catalogue-backed scoring; withhold size when confidence is too low.

### Phase 6 — Catalogue

- Merchant shoe feed contracts; ingest validation.

### Phase 7 — Merchant / clinic

- Partner embed; operator roles; Fit ID share under consent.

### Phase 8 — Regional sizing

- UK / US / EU / Mondopoint consistency; locale presentation.

### Phase 9 — POPIA / privacy

- Lawful basis, retention, access/erasure, store nutrition labels.

### Phase 10 — Platform security

- Passkeys; WebCrypto hardening; pen-test; key rotation runbooks.

### Phase 11 — Operations

- Monitoring, backups, incident playbooks.

### Phase 12 — Release engineering

- Store listings, staged rollouts, accuracy-tied release checklist.
