import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fitEventSchema,
  fitProfileSchema,
  handoffPayloadSchema,
  scanSchema,
  sessionIdSchema,
} from "../src/validation/schemas.js";

test("handoff payload schema accepts the embed wire format", () => {
  const parsed = handoffPayloadSchema.parse({
    v: 1,
    completedAtEpochMs: 1_735_000_000_000,
    size: {
      uk: "8",
      us: "9",
      eu: "42",
      mondopointMm: 265,
      fitScore: 0.88,
      preferred: "uk",
    },
    scan: {
      scanId: "scan-abc",
      lengthMm: 260,
      widthMm: 98,
      widthToLengthRatio: 0.377,
      capturedAtEpochMs: 1_735_000_000_000,
    },
  });
  assert.equal(parsed.size.preferred, "uk");
});

test("handoff payload schema rejects unknown top-level fields", () => {
  assert.throws(() =>
    handoffPayloadSchema.parse({
      v: 1,
      completedAtEpochMs: 1,
      size: { uk: "8", us: "9", eu: "42", mondopointMm: 265 },
      scan: {
        scanId: "scan-abc",
        lengthMm: 260,
        widthMm: 98,
        capturedAtEpochMs: 1,
      },
      unexpected: true,
    }),
  );
});

test("sync schemas accept persisted profile, event, and scan shapes", () => {
  assert.ok(sessionIdSchema.parse("ABCDEFGHIJKLMNOPQRSTUV"));
  assert.equal(
    fitProfileSchema.parse({
      fitId: "fit-1",
      userId: "user-1",
      version: 1,
      createdAtEpochMs: 1,
      updatedAtEpochMs: 2,
      widthClass: "regular",
      archHeight: "unknown",
      toeShape: "unknown",
      comfortFit: "standard",
      preferredMidsoleFeel: "unknown",
      favouriteBrands: ["Nike"],
      insights: { computedAtEpochMs: 2 },
    }).favouriteBrands[0],
    "Nike",
  );
  assert.equal(
    fitEventSchema.parse({
      eventId: "evt-1",
      fitId: "fit-1",
      epochMs: 2,
      kind: "scan",
      scanId: "scan-1",
    }).kind,
    "scan",
  );
  assert.equal(
    scanSchema.parse({
      scanId: "scan-1",
      userId: "user-1",
      createdAtEpochMs: 2,
      arcoreUsed: false,
      rightFoot: {
        lengthMm: 260,
        widthMm: 98,
        confidence: 0.9,
        foot: "right",
        calibration: "a4_paper",
        pixelsPerMm: 3,
      },
    }).scanId,
    "scan-1",
  );
});
