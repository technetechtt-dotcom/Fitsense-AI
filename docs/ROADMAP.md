# FitSense product roadmap

## Critical deploy gates (must stay green)

- Separate production secrets: `AUTH_SECRET` **and** distinct `HANDOFF_SECRET` (no fallback).
- Render + CI: `npm ci --include=dev` then build; backend CI provisions Postgres; device-auth tests **must not skip**.
- Required CI checks: `web-and-sdk`, `backend`, `render-api-build`, `android-build`.
- Branch protection on `main` **before** re-enabling Render `autoDeployTrigger: commit`.
- Staging smoke: health + auth + sync + handoff (`npm run staging:smoke --prefix backend`).

See [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md), [RENDER_NEON.md](./RENDER_NEON.md), [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md).

---

## After deployment is stable (ordered)

1. **Android authentication and synchronization** — challenge-response client using Keystore-backed `SecureDeviceCredentialStore`; sync Fit ID / scans with conflict handling.
2. **Harden measurement landmark and reference detection** — blur/coplanarity gates, manual refine, dual-foot acceptance; never invent millimetres.
3. **Ground-truth accuracy study workflow** — Brannock / known-foot protocol, device matrix, acceptance thresholds (Phase 3).
4. **Physical Android device testing** — CameraX + reference/ARCore on real hardware; refuse simulated results in production.
5. **Passkey-backed Portable Fit Identity** — WebAuthn/passkey account linking on top of device sessions (Phase 10).
6. **Catalogue and merchant-platform development** — feeds, last metadata, partner embed SLA (Phases 6–7).
7. **Controlled Kimberley / Northern Cape pilot** — clinic/kiosk consent flows, regional sizing, POPIA-aligned retention, ops runbooks.

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
