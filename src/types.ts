// FitSense AI - shared domain types (web companion).
// Mirrors the Kotlin data classes in android/app/.../models/.

export type Foot = "left" | "right" | "unknown";

export type MeasurementUnit = "mm" | "in";

export type CalibrationReference = "arcore_plane" | "a4_paper" | "credit_card";

export const CALIBRATION_META: Record<
  CalibrationReference,
  { label: string; widthMm: number; heightMm: number }
> = {
  arcore_plane: { label: "AR plane (auto)", widthMm: 0, heightMm: 0 },
  a4_paper: { label: "A4 paper", widthMm: 210, heightMm: 297 },
  credit_card: { label: "Bank card (ID-1)", widthMm: 85.6, heightMm: 53.98 },
};

export interface FootMeasurement {
  lengthMm: number;
  widthMm: number;
  archHeightMm?: number;
  /** 0..1 — combined contour + calibration confidence. */
  confidence: number;
  /** Per-dimension quality; never substitute one dimension for another. */
  dimensionConfidence?: {
    length: number;
    width: number;
  };
  foot: Foot;
  calibration: CalibrationReference;
  pixelsPerMm: number;
}

export interface ShoeMatch {
  productId: string;
  brand: string;
  model: string;
  recommendedEuSize: number;
  /** 0..100 — fit of the shoe's last to the user's foot geometry. */
  fitScore: number;
  /** 0..100 — broader comfort estimate. */
  comfortScore: number;
  imageUrl?: string;
}

export interface SizeRecommendation {
  uk: string;
  us: string;
  eu: string;
  mondopointMm: number;
  /** 0..1 — measurement quality capped by product/catalogue evidence. */
  recommendationConfidence: number;
  matches: ShoeMatch[];
}

export interface ScanResult {
  scanId: string;
  userId: string;
  createdAtEpochMs: number;
  leftFoot?: FootMeasurement;
  rightFoot?: FootMeasurement;
  recommendation?: SizeRecommendation;
  deviceModel?: string;
  arcoreUsed: boolean;
  provenance?: {
    measurementKind: "measured" | "simulated";
    method: "reference" | "webxr" | "native-arkit" | "native-arcore" | "demo";
    algorithmVersion: string;
    widthSource: "measured" | "estimated";
    qualityStatus: "accepted" | "rejected";
    pairedFeet: boolean;
  };
}

export type FitType = "narrow" | "standard" | "wide" | "extra_wide";

export const FIT_TYPE_RATIO: Record<FitType, number> = {
  narrow: 0.36,
  standard: 0.4,
  wide: 0.44,
  extra_wide: 0.48,
};

export type ShoeCategory =
  "sneaker" | "running" | "casual" | "formal" | "boot" | "sandal";

export interface SizeRange {
  min: number;
  max: number;
  step: number;
}

export interface Product {
  productId: string;
  brand: string;
  model: string;
  category: ShoeCategory;
  fitType: FitType;
  sizeRangeEu: SizeRange;
  priceUsd: number;
  imageUrl?: string;
  description: string;
  colorways: string[];
  /** Optional merchant product page for “View in store”. */
  storeUrl?: string;
  /** Only retailer/manufacturer-verified product data may raise confidence. */
  dataQuality?: "verified" | "unverified";
}

export interface UserPreferences {
  units: MeasurementUnit;
  defaultCalibration: CalibrationReference;
  preferredBrands: string[];
  /**
   * Development-only seated-scan estimate. Valid weight-bearing production
   * scans do not add a population-average offset.
   */
  applyHeelPadOffset: boolean;
}

export interface UserProfile {
  userId: string;
  displayName?: string;
  email?: string;
  isAnonymous: boolean;
  preferences: UserPreferences;
  cachedFootLengthMm?: number;
  cachedFootWidthMm?: number;
  createdAtEpochMs: number;
  updatedAtEpochMs: number;
}

// ---- Helpers ----------------------------------------------------------------

export const WIDE_FOOT_RATIO_THRESHOLD = 0.42;

export function widthToLengthRatio(m: FootMeasurement): number {
  return m.lengthMm === 0 ? 0 : m.widthMm / m.lengthMm;
}

export function isWide(m: FootMeasurement): boolean {
  return widthToLengthRatio(m) >= WIDE_FOOT_RATIO_THRESHOLD;
}

export function primaryFoot(s: ScanResult): FootMeasurement | undefined {
  if (s.leftFoot && s.rightFoot) {
    return s.leftFoot.lengthMm >= s.rightFoot.lengthMm ? s.leftFoot : s.rightFoot;
  }
  return s.rightFoot ?? s.leftFoot;
}

export function averageLengthMm(s: ScanResult): number | undefined {
  if (s.leftFoot && s.rightFoot) {
    return (s.leftFoot.lengthMm + s.rightFoot.lengthMm) / 2;
  }
  return primaryFoot(s)?.lengthMm;
}

export function averageWidthMm(s: ScanResult): number | undefined {
  if (s.leftFoot && s.rightFoot) {
    return (s.leftFoot.widthMm + s.rightFoot.widthMm) / 2;
  }
  return primaryFoot(s)?.widthMm;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  units: "mm",
  defaultCalibration: "a4_paper",
  preferredBrands: [],
  applyHeelPadOffset: false,
};

// ─── Fit Profile (the persistent "Portable Fit Identity") ──────────────────
//
// The FitProfile is everything we know about how the user's feet relate to
// shoes:
//   - geometry (length / width / arch / toe-shape / asymmetry)
//   - declared preferences (comfort fit, midsole feel, toe-box, etc.)
//   - learned preferences (derived from a rolling history of FitEvents)
//
// It is intentionally portable — small enough to round-trip as a single
// base64 token and re-imported on any device or partner site so partners
// can offer instant personalisation without asking the user to re-scan.

/** Self- or auto-classified foot width category. */
export type WidthClass = "narrow" | "regular" | "wide" | "extra_wide";

/** Arch profile, currently user-declared. ML-inferred in a future release. */
export type ArchHeight = "low" | "medium" | "high" | "unknown";

/**
 * Classical toe-shape categories from podiatry literature.
 *   - Egyptian: 1st (big) toe longest, others taper down.
 *   - Greek:    2nd toe longest (Morton's toe).
 *   - Roman:    first three toes roughly equal.
 *   - Square:   all toes nearly equal.
 *   - Rounded:  rounded silhouette without a clear protrusion.
 */
export type ToeShape =
  "egyptian" | "greek" | "roman" | "square" | "rounded" | "unknown";

/** Comfort fit preference, mapped onto extra mm of headroom over the longest toe. */
export type ComfortFit = "snug" | "standard" | "relaxed";

/** Extra mm added to the recommended size on top of the foot length. */
export const COMFORT_HEADROOM_MM: Record<ComfortFit, number> = {
  snug: 6,
  standard: 10,
  relaxed: 14,
};

/** Midsole feel preference, used to nudge recommendations. */
export type MidsoleFeel = "firm" | "balanced" | "soft" | "unknown";

/**
 * The full persistent fit identity. All fields are optional individually so
 * we can start with a length-only scan and build up to a complete profile
 * over time as the user interacts.
 */
export interface FitProfile {
  /** Stable, anonymous identifier — distinct from `UserProfile.userId`. */
  fitId: string;
  /** Owner reference back to the user profile. */
  userId: string;
  /** Display label, e.g. "My feet" or "Mia (age 8)". Useful for kid scans. */
  label?: string;
  /** Schema version — bumped when the portable token format changes. */
  version: number;
  /** Created / updated epoch ms. */
  createdAtEpochMs: number;
  updatedAtEpochMs: number;

  // Geometry ---------------------------------------------------------------
  lengthMm?: number;
  widthMm?: number;
  /**
   * The two feet rarely match exactly. Positive → left longer, negative →
   * right longer (in mm). Used to nudge final size up if asymmetry > 4 mm.
   */
  asymmetryMm?: number;
  widthClass: WidthClass;
  archHeight: ArchHeight;
  toeShape: ToeShape;

  // Declared preferences ---------------------------------------------------
  comfortFit: ComfortFit;
  preferredMidsoleFeel: MidsoleFeel;
  /** Brands the user has explicitly favoured (mirrors `UserPreferences.preferredBrands`). */
  favouriteBrands: string[];

  // Demographics for growth tracking --------------------------------------
  /** Year of birth — only stored if user opts in. Used to project growth in kids. */
  birthYear?: number;

  /** Latest learned insight snapshot — derived from the event log. */
  insights?: FitInsights;
}

/**
 * Append-only log entry. Each event captures a single user signal that the
 * learning engine can aggregate into preferences.
 */
export type FitEvent =
  | FitEventScan
  | FitEventPurchase
  | FitEventReturn
  | FitEventRating
  | FitEventFitRating
  | FitEventWearFeedback
  | FitEventApply;

interface FitEventBase {
  eventId: string;
  fitId: string;
  epochMs: number;
}

export interface FitEventScan extends FitEventBase {
  kind: "scan";
  scanId: string;
  lengthMm: number;
  widthMm: number;
  asymmetryMm?: number;
}

export interface FitEventPurchase extends FitEventBase {
  kind: "purchase";
  productId: string;
  brand: string;
  size: string;
  /** "uk" | "us" | "eu" | "mondopoint" — system the size string is in. */
  sizeSystem: "uk" | "us" | "eu" | "mondopoint";
  priceUsd?: number;
}

export interface FitEventReturn extends FitEventBase {
  kind: "return";
  productId: string;
  brand: string;
  /** Why the customer returned the shoes. */
  reason:
    | "too_small"
    | "too_large"
    | "too_narrow"
    | "too_wide"
    | "uncomfortable_arch"
    | "wrong_style"
    | "other";
  notes?: string;
}

export interface FitEventRating extends FitEventBase {
  kind: "rating";
  productId: string;
  brand: string;
  /** 1..5 — user's overall happiness with the shoe. */
  stars: number;
}

/**
 * Dimensions on which a user can rate a shoe's fit.
 *
 * Score convention is a symmetric −2..+2 scale where 0 means "perfect for me".
 *  - length:  −2 = too short, +2 = too long
 *  - width:   −2 = too narrow, +2 = too wide
 *  - toeBox:  −2 = squashes toes, +2 = sloppy toe-box
 *  - heel:    −2 = heel slips, +2 = heel digs in
 *  - arch:    −2 = arch under-supported, +2 = arch over-supported
 *  - instep:  −2 = too tight on top, +2 = too loose on top
 *  - size:    overall summary axis — −2 = too small, +2 = too big
 */
export type FitDimension =
  "size" | "length" | "width" | "toeBox" | "heel" | "arch" | "instep";

export type FitDimensionScore = -2 | -1 | 0 | 1 | 2;

export const FIT_DIMENSIONS: ReadonlyArray<FitDimension> = [
  "size",
  "length",
  "width",
  "toeBox",
  "heel",
  "arch",
  "instep",
];

/**
 * Multi-axis fit rating for a specific shoe. Distinct from the simple
 * "stars" rating: this captures the *geometry* of fit so the learning
 * engine can derive per-brand sizing/width corrections.
 */
export interface FitEventFitRating extends FitEventBase {
  kind: "fit_rating";
  productId: string;
  brand: string;
  /** Per-dimension scores. Missing dimension = "user didn't rate it". */
  dimensions: Partial<Record<FitDimension, FitDimensionScore>>;
  /** Optional companion star rating, 1..5. */
  stars?: number;
  /** Optional short free-text note. */
  notes?: string;
}

/**
 * Long-tail feedback (e.g. "hot spot after a 10k") — collected weeks after
 * purchase. The single most predictive signal of future recommendations.
 */
export interface FitEventWearFeedback extends FitEventBase {
  kind: "wear";
  productId: string;
  brand: string;
  /** -2 too tight / -1 tight / 0 ok / +1 loose / +2 too loose */
  tightnessDelta: number;
  /** Free-form tags — "blister", "great cushion", "narrow toe-box" etc. */
  tags: string[];
}

export interface FitEventApply extends FitEventBase {
  kind: "apply";
  productId: string;
  brand: string;
  size: string;
  sizeSystem: "uk" | "us" | "eu" | "mondopoint";
}

/**
 * Aggregated, learning-engine-derived insights. Recomputed whenever new
 * events arrive. Stored on the fit profile for fast read-time access.
 */
export interface FitInsights {
  /**
   * Mean tightness across recent wear feedback. >0 means user trends "loose
   * is better"; <0 means "snug is better". Recommendation engine maps this
   * to an extra mm offset on the recommended length.
   */
  meanTightness: number;
  /**
   * Number of returns logged in the rolling window. Used as a confidence
   * dampener on declared preferences.
   */
  returnCount: number;
  /**
   * Per-brand confidence delta (-1 to +1). >0 means "user keeps buying this
   * brand and rates it well"; <0 means "user keeps returning this brand".
   */
  brandConfidence: Record<string, number>;
  /** True if the user has returned at least 2 narrow-fit shoes. */
  prefersWiderToeBox: boolean;
  /** True if returns / wear signal user wants softer cushioning. */
  prefersSofterMidsole: boolean;
  /** Predicted next-purchase replacement date for tracked categories. */
  replacementHints: Array<{
    category: ShoeCategory;
    nextReplacementEpochMs: number;
    reason: string;
  }>;
  /** Predicted next foot length for growing feet, in mm. */
  projectedLengthMm?: number;
  /**
   * Per-brand learned fit signature in the same −2..+2 space as
   * `FitEventFitRating.dimensions`. Negative numbers mean the user's
   * past pairs of *this brand* trend small/tight on that axis, so future
   * recommendations should bump up; positive numbers mean they trend big.
   *
   * Lower-cased brand string → dimension → mean rating.
   */
  brandFitSignature: Record<string, Partial<Record<FitDimension, number>>>;
  /** Number of fit-rating events backing each brand signature. */
  brandFitSampleCount: Record<string, number>;
  /** When the insight snapshot was computed. */
  computedAtEpochMs: number;
}

/** Brand-level deltas applied during size translation. */
export interface BrandFitDelta {
  /** Brand string, case-insensitive match against Product.brand. */
  brand: string;
  /**
   * Size offset in EU half-sizes. e.g. Nike runs ≈ 0.5 small → +0.5 nudges
   * the recommendation up by half a size for Nike specifically.
   */
  euSizeDelta: number;
  /** Toe-box width class (subjective; from review aggregates). */
  toeBoxWidth: WidthClass;
  /** Midsole firmness baseline. */
  midsoleFeel: MidsoleFeel;
  /** Short note shown in the UI to explain the delta. */
  note: string;
}

export const FIT_PROFILE_DEFAULT: Omit<
  FitProfile,
  "fitId" | "userId" | "createdAtEpochMs" | "updatedAtEpochMs"
> = {
  version: 1,
  widthClass: "regular",
  archHeight: "unknown",
  toeShape: "unknown",
  comfortFit: "standard",
  preferredMidsoleFeel: "unknown",
  favouriteBrands: [],
};
