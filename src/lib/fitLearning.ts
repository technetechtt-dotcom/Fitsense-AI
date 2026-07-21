import type {
  FitDimension,
  FitEvent,
  FitEventFitRating,
  FitEventReturn,
  FitInsights,
  FitProfile,
  ShoeCategory,
} from "../types";

/**
 * Pure learning engine — aggregates the rolling event log into a set of
 * actionable insights. Stateless and deterministic so it's trivial to
 * unit test (and to re-run on the server later for offline analytics).
 *
 * Signals (in order of weight):
 *
 *  - **Returns** are gold-standard "what didn't work" data. Two narrow
 *    returns push `prefersWiderToeBox` true; two "too tight" returns push
 *    a positive tightness shift onto every future recommendation.
 *
 *  - **Wear feedback** captured weeks after purchase is more predictive
 *    than first-impression ratings — we weight it 2× by default.
 *
 *  - **Ratings** & **purchases** build per-brand confidence (positive
 *    when the user buys and keeps a brand, negative when they return it).
 *
 *  - **Repeated scans** over time (kids) project growth, enabling
 *    proactive replacement reminders.
 */

const RECENT_WINDOW_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

const WEAR_WEIGHT = 2;
const RATING_WEIGHT = 1;
const RETURN_PENALTY = -1;
const PURCHASE_BONUS = 0.4;
const APPLY_BONUS = 0.1;

export function deriveInsights(
  profile: FitProfile,
  events: FitEvent[],
  nowEpochMs: number = Date.now(),
): FitInsights {
  const recent = events.filter((e) => nowEpochMs - e.epochMs <= RECENT_WINDOW_MS);
  const returns = recent.filter((e): e is FitEventReturn => e.kind === "return");
  const wear = recent.filter((e) => e.kind === "wear");
  const ratings = recent.filter((e) => e.kind === "rating");
  const purchases = recent.filter((e) => e.kind === "purchase");
  const applies = recent.filter((e) => e.kind === "apply");
  const scans = events.filter((e) => e.kind === "scan");
  const fitRatings = recent.filter(
    (e): e is FitEventFitRating => e.kind === "fit_rating",
  );

  // ── Brand confidence ──────────────────────────────────────────────────
  const brandConfidence: Record<string, number> = {};
  function bump(brand: string, delta: number) {
    const key = brand.toLowerCase();
    brandConfidence[key] = (brandConfidence[key] ?? 0) + delta;
  }
  for (const r of returns) bump(r.brand, RETURN_PENALTY);
  for (const w of wear) {
    if (w.kind !== "wear") continue;
    // tighter than expected = bad → penalise the brand
    const sign = Math.sign(-Math.abs(w.tightnessDelta) + 1);
    bump(w.brand, WEAR_WEIGHT * sign * 0.5);
  }
  for (const r of ratings) {
    if (r.kind !== "rating") continue;
    // 5★ → +1; 1★ → −1; 3★ → 0
    bump(r.brand, RATING_WEIGHT * ((r.stars - 3) / 2));
  }
  for (const p of purchases) {
    if (p.kind !== "purchase") continue;
    bump(p.brand, PURCHASE_BONUS);
  }
  for (const a of applies) {
    if (a.kind !== "apply") continue;
    bump(a.brand, APPLY_BONUS);
  }
  // Fit-ratings: dimensions near 0 = great fit (+), big magnitude = poor fit (−).
  for (const fr of fitRatings) {
    const score = fitRatingBrandScore(fr);
    if (score !== null) bump(fr.brand, score);
  }
  // Normalise into −1..+1.
  for (const b of Object.keys(brandConfidence)) {
    brandConfidence[b] = clamp(brandConfidence[b] / 5, -1, 1);
  }

  // ── Per-brand fit signature (length / width / toe-box / heel / arch) ─
  const { brandFitSignature, brandFitSampleCount } =
    aggregateBrandFitSignature(fitRatings);

  // ── Tightness preference ─────────────────────────────────────────────
  const tightnessSamples = wear
    .map((w) => (w.kind === "wear" ? w.tightnessDelta : null))
    .filter((x): x is number => x !== null);
  // Returns also contribute: too-small → user wants looser
  for (const r of returns) {
    if (r.reason === "too_small") tightnessSamples.push(1);
    else if (r.reason === "too_large") tightnessSamples.push(-1);
  }
  // Length/size dimensions from fit ratings — negative = "too short" → user
  // wants looser/longer recommendations.
  for (const fr of fitRatings) {
    const lengthScore = fr.dimensions.length ?? fr.dimensions.size;
    if (typeof lengthScore === "number") {
      // Flip sign: −2 (too short) → tightnessSample +2 ("wants looser")
      tightnessSamples.push(-lengthScore);
    }
  }
  const meanTightness =
    tightnessSamples.length === 0
      ? 0
      : tightnessSamples.reduce((s, v) => s + v, 0) / tightnessSamples.length;

  // ── Toe-box / midsole signals ────────────────────────────────────────
  const narrowReturns = returns.filter((r) => r.reason === "too_narrow").length;
  // Fit-ratings: ≥ 2 ratings averaging ≤ −1 on width or toe-box = narrow-trend.
  const narrowFitRatings = countDimensionTrend(
    fitRatings,
    ["width", "toeBox"],
    (avg) => avg <= -1,
    2,
  );
  const prefersWiderToeBox =
    narrowReturns >= 2 ||
    narrowFitRatings ||
    profile.widthClass === "wide" ||
    profile.widthClass === "extra_wide";

  const softTagHits = wear.filter(
    (w) =>
      w.kind === "wear" &&
      w.tags.some((t) => /firm|hard|stiff/i.test(t)) &&
      w.tightnessDelta <= 0,
  ).length;
  const archHotspot = countDimensionTrend(fitRatings, ["arch"], (avg) => avg <= -1, 2);
  const prefersSofterMidsole =
    profile.preferredMidsoleFeel === "soft" || softTagHits >= 2 || archHotspot;

  // ── Replacement timing (per category) ────────────────────────────────
  const replacementHints = computeReplacementHints(purchases, nowEpochMs);

  // ── Growth projection (multi-scan delta over time) ───────────────────
  const projectedLengthMm = projectLength(profile, scans, nowEpochMs);

  return {
    meanTightness,
    returnCount: returns.length,
    brandConfidence,
    prefersWiderToeBox,
    prefersSofterMidsole,
    replacementHints,
    projectedLengthMm,
    brandFitSignature,
    brandFitSampleCount,
    computedAtEpochMs: nowEpochMs,
  };
}

/**
 * Squash a per-shoe fit rating into a single brand-confidence delta.
 * "Closer to 0 across the board" = great fit = positive bump.
 * Big spikes (|score| ≥ 2 on any axis) = bad fit = negative bump.
 *
 * Returns null when the rating has no scored dimensions.
 */
function fitRatingBrandScore(fr: FitEventFitRating): number | null {
  const scores: number[] = [];
  for (const v of Object.values(fr.dimensions)) {
    if (typeof v === "number") scores.push(v);
  }
  if (scores.length === 0) return null;
  const meanAbs = scores.reduce((s, v) => s + Math.abs(v), 0) / scores.length;
  // meanAbs of 0 → +0.6, 1 → 0, 2 → −1.2.
  return 0.6 - meanAbs * 0.9;
}

function aggregateBrandFitSignature(fitRatings: FitEventFitRating[]): {
  brandFitSignature: FitInsights["brandFitSignature"];
  brandFitSampleCount: FitInsights["brandFitSampleCount"];
} {
  // brand → dimension → running [sum, count]
  const acc: Record<string, Partial<Record<FitDimension, [number, number]>>> = {};
  const count: Record<string, number> = {};
  for (const fr of fitRatings) {
    const brand = fr.brand.toLowerCase();
    count[brand] = (count[brand] ?? 0) + 1;
    const bucket = (acc[brand] ??= {});
    for (const [dim, score] of Object.entries(fr.dimensions)) {
      if (typeof score !== "number") continue;
      const key = dim as FitDimension;
      const prev = bucket[key] ?? [0, 0];
      bucket[key] = [prev[0] + score, prev[1] + 1];
    }
  }
  const signature: FitInsights["brandFitSignature"] = {};
  for (const [brand, dims] of Object.entries(acc)) {
    const out: Partial<Record<FitDimension, number>> = {};
    for (const [dim, pair] of Object.entries(dims)) {
      if (!pair) continue;
      const [sum, n] = pair;
      if (n > 0) out[dim as FitDimension] = sum / n;
    }
    signature[brand] = out;
  }
  return { brandFitSignature: signature, brandFitSampleCount: count };
}

/**
 * True when ≥ `minSamples` ratings exist that, on average across the given
 * dimensions, satisfy the predicate. Used for "user has consistently rated
 * this kind of fit too tight".
 */
function countDimensionTrend(
  fitRatings: FitEventFitRating[],
  dims: FitDimension[],
  predicate: (avg: number) => boolean,
  minSamples: number,
): boolean {
  let hits = 0;
  for (const fr of fitRatings) {
    const vals: number[] = [];
    for (const d of dims) {
      const v = fr.dimensions[d];
      if (typeof v === "number") vals.push(v);
    }
    if (vals.length === 0) continue;
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    if (predicate(avg)) hits += 1;
    if (hits >= minSamples) return true;
  }
  return false;
}

function computeReplacementHints(
  purchases: FitEvent[],
  _nowEpochMs: number,
): FitInsights["replacementHints"] {
  // Conservative running-shoe lifespan: 500 km / 6 months for daily
  // trainers; we don't yet know category-specific cadence so the heuristic
  // assumes a fixed-window per category.
  const lifespanMsByCategory: Record<ShoeCategory, number> = {
    running: 1000 * 60 * 60 * 24 * 180,
    sneaker: 1000 * 60 * 60 * 24 * 365,
    casual: 1000 * 60 * 60 * 24 * 730,
    formal: 1000 * 60 * 60 * 24 * 730,
    boot: 1000 * 60 * 60 * 24 * 730,
    sandal: 1000 * 60 * 60 * 24 * 540,
  };
  const lastByCategory: Map<ShoeCategory, number> = new Map();
  // We don't have category info on the event itself — caller can add this
  // by enriching `FitEventPurchase` later. For now we treat all purchases
  // as running shoes (most common case for this catalog). Easily extended.
  const ASSUMED: ShoeCategory = "running";
  for (const p of purchases) {
    if (p.kind === "purchase") {
      const prev = lastByCategory.get(ASSUMED) ?? 0;
      if (p.epochMs > prev) lastByCategory.set(ASSUMED, p.epochMs);
    }
  }
  return Array.from(lastByCategory.entries()).map(([category, last]) => {
    const lifespan = lifespanMsByCategory[category];
    return {
      category,
      nextReplacementEpochMs: last + lifespan,
      reason: `Average ${category} lifespan ≈ ${Math.round(
        lifespan / (1000 * 60 * 60 * 24 * 30),
      )} months from last purchase.`,
    };
  });
}

function projectLength(
  profile: FitProfile,
  scans: FitEvent[],
  _nowEpochMs: number,
): number | undefined {
  // We only project when we have ≥ 2 scans spread over ≥ 30 days. Otherwise
  // there's no growth signal — adult feet are stable.
  const scanEvents = scans.filter(
    (e): e is Extract<FitEvent, { kind: "scan" }> => e.kind === "scan",
  );
  if (scanEvents.length < 2) return undefined;
  const oldest = scanEvents[scanEvents.length - 1];
  const newest = scanEvents[0];
  const dtDays = (newest.epochMs - oldest.epochMs) / (1000 * 60 * 60 * 24);
  if (dtDays < 30) return undefined;
  const dlMm = newest.lengthMm - oldest.lengthMm;
  // Adult feet rarely grow more than 1 mm/year — treat sub-2 mm change as
  // measurement noise.
  if (Math.abs(dlMm) < 2) return undefined;
  const ratePerYear = (dlMm / dtDays) * 365;
  const monthsAhead = 6;
  const projected =
    (profile.lengthMm ?? newest.lengthMm) + (ratePerYear * monthsAhead) / 12;
  return Math.round(projected * 10) / 10;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
