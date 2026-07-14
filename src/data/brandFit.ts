import type { BrandFitDelta } from "../types";

/**
 * Per-brand fit deltas — the heart of the "Nike UK 8, Adidas UK 8.5,
 * Puma UK 9" cheat sheet shown in the Fit Profile.
 *
 * Numbers are derived from a small published dataset + the FitSense team's
 * own QA shoe-fit tests, normalised against the EU sizing scale (i.e. the
 * delta is in EU full-sizes, which is the same scale as US half-sizes).
 * Positive `euSizeDelta` means the brand runs *small* (size up). Negative
 * means it runs *large* (size down).
 *
 * The default delta (when a brand is missing) is the zero delta —
 * recommendation falls back to the global Mondopoint → size mapping.
 */

export const BRAND_FIT_DELTAS: BrandFitDelta[] = [
  {
    brand: "Nike",
    euSizeDelta: 0.5,
    toeBoxWidth: "narrow",
    midsoleFeel: "balanced",
    note: "Runs about half a size small. Slim toe-box on Pegasus/Air Max.",
  },
  {
    brand: "Adidas",
    euSizeDelta: 0,
    toeBoxWidth: "regular",
    midsoleFeel: "soft",
    note: "True to size length-wise; Ultraboost runs a touch narrow midfoot.",
  },
  {
    brand: "Puma",
    euSizeDelta: -0.5,
    toeBoxWidth: "regular",
    midsoleFeel: "balanced",
    note: "Runs about half a size large. RS-X especially generous.",
  },
  {
    brand: "New Balance",
    euSizeDelta: 0,
    toeBoxWidth: "wide",
    midsoleFeel: "soft",
    note: "True to size with the widest toe-box of the majors. 2E and 4E widths available.",
  },
  {
    brand: "Reebok",
    euSizeDelta: 0,
    toeBoxWidth: "regular",
    midsoleFeel: "firm",
    note: "True to size. Classics run a touch wide in the heel.",
  },
  {
    brand: "Asics",
    euSizeDelta: 0,
    toeBoxWidth: "wide",
    midsoleFeel: "balanced",
    note: "True to size with a roomy toe-box. Gel cushioning on flagships.",
  },
  {
    brand: "Brooks",
    euSizeDelta: 0,
    toeBoxWidth: "wide",
    midsoleFeel: "soft",
    note: "True to size, very wide-foot-friendly, plush ride.",
  },
  {
    brand: "Hoka",
    euSizeDelta: 0,
    toeBoxWidth: "regular",
    midsoleFeel: "soft",
    note: "True to size. Maximal cushioning, slightly snug heel.",
  },
  {
    brand: "Bata Power",
    euSizeDelta: 0,
    toeBoxWidth: "regular",
    midsoleFeel: "firm",
    note: "Local retail trainer; runs true to size.",
  },
  {
    brand: "North Star",
    euSizeDelta: -0.5,
    toeBoxWidth: "wide",
    midsoleFeel: "balanced",
    note: "Runs half a size large with a generous toe-box.",
  },
];

const DEFAULT_DELTA: BrandFitDelta = {
  brand: "*",
  euSizeDelta: 0,
  toeBoxWidth: "regular",
  midsoleFeel: "balanced",
  note: "No published fit data — using global size mapping.",
};

const byKey: Map<string, BrandFitDelta> = new Map(
  BRAND_FIT_DELTAS.map((d) => [normalise(d.brand), d]),
);

/** Look up the brand delta, case-insensitively. */
export function brandFitFor(brand: string): BrandFitDelta {
  return byKey.get(normalise(brand)) ?? DEFAULT_DELTA;
}

function normalise(brand: string): string {
  return brand.trim().toLowerCase();
}
