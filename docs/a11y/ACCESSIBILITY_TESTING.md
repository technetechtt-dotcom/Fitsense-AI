# Accessibility testing with real users

FitSense must be usable by shoppers and staff with diverse abilities. Automated lint is not enough.

## Scope (initial)

- Web Scan, Results, Settings, Merchant portal
- Afrikaans + English packs for critical CTAs
- Focus order, contrast, screen reader labels on scan CTAs and recommendations

## Participant protocol

1. Recruit ≥ 5 participants including at least one screen-reader user and one motor-impairment / switch user where possible.
2. Tasks: grant camera permission, complete or abandon scan with guidance, read size recommendation + confidence, export/delete account path, merchant inventory update (staff).
3. Capture: success/fail, time, verbatim friction, WCAG issues (A/AA).
4. File findings under `docs/records/a11y-YYYY-MM.md` with severity and owners.

## In-product hooks

- Locale packs: `src/lib/i18n/locale.ts`
- Unsupported-device copy on Scan AR-unsupported phase
- Recommendation confidence band shown to users (not hidden)

## Definition of done for a release

- [ ] Session notes uploaded
- [ ] Blockers fixed or waived with product sign-off
- [ ] Contrast check on primary CTA and confidence text
