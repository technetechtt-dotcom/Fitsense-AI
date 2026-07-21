# Validated Phone Measurement Protocol

Status: launch protocol to validate on the device and participant test matrix. It is not evidence that the targets have already been met.

## Valid launch scan

A valid scan must:

1. Measure one identified foot at a time and complete both left and right feet.
2. Use the rear camera of a supported phone.
3. Use a genuine, flat A4 sheet (210 × 297 mm) or unwarped ISO ID-1 bank card (85.60 × 53.98 mm).
4. Keep the complete reference and complete foot visible, unobstructed, and on the same hard, flat plane.
5. Capture the user standing naturally with weight distributed across both feet.
6. Capture a bare foot. Thin socks remain unsupported until a dedicated validation study establishes correction rules.
7. Pass image, reference, perspective, scale, completeness, segmentation, and anatomical quality gates.
8. Measure heel, longest toe, and both ball-width landmarks, with manual correction available.
9. Store method, reference type, foot side, quality results, confidence, device metadata, and algorithm version.
10. Use the larger accepted foot as the base for footwear sizing while preserving asymmetry.

## Unreliable scan

Reject and provide a specific retake instruction when any of these apply:

- motion blur, focus failure, severe shadow, underexposure, or overexposure;
- reference partly hidden, bent, folded, wrong type, implausible geometry, or too small in frame;
- steep camera angle or evidence that reference and foot are not coplanar;
- toes or heel clipped, another foot/object overlaps, or footwear is detected;
- reference scale is degenerate or outside plausible limits;
- landmark or segmentation confidence is below threshold;
- dimensions are anatomically implausible;
- camera/AR tracking is lost or real-world scale is unstable;
- left/right identity is unknown;
- required width landmarks are absent;
- algorithm or device is not approved for the chosen measurement mode.

An unreliable scan must not generate, save, sync, or publish a retail size recommendation.

## Capture conditions

- User posture: standing, weight-bearing, feet naturally aligned; no leaning onto the measured foot.
- Operator: assisted capture is the validated launch workflow.
- Footwear: none.
- Socks: bare foot required for launch validation.
- Floor: hard, level, matte, non-reflective, and visually distinct from foot and reference.
- Lighting: bright, diffuse, even light; no flash glare, hard cast shadows, or backlighting.
- Camera: rear camera held as close to perpendicular above the foot as practical.
- Frame: entire foot and reference visible with margin; no digital zoom.

## Minimum target device support

These are target minimums and require physical validation before publication:

- rear camera with autofocus and at least 8 MP still capture;
- at least 1280 × 720 camera stream;
- 64-bit device, 4 GB RAM, WebGL2, and hardware acceleration;
- Android 10+ with current Chrome for reference measurement;
- iOS 16+ with current Safari for reference measurement;
- secure HTTPS context and camera permission;
- WebXR only on devices explicitly listed in the compatibility matrix;
- native ARCore/ARKit only on devices explicitly validated for that path.

Unsupported browsers include embedded social browsers, outdated WebViews, desktop-only capture, and browsers that cannot provide a stable rear-camera stream.

## Quality-gate contract

Each gate returns `pass`, `fail`, or `unavailable`, a machine-readable reason, and user-facing retake guidance.

- Image: focus/sharpness, luminance, highlight/shadow clipping, motion, resolution.
- Reference: type, dimensions, corner completeness, convexity, aspect, flatness indicators, frame coverage.
- Geometry: perspective, coplanarity indicators, homography conditioning, pixels per millimetre.
- Foot: complete visibility, footwear/occlusion, heel/toe/ball landmarks, segmentation consistency.
- Anatomy: plausible length, width, width/length ratio, and left/right asymmetry.
- Device/method: approved implementation, tracking stability, algorithm version.

Any mandatory `fail` rejects the scan. Mandatory `unavailable` rejects production measurement unless the protocol explicitly allows manual correction.

## Confidence

Per-dimension measurement confidence must be stored separately for:

- heel-to-toe length;
- ball width;
- any future heel width, arch length, instep, girth, or volume dimension.

An overall confidence may summarize those values but must not hide a low-confidence dimension. Estimated dimensions must be labeled `estimated` and are not equivalent to measured dimensions.

Recommendation confidence is calculated only after measurement acceptance and must include product-data quality. It is never a substitute for measurement confidence.

## Release validation

Validate against calibrated physical measurements across:

- the approved phone/browser/OS matrix;
- age, sex, skin-tone, foot-size, width, toe-shape, and mobility diversity appropriate to the launch segment;
- common South African lighting and floor conditions;
- multiple trained operators and repeat scans;
- school-footwear users first, safety-footwear users in a separate study.

Report bias, median absolute error, 95th-percentile error, repeatability, rejection rate, completion rate, and failures by device and participant cohort. Do not publish an accuracy claim until the study and claim wording are approved.
