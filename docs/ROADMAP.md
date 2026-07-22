# FitSense product roadmap (Phases 2–12)

Phase 1 (critical security + green CI) is implemented in the codebase. This document tracks **later milestones only** — measurement science, product surfaces, compliance, and ops. Nothing here is a deploy gate for the current auth/handoff repair.

## Critical gates (done / maintain)

- Anonymous **device challenge-response** auth (server-issued `deviceId`, hashed secrets, short-lived access + rotating refresh).
- Secure phone↔web handoff (hashed publish/consume tokens, atomic one-time consume).
- Green CI: format, typecheck, lint, `test:web`, backend check, Android assemble+test.
- Branch protection for `main` — see [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md).

Account linking (email/passkey/WebAuthn) and a production pen-test remain **deferred**.

---

## Phase 2 — Measurement trust

- Keep phone mm measurements geometric (reference object / AR depth), never silent invent.
- Harden quality gates (blur, coplanarity, sanity) and manual refine UX.
- Dual-foot acceptance before recommendations.
- Expand accuracy logging without storing unnecessary PII.

## Phase 3 — Accuracy study (Brannock / known sizes)

- Formal study protocol against Brannock or known-foot set.
- Device matrix report (phone models, lighting, floor types).
- Publish internal acceptance thresholds for length/width error.

## Phase 4 — Mobile sync

- Android sync client using challenge-response + Keystore-backed credentials.
- Conflict resolution for local vs cloud Fit ID / scans.
- Offline queue with clear “not yet synced” states.

## Phase 5 — Recommendations

- Catalogue-backed fit scoring with confidence caps from measurement quality.
- Prefer dual-foot width/length; withhold size when confidence is too low.
- Explainability copy for shoppers (why this size).

## Phase 6 — Catalogue

- Merchant shoe feed contracts (SKU, last, regional size systems, stock).
- Admin tools for ingest validation and last metadata.

## Phase 7 — Merchant / clinic

- Partner embed hardening and SLA docs.
- Clinic/kiosk flows with operator roles (no silent demo mm).
- Session handoff + print/share of Fit ID under consent.

## Phase 8 — Regional sizing

- UK / US / EU / Mondopoint consistency checks.
- Region-specific last and width conventions.
- Locale-aware recommendation presentation.

## Phase 9 — POPIA / privacy

- Lawful basis, retention schedules, DPA templates.
- Data subject access/erasure end-to-end (web + API + Android).
- Privacy nutrition labels for store listings.

## Phase 10 — Platform security

- Passkey / verified email account linking.
- WebCrypto or IndexedDB hardening for web device secrets.
- External pen-test and remediation pass.
- Key rotation (`kid`) runbooks for `AUTH_SECRET` / `HANDOFF_SECRET`.

## Phase 11 — Operations

- Monitoring, alert routing, on-call rotation.
- Backup/restore drills for Postgres (Neon) and handoff stores.
- Incident response playbooks.

## Phase 12 — Release engineering

- Store signing, screenshots, review submissions.
- Staged rollouts and feature flags for measurement paths.
- Release checklist tied to accuracy gates (not marketing demos).

---

## Related docs

- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) — deploy blockers vs later phases
- [RENDER_NEON.md](./RENDER_NEON.md) — Render + Neon env
- [MEASUREMENT_PROTOCOL.md](./MEASUREMENT_PROTOCOL.md) — measurement rules
- [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md) — required CI checks
