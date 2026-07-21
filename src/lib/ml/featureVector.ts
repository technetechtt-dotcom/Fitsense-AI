import type { FitProfile, Product } from "../../types";
import { isWide, widthToLengthRatio, FIT_TYPE_RATIO } from "../../types";
import { brandFitFor } from "../../data/brandFit";
import type { FootMeasurement } from "../../types";

/**
 * Feature engineering for the learned ranker.
 *
 * Each (user, product) pair is encoded as a fixed-length numeric vector
 * the logistic ranker consumes. Features are normalised to roughly
 * [-1, 1] so a single learning rate works across all of them.
 *
 * Adding a new feature: append it to {@link FEATURE_NAMES}, extend
 * {@link extractFeatures}, and bump {@link FEATURE_VERSION} so old
 * persisted weights are discarded instead of mis-interpreted.
 */

export const FEATURE_VERSION = 1;

export const FEATURE_NAMES = [
  "bias",
  "lengthDelta",
  "widthRatioDelta",
  "wideFoot",
  "narrowFoot",
  "brandToeBoxWide",
  "brandToeBoxNarrow",
  "brandSoftMidsole",
  "brandFirmMidsole",
  "categoryRunning",
  "categorySneaker",
  "preferredBrand",
  "brandSizeDelta",
  "comfortRelaxed",
  "comfortSnug",
  "tightnessShift",
  "wantsWiderToeBox",
  "wantsSofterMidsole",
] as const;

export type FeatureName = (typeof FEATURE_NAMES)[number];

export const FEATURE_COUNT = FEATURE_NAMES.length;

export function emptyVector(): Float32Array {
  return new Float32Array(FEATURE_COUNT);
}

/**
 * Extract a (user, product) feature vector. Centered/normalised so the
 * learning rate works uniformly across rows.
 */
export function extractFeatures(
  foot: FootMeasurement,
  product: Product,
  profile: FitProfile | undefined,
  preferredBrandsLc: Set<string>,
): Float32Array {
  const v = emptyVector();
  const insights = profile?.insights;
  const brandDelta = brandFitFor(product.brand);

  // Bias term.
  v[idx("bias")] = 1;

  // Length encoded as normalised delta around 260 mm (≈ EU 42).
  v[idx("lengthDelta")] = (foot.lengthMm - 260) / 60;

  // Foot ratio: positive if wider than the product's last shape, negative if narrower.
  const productRatio = FIT_TYPE_RATIO[product.fitType];
  const ratioDelta = widthToLengthRatio(foot) - productRatio;
  v[idx("widthRatioDelta")] = clamp(ratioDelta / 0.06, -1, 1);

  v[idx("wideFoot")] = isWide(foot) ? 1 : 0;
  v[idx("narrowFoot")] = widthToLengthRatio(foot) < 0.34 ? 1 : 0;

  v[idx("brandToeBoxWide")] =
    brandDelta.toeBoxWidth === "wide" || brandDelta.toeBoxWidth === "extra_wide"
      ? 1
      : 0;
  v[idx("brandToeBoxNarrow")] = brandDelta.toeBoxWidth === "narrow" ? 1 : 0;

  v[idx("brandSoftMidsole")] = brandDelta.midsoleFeel === "soft" ? 1 : 0;
  v[idx("brandFirmMidsole")] = brandDelta.midsoleFeel === "firm" ? 1 : 0;

  v[idx("categoryRunning")] = product.category === "running" ? 1 : 0;
  v[idx("categorySneaker")] = product.category === "sneaker" ? 1 : 0;

  v[idx("preferredBrand")] = preferredBrandsLc.has(product.brand.toLowerCase()) ? 1 : 0;

  v[idx("brandSizeDelta")] = clamp(brandDelta.euSizeDelta / 1.5, -1, 1);

  v[idx("comfortRelaxed")] = profile?.comfortFit === "relaxed" ? 1 : 0;
  v[idx("comfortSnug")] = profile?.comfortFit === "snug" ? 1 : 0;

  v[idx("tightnessShift")] = clamp((insights?.meanTightness ?? 0) / 2, -1, 1);

  v[idx("wantsWiderToeBox")] = insights?.prefersWiderToeBox ? 1 : 0;
  v[idx("wantsSofterMidsole")] = insights?.prefersSofterMidsole ? 1 : 0;

  return v;
}

function idx(name: FeatureName): number {
  return FEATURE_NAMES.indexOf(name);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
