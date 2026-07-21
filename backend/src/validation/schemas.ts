import { z } from "zod";

const epochMs = z.number().int().nonnegative();
const finiteNumber = z.number().finite();
const shortString = z.string().trim().min(1).max(256);
const id = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_.:-]{1,128}$/);
const sizeSystem = z.enum(["uk", "us", "eu", "mondopoint"]);

export const sessionIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{16,128}$/);

export const documentIdSchema = id;

export const handoffPayloadSchema = z
  .object({
    v: z.literal(1),
    completedAtEpochMs: epochMs,
    size: z
      .object({
        uk: shortString,
        us: shortString,
        eu: shortString,
        mondopointMm: finiteNumber.nonnegative(),
        fitScore: finiteNumber.min(0).max(1).optional(),
        recommendationConfidence: finiteNumber.min(0).max(1).optional(),
        preferred: sizeSystem.optional(),
      })
      .strict(),
    scan: z
      .object({
        scanId: id,
        lengthMm: finiteNumber.nonnegative(),
        widthMm: finiteNumber.nonnegative(),
        measurementConfidence: finiteNumber.min(0).max(1).optional(),
        widthToLengthRatio: finiteNumber.nonnegative().optional(),
        capturedAtEpochMs: epochMs,
      })
      .strict(),
  })
  .strict();

const footMeasurementSchema = z
  .object({
    lengthMm: finiteNumber.nonnegative(),
    widthMm: finiteNumber.nonnegative(),
    confidence: finiteNumber.min(0).max(1),
    foot: z.enum(["left", "right", "unknown"]),
    calibration: z.enum(["arcore_plane", "a4_paper", "credit_card"]),
    pixelsPerMm: finiteNumber.nonnegative(),
  })
  .passthrough();

export const fitProfileSchema = z
  .object({
    fitId: id,
    userId: id,
    version: z.number().int().positive(),
    createdAtEpochMs: epochMs,
    updatedAtEpochMs: epochMs,
    widthClass: z.enum(["narrow", "regular", "wide", "extra_wide"]),
    archHeight: z.enum(["low", "medium", "high", "unknown"]),
    toeShape: z.enum(["egyptian", "greek", "roman", "square", "rounded", "unknown"]),
    comfortFit: z.enum(["snug", "standard", "relaxed"]),
    preferredMidsoleFeel: z.enum(["firm", "balanced", "soft", "unknown"]),
    favouriteBrands: z.array(shortString).max(100),
  })
  .passthrough();

export const scanSchema = z
  .object({
    scanId: id,
    userId: id,
    createdAtEpochMs: epochMs,
    leftFoot: footMeasurementSchema.optional(),
    rightFoot: footMeasurementSchema.optional(),
    arcoreUsed: z.boolean(),
  })
  .passthrough();

export const fitEventSchema = z
  .object({
    eventId: id,
    fitId: id,
    epochMs,
    kind: z.enum([
      "scan",
      "purchase",
      "return",
      "rating",
      "fit_rating",
      "wear",
      "apply",
    ]),
  })
  .passthrough();

export function sameIdOrThrow(routeId: string, bodyId: string, label: string): void {
  if (routeId !== bodyId) {
    throw new Error(`${label}_mismatch`);
  }
}
