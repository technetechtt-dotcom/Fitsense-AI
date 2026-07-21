import { SHOE_CATALOG } from "../../data/catalog";
import { hasAiPersonalizationConsent } from "../consent";
import type { FitEvent, FitProfile, FootMeasurement, Product } from "../../types";
import {
  emptyVector,
  extractFeatures,
  FEATURE_COUNT,
  FEATURE_VERSION,
} from "./featureVector";

/**
 * On-device learned ranker — a small logistic-regression model trained
 * online over the user's own fit-event log.
 *
 * Why logistic regression?
 *
 *   - Inference is a single dot-product → sigmoid; runs in microseconds
 *     on every recommendation request without blocking the UI thread.
 *   - Training is trivial SGD; we can update on every new event without
 *     a worker / WASM runtime / accelerator.
 *   - The weights are 18 numbers — trivially serialised to localStorage
 *     and synced to the cloud via the existing fit profile.
 *
 * Why on-device?
 *
 *   - Respects the privacy contract: even with AI personalisation on,
 *     no labels leave the device.
 *   - Cold-starts with reasonable behaviour because the feature vector
 *     already encodes hand-tuned signals (brand toe-box, comfort fit,
 *     etc.) — the model only has to learn how *this user* weights them.
 *
 * Output is a probability in [0, 1] that the user will *keep* the shoe
 * (i.e. not return + rate it ≥ 3 stars). The recommendation engine
 * blends this with the rule-based fit/comfort scores at a confidence-
 * scaled weight so the engine degrades gracefully on tiny samples.
 */

export const RANKER_STORAGE_KEY = "fitsense:ranker:v1";
const LEARNING_RATE = 0.08;
const L2 = 0.005;
const FULL_TRUST_SAMPLES = 30;

interface PersistedRanker {
  featureVersion: number;
  weights: number[];
  samples: number;
  updatedAtEpochMs: number;
}

export interface RankerSnapshot {
  weights: Float32Array;
  samples: number;
  /** Blend weight: how much to trust the learned score vs rule-based. */
  blendWeight: number;
}

export function loadRanker(): RankerSnapshot {
  const empty: RankerSnapshot = {
    weights: emptyVector(),
    samples: 0,
    blendWeight: 0,
  };
  if (typeof window === "undefined") return empty;
  const raw = localStorage.getItem(RANKER_STORAGE_KEY);
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw) as PersistedRanker;
    if (parsed.featureVersion !== FEATURE_VERSION) return empty;
    if (!Array.isArray(parsed.weights) || parsed.weights.length !== FEATURE_COUNT) {
      return empty;
    }
    const w = new Float32Array(FEATURE_COUNT);
    for (let i = 0; i < FEATURE_COUNT; i++) w[i] = parsed.weights[i];
    return {
      weights: w,
      samples: parsed.samples,
      blendWeight: Math.min(1, parsed.samples / FULL_TRUST_SAMPLES),
    };
  } catch {
    return empty;
  }
}

export function resetRanker(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(RANKER_STORAGE_KEY);
  }
}

export function saveRanker(snapshot: RankerSnapshot): void {
  if (typeof window === "undefined") return;
  const persisted: PersistedRanker = {
    featureVersion: FEATURE_VERSION,
    weights: Array.from(snapshot.weights),
    samples: snapshot.samples,
    updatedAtEpochMs: Date.now(),
  };
  localStorage.setItem(RANKER_STORAGE_KEY, JSON.stringify(persisted));
}

/** Inference — predicted keep probability ∈ (0, 1). */
export function scoreProduct(
  snapshot: RankerSnapshot,
  foot: FootMeasurement,
  product: Product,
  profile: FitProfile | undefined,
  preferredBrandsLc: Set<string>,
): number {
  const x = extractFeatures(foot, product, profile, preferredBrandsLc);
  return sigmoid(dot(snapshot.weights, x));
}

/**
 * Pure-function training step. Returns updated weights & sample count.
 *
 * `y` is 1 if the user kept the shoe / rated it high, 0 if they returned
 * it or rated it low. Returns the snapshot so callers can decide whether
 * to persist (we batch saves to keep localStorage churn low).
 */
export function trainStep(
  snapshot: RankerSnapshot,
  features: Float32Array,
  y: number,
  sampleWeight = 1,
): RankerSnapshot {
  const w = snapshot.weights;
  const pred = sigmoid(dot(w, features));
  const grad = pred - y;
  const next = new Float32Array(FEATURE_COUNT);
  for (let i = 0; i < FEATURE_COUNT; i++) {
    // L2 regularisation on every weight except the bias (index 0).
    const reg = i === 0 ? 0 : L2 * w[i];
    next[i] = w[i] - LEARNING_RATE * sampleWeight * (grad * features[i] + reg);
  }
  const samples = snapshot.samples + sampleWeight;
  return {
    weights: next,
    samples,
    blendWeight: Math.min(1, samples / FULL_TRUST_SAMPLES),
  };
}

/**
 * Convert a fit event to a (features, label, weight) triple. Returns
 * null for events that aren't useful as training signals (e.g. raw
 * `apply` clicks without an outcome).
 *
 * We can't always recover the *product* features from an event because
 * the event only carries `productId` + brand. The catalog lookup gives
 * us the rest. If the catalog has churned and the product is gone we
 * silently skip the event.
 */
export interface TrainingTuple {
  product: Product;
  label: number;
  weight: number;
}

export function eventToTuple(
  event: FitEvent,
  catalog: Product[] = SHOE_CATALOG,
): TrainingTuple | null {
  let product: Product | undefined;
  if ("productId" in event && event.productId) {
    product = catalog.find((p) => p.productId === event.productId);
  }
  if (!product) return null;
  switch (event.kind) {
    case "purchase":
      // The user committed money — strong positive signal.
      return { product, label: 1, weight: 1 };
    case "return":
      // Strong negative — the geometry-aware reasons (size / width / arch)
      // are the most informative; "wrong_style" is a weaker negative.
      return {
        product,
        label: 0,
        weight: event.reason === "wrong_style" ? 0.4 : 1,
      };
    case "rating":
      // 5★ → label 1; 1★ → 0. Weight rises with confidence (distance from 3).
      return {
        product,
        label: event.stars >= 4 ? 1 : event.stars <= 2 ? 0 : 0.5,
        weight: Math.max(0.3, Math.abs(event.stars - 3) / 2),
      };
    case "fit_rating": {
      // Translate the per-dimension scores into a "did it fit" label.
      // Mean |score| close to 0 → great fit → label 1.
      const scores: number[] = [];
      for (const v of Object.values(event.dimensions)) {
        if (typeof v === "number") scores.push(v);
      }
      if (scores.length === 0) return null;
      const meanAbs = scores.reduce((s, v) => s + Math.abs(v), 0) / scores.length;
      const label = meanAbs <= 0.7 ? 1 : meanAbs >= 1.3 ? 0 : 0.5;
      return { product, label, weight: 0.6 };
    }
    case "wear":
      // Tighter than expected → mild negative. Loose → mild negative.
      // Just right → positive.
      return {
        product,
        label: Math.abs(event.tightnessDelta) <= 0.5 ? 1 : 0,
        weight: 0.4,
      };
    default:
      return null;
  }
}

/**
 * Replay the full event log to (re)train the ranker from scratch.
 *
 * Called when the user grants AI personalisation consent, when the
 * feature schema bumps, and when the event log diverges substantially
 * from `snapshot.samples` (e.g. after a cloud restore).
 *
 * We feed each event in chronological order so newer events have a
 * larger effect on the final weights — this approximates a forgetting
 * factor without an explicit decay term.
 */
export function trainFromEvents(
  events: FitEvent[],
  profile: FitProfile | undefined,
  foot: FootMeasurement | null,
  preferredBrandsLc: Set<string>,
  startFrom: RankerSnapshot = { weights: emptyVector(), samples: 0, blendWeight: 0 },
): RankerSnapshot {
  if (!foot) return startFrom;
  const chronological = [...events].sort((a, b) => a.epochMs - b.epochMs);
  let current = startFrom;
  for (const e of chronological) {
    const tuple = eventToTuple(e);
    if (!tuple) continue;
    const features = extractFeatures(foot, tuple.product, profile, preferredBrandsLc);
    current = trainStep(current, features, tuple.label, tuple.weight);
  }
  return current;
}

/**
 * Incremental update for a single event. Cheap enough to call from the
 * UI thread after every `appendFitEvent`.
 */
export function trainOnEvent(
  event: FitEvent,
  profile: FitProfile | undefined,
  foot: FootMeasurement | null,
  preferredBrandsLc: Set<string>,
): RankerSnapshot | null {
  if (!hasAiPersonalizationConsent()) return null;
  if (!foot) return null;
  const tuple = eventToTuple(event);
  if (!tuple) return null;
  const features = extractFeatures(foot, tuple.product, profile, preferredBrandsLc);
  const next = trainStep(loadRanker(), features, tuple.label, tuple.weight);
  saveRanker(next);
  return next;
}

function dot(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function sigmoid(z: number): number {
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}
