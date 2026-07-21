# FitSense Product Definition

Status: working launch contract. Commercial owners must approve pricing and pilot partners before launch.

## Product truth

FitSense is retail footwear-fit technology. It measures foot geometry, creates a portable Fit ID, and uses product-specific sizing data to recommend footwear sizes.

FitSense is **not** a medical device and does not diagnose, prevent, monitor, predict, treat, or alleviate disease or injury. It must not be marketed for diagnosis, orthotics, prosthetics, gait assessment, diabetic-foot screening, or clinical decision-making.

Fit recommendations reduce sizing uncertainty; they do not guarantee comfort, injury prevention, stock availability, or a perfect fit.

## Launch focus

- Primary market: South Africa.
- Primary paying customer: footwear retailers using FitSense in a B2B2C model.
- Primary user: shopper, assisted by trained retail or school staff where required.
- First segment: school footwear.
- Secondary segment: safety footwear, only after its own product and device validation.
- Initial channels: staffed retail fitting, school fitting days, and participating ecommerce journeys.

This focus is a working default because no alternate commercial decision has been approved.

## Supported launch use cases

- Staff-assisted measurement of both bare feet on a compatible smartphone.
- A4 or ISO/IEC 7810 ID-1 bank-card reference measurement on a hard, flat floor.
- Size recommendations for participating school-shoe catalogues with verified last and size data.
- Saving measurement provenance and confidence in a Fit ID.
- Reusing a Fit ID with participating retailers and compatible product catalogues.
- Manual correction of automatically detected reference corners and foot landmarks.
- Retaking a scan when quality gates fail.

## Unsupported use cases

- Medical diagnosis, treatment, orthotic prescription, gait or pressure analysis.
- Measuring a foot inside a shoe.
- Thick, patterned, loose, compression, or padded socks.
- Seated or non-weight-bearing scans in the validated launch workflow.
- Selfie-camera, video-call, screenshot, pre-recorded, or edited-image measurement.
- Carpets, uneven floors, bent paper, folded references, or non-ID-1 cards.
- Unassisted scans where the user cannot keep both feet and reference coplanar.
- Universal fit guarantees or recommendations for products without verified sizing data.
- WebXR, ARCore, ARKit, instep, girth, arch, or volume outputs until each path has passed the release validation matrix.

## “Scan once, use anywhere” Fit ID

The promise means: one validated scan creates a consent-controlled Fit ID that can be reused across participating FitSense retailers and compatible product catalogues.

It does **not** mean universal compatibility with every shoe, brand, retailer, or country. Every recommendation remains product-specific and includes its own confidence.

The Fit ID stores:

- left and right measurements independently;
- scan method, device and capture conditions where available;
- per-dimension measurement confidence;
- validation/version metadata;
- user-approved fit preferences and feedback.

## Value proposition

- Consumers: fewer size guesses, repeatable measurements, easier comparison across participating brands, and control over reusable fit data.
- Retailers: higher fitting throughput, fewer avoidable size returns, stronger assisted selling, and consented fit insight.
- Manufacturers: structured, privacy-safe aggregate fit signals to improve lasts and size runs.
- Schools and employers: more consistent staff-assisted fitting and auditable allocation workflows.
- Ecommerce marketplaces: a standard Fit ID and recommendation API across compatible catalogues.

## Confidence definitions

**Measurement confidence** describes how trustworthy the measured geometry is. It is derived from image quality, reference detection, perspective/coplanarity, landmark quality, scale density, completeness, and anatomical sanity.

**Recommendation confidence** describes how trustworthy a size/product recommendation is. It combines accepted measurement confidence with catalogue quality, product-last data, regional size mapping, model evidence, and user fit preferences.

A high measurement confidence cannot compensate for weak product data. A high recommendation score must never make an unreliable scan look valid.

## Experimental and demonstration features

- Experimental features must carry an “Experimental” label, supported-device list, confidence threshold, and fallback.
- Simulated measurements are development-only and must show an unmistakable “DEMO — NOT A MEASUREMENT” watermark.
- Production builds must fail when simulation is enabled.
- Simulated results must never be saved to a production Fit ID, synced, handed to a partner, or used for a retail recommendation.

## Commercial hypothesis

Initial pricing to validate, not a published offer:

- paid 8–12 week retailer/school pilot;
- setup and training fee;
- monthly per-site SaaS fee;
- usage fee per accepted scan or recommendation API call;
- enterprise pricing for manufacturer or marketplace data integrations.

Pricing should be tested in ZAR. Do not publish exact prices until a pilot partner and cost-to-serve model are approved.

## Pilot success criteria

Targets below are acceptance thresholds to validate, not current accuracy claims:

- at least 85% assisted-scan completion without operator intervention beyond the defined workflow;
- at least 80% first-attempt scan acceptance, with failure causes recorded;
- median absolute heel-to-toe error no greater than 2 mm and 95th percentile no greater than 5 mm against a controlled benchmark;
- median ball-width error no greater than 3 mm and 95th percentile no greater than 6 mm;
- no production path can persist or publish simulated measurements;
- at least 90% of users understand that FitSense is sizing technology, not medical advice;
- measurable reduction in size-related exchanges/returns against the pilot baseline;
- no unresolved critical privacy, security, or data-loss defects.

## Commercial-launch acceptance

- Accuracy thresholds pass on the approved South African device and participant matrix.
- School-footwear catalogue data, stock mapping, and merchant links are production-owned.
- Both feet are measured and the larger foot drives base sizing.
- Every saved measurement has provenance, quality-gate results, and algorithm version.
- Unsupported and unreliable scans are rejected rather than converted into a size.
- Authentication, consent, deletion, retention, audit, incident response, monitoring, backup, and restore controls have named owners.
- Retail, school, and partner copy has legal approval and contains no medical, guaranteed-fit, or unvalidated accuracy claims.
