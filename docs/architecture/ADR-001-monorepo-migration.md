# ADR-001: Staged Monorepo Migration

- Status: accepted
- Date: 2026-07-21

## Context

The repository contains a React consumer app, a Node API, a standalone Android app, an incomplete iOS shell, and a partner SDK. Domain logic is duplicated between TypeScript and Kotlin, while the current root structure makes ownership and release boundaries unclear.

A one-step move to many deployable microservices would create operational cost before product-market and measurement accuracy are validated.

## Decision

Use an npm-workspaces monorepo, migrated incrementally. Keep a modular backend until load, team ownership, compliance, or deployment isolation justifies extracting a service.

Target structure:

```text
apps/
  consumer-web/
  consumer-mobile-android/
  consumer-mobile-ios/
  merchant-portal/
  admin-console/
  staff-scan/
  developer-portal/
packages/
  measurement-core/
  sizing-core/
  recommendation-core/
  fit-profile/
  partner-sdk/
  api-client/
  shared-types/
  design-system/
  analytics-contracts/
services/
  api/
```

Potential service boundaries (identity, fit profile, measurement, recommendation, catalogue, inventory, handoff, consent, analytics, notification, and audit) begin as modules inside `services/api`. They become separate deployables only with an ADR documenting the operational need.

## Migration order

1. Establish clean install/build/test/release gates in the current structure.
2. Extract shared TypeScript schemas and API contracts.
3. Extract sizing and recommendation cores with golden cross-platform fixtures.
4. Extract measurement-core geometry, quality gates, provenance, and test vectors.
5. Move the partner SDK and version it independently.
6. Move web/API directories without changing behavior.
7. Add new portals only when a committed product workflow requires them.
8. Evaluate Kotlin Multiplatform, generated schemas, or conformance fixtures for Android/iOS; do not duplicate rules silently.

## Boundaries

- Apps may depend on packages and API clients, not on another app.
- UI packages must not contain measurement or recommendation policy.
- Measurement core must not import retail catalogue or UI code.
- Recommendation core consumes accepted measurements; it cannot override scan validity.
- Shared types are versioned contracts, not a dumping ground for implementation helpers.
- Partner SDK uses public API contracts only.
- Database and provider SDKs remain inside service infrastructure adapters.

## Consequences

- The current repository remains deployable during migration.
- Shared core packages gain independent tests and ownership.
- Microservice complexity is deferred until justified.
- Native parity is enforced through shared schemas and golden fixtures even where code cannot be shared directly.
