import type {
  FitInsights,
  FitProfile,
  FootMeasurement,
  Product,
  ShoeMatch,
  SizeRecommendation,
} from "../types";
import {
  COMFORT_HEADROOM_MM,
  FIT_TYPE_RATIO,
  isWide,
  widthToLengthRatio,
} from "../types";
import { euAsNumber, sizeForEu, sizeForLengthMm } from "./sizing";
import { brandFitFor } from "../data/brandFit";
import { hasAiPersonalizationConsent } from "./consent";
import { loadRanker, scoreProduct } from "./ml/learnedRanker";

/**
 * Rule-based + learned recommendation engine.
 *
 *   1. Map foot length → global UK/US/EU/Mondopoint size using the static
 *      lookup in `sizing.ts`. Comfort headroom (snug / standard / relaxed)
 *      and asymmetry are added before lookup.
 *
 *   2. For each catalog product:
 *        - apply the brand's EU delta (Nike runs small → +0.5, Puma runs
 *          large → −0.5) so the per-brand recommended size is correct.
 *        - score the geometric fit (last shape vs foot ratio + width class).
 *        - score the comfort fit (size centered in range, category,
 *          preferred midsole feel).
 *        - apply learned biases: brand confidence ±, wider-toe-box pref,
 *          softer-midsole pref, tightness shift, preferred-brand bonus.
 *
 *   3. Sort by combined score, return the top N.
 *
 * Mirrors android/.../recommendation/RecommendationEngine.kt but with the
 * web companion's richer Fit Profile signals layered on top.
 */

/** Bonus added to the comfort score when the brand is on the user's favourites list. */
const PREFERRED_BRAND_BONUS = 10;
/** Max bonus / penalty from per-brand learned confidence (−1..+1 maps to ±15). */
const LEARNED_BRAND_WEIGHT = 15;
/**
 * Max bonus / penalty applied by the on-device learned ranker (the
 * logistic-regression model in `ml/learnedRanker.ts`). The ranker yields
 * a 0..1 keep probability; we centre at 0.5 and scale into ±N comfort
 * points. The ranker's own `blendWeight` further attenuates this on
 * sparse models.
 */
const LEARNED_RANKER_WEIGHT = 20;
/**
 * How many fit ratings of a brand we need before we trust the learned signature
 * enough to override the published brand delta. Below this we still nudge the
 * recommendation, just at half strength.
 */
const FIT_SIGNATURE_FULL_TRUST = 3;

/**
 * Look up the user's learned per-brand fit signature in the same −2..+2 space
 * as `FitEventFitRating.dimensions`. Returns null when the profile has no
 * recorded fit ratings for the brand yet.
 */
function learnedSignatureFor(
  profile: FitProfile | undefined,
  brand: string,
): {
  dims: Partial<Record<import("../types").FitDimension, number>>;
  weight: number;
} | null {
  const insights = profile?.insights;
  if (!insights?.brandFitSignature) return null;
  const key = brand.toLowerCase();
  const dims = insights.brandFitSignature[key];
  if (!dims) return null;
  const samples = insights.brandFitSampleCount?.[key] ?? 1;
  const weight = Math.min(1, samples / FIT_SIGNATURE_FULL_TRUST);
  return { dims, weight };
}

export interface RecommendOptions {
  /** Cap on returned matches. Default 8. */
  maxResults?: number;
  /** User-preferred brand names (case-insensitive). */
  preferredBrands?: string[];
  /**
   * Optional fit profile (with its computed insights) — when supplied,
   * recommendation incorporates comfort preference, asymmetry compensation,
   * brand confidence, and the wider-toe-box / softer-midsole nudges.
   */
  profile?: FitProfile;
}

export function recommend(
  measurement: FootMeasurement,
  products: Product[],
  options: RecommendOptions = {},
): SizeRecommendation {
  const {
    maxResults = 8,
    preferredBrands = options.profile?.favouriteBrands ?? [],
    profile,
  } = options;

  // Protocol: never publish a retail size from an unreliable scan.
  const CONFIDENCE_FLOOR = 0.55;
  if (measurement.confidence < CONFIDENCE_FLOOR) {
    return {
      uk: "",
      us: "",
      eu: "",
      mondopointMm: 0,
      recommendationConfidence: 0,
      matches: [],
      sizeWithheld: true,
      withholdReason:
        "Measurement confidence is too low to publish a retail size. Retake with sharper lighting and clearer landmarks.",
    };
  }

  const insights = profile?.insights;

  // ── Step 1: target length with profile-derived adjustments ─────────
  // Comfort headroom replaces the old fixed 8 mm heel margin.
  const headroom = COMFORT_HEADROOM_MM[profile?.comfortFit ?? "standard"];
  // Foot-asymmetry: if the recorded asymmetry is positive (left longer),
  // the user's effective length is the longer foot — assume +|asym|/2 over
  // primary scan.
  const asymBump = profile?.asymmetryMm ? Math.abs(profile.asymmetryMm) / 2 : 0;
  // Learned tightness pref: positive = "I always size up". Each unit of
  // mean tightness is worth ~3 mm in shoe-fit terms.
  const tightnessBump = (insights?.meanTightness ?? 0) * 3;
  // Growth projection (kids): if we project the user's foot to grow ≥ 5 mm
  // by the next 6 months we recommend the next size up *now* for school
  // shoes etc. This is intentionally subtle — see `fitLearning.ts` for
  // when the projection actually kicks in.
  const growthBump =
    insights?.projectedLengthMm && measurement.lengthMm > 0
      ? Math.max(0, Math.min(8, insights.projectedLengthMm - measurement.lengthMm))
      : 0;

  const effectiveLengthMm =
    measurement.lengthMm + headroom + asymBump + tightnessBump + growthBump;

  const sizes = sizeForLengthMm(effectiveLengthMm);
  const euSize = euAsNumber(sizes.eu);

  const preferredSet = new Set(
    preferredBrands.map((b) => b.toLowerCase().trim()).filter(Boolean),
  );

  // ── Learned ranker (opt-in) ─────────────────────────────────────────
  const useLearned = hasAiPersonalizationConsent();
  const ranker = useLearned ? loadRanker() : null;

  // ── Step 2: build matches with per-brand size delta + learned signals ──
  const matches = products
    .map((p) => buildMatch(p, measurement, euSize, preferredSet, profile, ranker))
    // Drop products whose size range can't accommodate the adjusted size.
    .filter((m): m is ShoeMatch => m !== null)
    .sort((a, b) => sortScore(b) - sortScore(a))
    .slice(0, maxResults);
  const verifiedRatio =
    products.length === 0
      ? 0
      : products.filter((product) => product.dataQuality === "verified").length /
        products.length;
  const catalogueEvidence = 0.4 + verifiedRatio * 0.55;
  const recommendationConfidence =
    matches.length === 0 ? 0 : Math.min(measurement.confidence, catalogueEvidence);

  return {
    uk: sizes.uk,
    us: sizes.us,
    eu: sizes.eu,
    mondopointMm: sizes.mondopointMm,
    recommendationConfidence,
    matches,
    sizeWithheld: false,
  };
}

function sortScore(m: ShoeMatch): number {
  return m.fitScore + m.comfortScore;
}

function buildMatch(
  product: Product,
  foot: FootMeasurement,
  euSize: number,
  preferredBrandsLc: Set<string>,
  profile: FitProfile | undefined,
  ranker: ReturnType<typeof loadRanker> | null,
): ShoeMatch | null {
  const insights = profile?.insights;
  const brandDelta = brandFitFor(product.brand);
  const learnedSig = learnedSignatureFor(profile, product.brand);

  // The per-brand recommended EU size = global EU + brand's published delta
  // + learned per-brand fit signature (length axis). A signature of −1 means
  // the user has historically rated *this* brand 1 unit too short → +0.5 EU.
  const learnedLengthShift =
    learnedSig?.dims.length !== undefined
      ? -learnedSig.dims.length * 0.5 * learnedSig.weight
      : learnedSig?.dims.size !== undefined
        ? -learnedSig.dims.size * 0.5 * learnedSig.weight
        : 0;
  const targetEu = euSize + brandDelta.euSizeDelta + learnedLengthShift;
  const step = Math.max(0.5, product.sizeRangeEu.step);
  const snapped =
    Math.round((targetEu - product.sizeRangeEu.min) / step) * step +
    product.sizeRangeEu.min;
  const recommendedEuSize = clamp(
    snapped,
    product.sizeRangeEu.min,
    product.sizeRangeEu.max,
  );

  // If the adjusted size is outside the product's range, exclude it.
  if (
    targetEu < product.sizeRangeEu.min - 0.5 ||
    targetEu > product.sizeRangeEu.max + 0.5
  ) {
    return null;
  }

  const fit = computeFitScore(product, foot, brandDelta, insights, learnedSig);
  let comfort = computeComfortScore(
    product,
    foot,
    recommendedEuSize,
    targetEu,
    brandDelta,
    insights,
    profile,
  );

  if (preferredBrandsLc.has(product.brand.toLowerCase())) {
    comfort = clamp(comfort + PREFERRED_BRAND_BONUS, 0, 100);
  }

  // Blend the learned ranker's keep-probability into the comfort score.
  // 0.5 (uniform prior) is a no-op; >0.5 boosts, <0.5 penalises. We
  // weight the contribution by the ranker's sample-trust so a fresh
  // model with 2 samples doesn't override the rule engine.
  if (ranker && ranker.blendWeight > 0) {
    const p = scoreProduct(ranker, foot, product, profile, preferredBrandsLc);
    const learnedAdjustment =
      (p - 0.5) * 2 * LEARNED_RANKER_WEIGHT * ranker.blendWeight;
    comfort = clamp(comfort + learnedAdjustment, 0, 100);
  }

  return {
    productId: product.productId,
    brand: product.brand,
    model: product.model,
    recommendedEuSize,
    fitScore: fit,
    comfortScore: comfort,
    imageUrl: product.imageUrl,
  };
}

function computeFitScore(
  product: Product,
  foot: FootMeasurement,
  brandDelta: ReturnType<typeof brandFitFor>,
  insights: FitInsights | undefined,
  learnedSig: ReturnType<typeof learnedSignatureFor>,
): number {
  const lastRatio = FIT_TYPE_RATIO[product.fitType];
  const footRatio = widthToLengthRatio(foot);
  const ratioDelta = Math.abs(lastRatio - footRatio);

  // ratio delta 0 → 1.0, 0.06 → 0.0
  const ratioScore = clamp01(1 - ratioDelta / 0.06);

  let wideBonus = 0;
  if (
    isWide(foot) &&
    (product.fitType === "wide" || product.fitType === "extra_wide")
  ) {
    wideBonus = 0.1;
  } else if (isWide(foot) && product.fitType === "narrow") {
    wideBonus = -0.15;
  }

  // Wider-toe-box preference (learned): boost brands whose toe-box matches.
  let toeBoxBonus = 0;
  if (insights?.prefersWiderToeBox) {
    if (brandDelta.toeBoxWidth === "wide" || brandDelta.toeBoxWidth === "extra_wide") {
      toeBoxBonus = 0.08;
    } else if (brandDelta.toeBoxWidth === "narrow") {
      toeBoxBonus = -0.1;
    }
  }

  // Per-brand learned width signature: user has rated *this* brand narrow
  // before → boost wide lasts, penalise narrow ones (weighted by sample count).
  let learnedWidthBonus = 0;
  if (learnedSig) {
    const widthAvg = learnedSig.dims.width ?? learnedSig.dims.toeBox;
    if (typeof widthAvg === "number") {
      // negative widthAvg (= felt narrow) wants a wider last
      if (widthAvg <= -0.5) {
        if (product.fitType === "wide" || product.fitType === "extra_wide") {
          learnedWidthBonus = 0.08 * learnedSig.weight;
        } else if (product.fitType === "narrow") {
          learnedWidthBonus = -0.1 * learnedSig.weight;
        }
      } else if (widthAvg >= 0.5) {
        // brand felt sloppy/wide → prefer narrower / standard lasts
        if (product.fitType === "wide" || product.fitType === "extra_wide") {
          learnedWidthBonus = -0.06 * learnedSig.weight;
        }
      }
    }
  }

  const confidenceFloor = foot.confidence * 0.1;
  return Math.round(
    clamp01(
      ratioScore + wideBonus + toeBoxBonus + learnedWidthBonus + confidenceFloor,
    ) * 100,
  );
}

function computeComfortScore(
  product: Product,
  foot: FootMeasurement,
  recommendedSize: number,
  targetEu: number,
  brandDelta: ReturnType<typeof brandFitFor>,
  insights: FitInsights | undefined,
  profile: FitProfile | undefined,
): number {
  const range = product.sizeRangeEu;
  const mid = (range.min + range.max) / 2;
  const half = Math.max(1e-3, (range.max - range.min) / 2);
  const centerness = clamp01(1 - Math.abs(recommendedSize - mid) / half);

  const categoryBoost =
    product.category === "running" || product.category === "sneaker"
      ? 0.08
      : product.category === "casual"
        ? 0.04
        : 0;

  // Penalise if even after the brand delta the size falls outside the
  // product's range (i.e. we had to clamp).
  const oobMm = Math.max(0, targetEu - range.max, range.min - targetEu);
  const mismatchPenalty = oobMm * 0.05;

  // Midsole preference (declared or learned)
  let midsoleBonus = 0;
  const wantsSoft =
    profile?.preferredMidsoleFeel === "soft" || insights?.prefersSofterMidsole;
  const wantsFirm = profile?.preferredMidsoleFeel === "firm";
  if (wantsSoft && brandDelta.midsoleFeel === "soft") midsoleBonus = 0.06;
  else if (wantsFirm && brandDelta.midsoleFeel === "firm") midsoleBonus = 0.06;
  else if (wantsSoft && brandDelta.midsoleFeel === "firm") midsoleBonus = -0.04;

  // Per-brand learned confidence (−1..+1) → ±0.15
  const brandKey = product.brand.toLowerCase();
  const brandConfidence = insights?.brandConfidence?.[brandKey] ?? 0;
  const learnedBrand = brandConfidence * (LEARNED_BRAND_WEIGHT / 100);

  const raw =
    centerness * 0.7 +
    categoryBoost +
    foot.confidence * 0.1 +
    midsoleBonus +
    learnedBrand -
    mismatchPenalty;
  return Math.round(clamp01(raw) * 100);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

// ─── Brand sizing cheat sheet ─────────────────────────────────────────

/**
 * Compute the per-brand size mapping shown in the Fit Profile page
 * (and in the Recommendations grid header). Each entry says:
 *
 *   {
 *     brand: "Nike",
 *     uk: "8", us: "9", eu: "42", mondopointMm: 275,
 *     note: "Runs about half a size small. Slim toe-box."
 *   }
 *
 * This is the "Nike UK 8, Adidas UK 8.5, Puma UK 9" cheat sheet from
 * the spec — same foot, different per-brand recommendations.
 */
export interface BrandSizeRow {
  brand: string;
  uk: string;
  us: string;
  eu: string;
  mondopointMm: number;
  note: string;
  toeBoxWidth: string;
  midsoleFeel: string;
}

export function buildBrandSizeSheet(
  measurement: FootMeasurement,
  options: { brands?: string[]; profile?: FitProfile } = {},
): BrandSizeRow[] {
  const profile = options.profile;
  const headroom = COMFORT_HEADROOM_MM[profile?.comfortFit ?? "standard"];
  const asymBump = profile?.asymmetryMm ? Math.abs(profile.asymmetryMm) / 2 : 0;
  const tightnessBump = (profile?.insights?.meanTightness ?? 0) * 3;
  const effectiveLengthMm = measurement.lengthMm + headroom + asymBump + tightnessBump;
  const baseEu = euAsNumber(sizeForLengthMm(effectiveLengthMm).eu);
  const brands = options.brands ?? [
    "Nike",
    "Adidas",
    "Puma",
    "New Balance",
    "Asics",
    "Brooks",
    "Hoka",
    "Reebok",
  ];
  return brands.map((brand) => {
    const d = brandFitFor(brand);
    const learned = learnedSignatureFor(profile, brand);
    const learnedShift =
      learned?.dims.length !== undefined
        ? -learned.dims.length * 0.5 * learned.weight
        : learned?.dims.size !== undefined
          ? -learned.dims.size * 0.5 * learned.weight
          : 0;
    const trip = sizeForEu(baseEu + d.euSizeDelta + learnedShift);
    return {
      brand,
      uk: trip.uk,
      us: trip.us,
      eu: trip.eu,
      mondopointMm: trip.mondopointMm,
      note: d.note,
      toeBoxWidth: d.toeBoxWidth,
      midsoleFeel: d.midsoleFeel,
    };
  });
}
