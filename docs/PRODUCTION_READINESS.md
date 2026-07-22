# Production Readiness

Critical security and CI gates for this repo:

- Backend request IDs, structured access logs, security headers, rate limits, payload limits, and schema validation.
- Production startup guards for unsafe CORS, `SKIP_AUTH`, missing `AUTH_SECRET` / `HANDOFF_SECRET`, and in-memory handoff.
- Device challenge-response auth (server-issued devices, hashed refresh rotation, security event audit).
- Secure handoff (publish/consume Bearer tokens, hashed at rest, atomic one-time consume).
- Postgres sync store; Upstash or Postgres handoff for multi-instance deploys.
- Backend tests and CI for web, SDK, API, and Android (`assembleDebug` + unit tests).
- Demo scan gating so production builds do not silently return simulated measurements.
- Pinned Node/npm runtimes, dependency locks, strict TypeScript, ESLint, Prettier, and code ownership.
- Dual-foot reference/WebXR flow; recommendations are withheld until both feet are accepted.

Phases 2–12 (measurement study, merchant, POPIA, ops, store release) are tracked in [ROADMAP.md](./ROADMAP.md) and are **not** coded as part of the critical security pass.

## Required Environment

Web:

- `VITE_API_BASE_URL=https://api.your-domain.example`
- `VITE_ENABLE_DEMO_SCAN=false` or unset
- `VITE_PRIVACY_CONTROLLER_NAME`
- `VITE_PRIVACY_CONTACT_URL`

API:

- `NODE_ENV=production`
- `CORS_ORIGIN=https://app.your-domain.example,https://partner.example`
- `DATABASE_URL` (Neon/Postgres)
- `AUTH_SECRET` (long random; access/device sessions)
- `HANDOFF_SECRET` (long random; distinct from `AUTH_SECRET`)
- `HANDOFF_STORE=postgres` or `upstash` (+ Upstash REST credentials when used)
- `SKIP_AUTH=false`

See [RENDER_NEON.md](./RENDER_NEON.md) and [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md).

## Go-Live Blockers Outside Code

- Accuracy validation on a measured device matrix and a known-foot-size test set (Phase 3).
- Physical-device validation of WebXR / ARKit / ARCore length/width workflows.
- Legal controller details, privacy policy, retention periods, DPA/vendor review (Phase 9).
- Production merchant catalogue/feed contracts (Phases 6–7).
- App Store / Play Store signing and review submissions (Phase 12).
- Monitoring, alert routing, backup/restore drills (Phase 11).
- External pen-test and account-linking (email/passkey) (Phase 10).

## Release Gate

Run before shipping:

```bash
npm ci
npm run format:check
npm run typecheck
npm run lint
npm run test:web
npm run build:all

npm run check --prefix backend
```

Android (CI or local JDK 17):

```bash
cd android && ./gradlew assembleDebug test
```
