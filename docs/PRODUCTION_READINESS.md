# Production Readiness

This repo now includes the production controls that can be implemented in code:

- Backend request IDs, structured access logs, security headers, rate limits, payload limits, and schema validation.
- Production startup guards for unsafe CORS, `SKIP_AUTH`, and in-memory handoff.
- Upstash Redis REST handoff storage for multi-instance deploys.
- Backend tests and CI for web, SDK, API, and container builds.
- Firebase Firestore/Storage rules for owner-scoped user data.
- Demo scan gating so production builds do not silently return simulated measurements.
- Pinned Node/npm runtimes, zero-audit dependency locks, strict TypeScript, ESLint, Prettier, and code ownership.
- Dual-foot reference/WebXR flow; recommendations are withheld until both feet are accepted.
- Individual cloud-scan deletion for Firestore and PostgreSQL sync stores.

## Required Environment

Web:

- `VITE_API_BASE_URL=https://api.your-domain.example`
- Firebase web config values from the production Firebase project.
- `VITE_ENABLE_DEMO_SCAN=false` or unset.
- Google sign-in enabled in Firebase Authentication for portable account linking.
- `VITE_PRIVACY_CONTROLLER_NAME`
- `VITE_PRIVACY_CONTACT_URL`

API:

- `NODE_ENV=production`
- `CORS_ORIGIN=https://app.your-domain.example,https://partner.example`
- `HANDOFF_STORE=upstash`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT_JSON`
- `SKIP_AUTH=false`

## Go-Live Blockers Outside Code

- Accuracy validation on a measured device matrix and a known-foot-size test set.
- Android CameraX/OpenCV calibration integration. Android currently refuses to create a result rather than store a simulated measurement.
- Physical-device validation of the four-point WebXR and iOS ARKit length/width workflows; both remain experimental.
- Legal controller details, privacy policy, retention periods, DPA/vendor review, and store terms.
- Production merchant catalogue/feed contracts with stock, regional size systems, and price/currency data.
- App Store / Play Store signing, privacy nutrition labels, screenshots, and review submissions.
- Monitoring targets, alert routing, backup/restore drills, and incident owner rotation.
- Android Gradle wrapper jar or a documented internal build image containing the expected Gradle version.

## Release Gate

Run before shipping:

```bash
npm ci
npm run check

cd backend
npm ci
npm run check
docker build -t fitsense-api:release .
```

For Firebase:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only hosting
```
