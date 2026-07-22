import type { BrandFitDelta } from "../types";

/**
 * Per-brand (and optional model) fit deltas. Static seed data plus
 * merchant-uploaded overrides from `/v1/merchants/.../brand-fit`.
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

type FitKey = string;

function keyOf(brand: string, model?: string): FitKey {
  return `${normalise(brand)}::${normalise(model ?? "")}`;
}

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

const staticByKey: Map<FitKey, BrandFitDelta> = new Map(
  BRAND_FIT_DELTAS.map((d) => [keyOf(d.brand), d]),
);

/** Merchant / model-specific overrides (brand+model, then brand). */
const merchantByKey: Map<FitKey, BrandFitDelta> = new Map();

export function registerMerchantBrandFits(
  profiles: Array<
    BrandFitDelta & {
      model?: string;
    }
  >,
): void {
  merchantByKey.clear();
  for (const p of profiles) {
    merchantByKey.set(keyOf(p.brand, p.model), {
      brand: p.brand,
      euSizeDelta: p.euSizeDelta,
      toeBoxWidth: p.toeBoxWidth,
      midsoleFeel: p.midsoleFeel,
      note: p.note,
    });
    // Also index bare brand if model empty.
    if (!p.model) {
      merchantByKey.set(keyOf(p.brand), {
        brand: p.brand,
        euSizeDelta: p.euSizeDelta,
        toeBoxWidth: p.toeBoxWidth,
        midsoleFeel: p.midsoleFeel,
        note: p.note,
      });
    }
  }
}

/** Look up brand/model delta — merchant model → merchant brand → static → default. */
export function brandFitFor(brand: string, model?: string): BrandFitDelta {
  if (model) {
    const exact = merchantByKey.get(keyOf(brand, model));
    if (exact) return exact;
  }
  const merchantBrand = merchantByKey.get(keyOf(brand));
  if (merchantBrand) return merchantBrand;
  return staticByKey.get(keyOf(brand)) ?? DEFAULT_DELTA;
}
