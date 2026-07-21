import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  Footprints,
  Heart,
  Palette,
  Ruler,
  ShoppingBag,
  Sparkles,
  Tag,
} from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { ErrorState } from "../components/ErrorState";
import { PrimaryButton } from "../components/PrimaryButton";
import { FitScoreRing } from "../components/FitScoreRing";
import { FitFeedback } from "../components/FitFeedback";
import { SHOE_CATALOG } from "../data/catalog";
import { productStoreUrl } from "../lib/productLinks";
import { recommend } from "../lib/recommendation";
import { getOrCreateProfile, listScans, updatePreferences } from "../lib/storage";
import { getOrCreateFitProfile } from "../lib/fitProfile";
import { averageLengthMm, primaryFoot } from "../types";
import { splitLength } from "../lib/format";
import type { Product, ShoeCategory, ShoeMatch, UserProfile } from "../types";

const CATEGORY_LABEL: Record<ShoeCategory, string> = {
  running: "Running",
  sneaker: "Sneaker",
  casual: "Casual",
  formal: "Formal",
  boot: "Boot",
  sandal: "Sandal",
};

const FIT_TYPE_DESCRIPTION = {
  narrow: "Narrow last — best for slim feet.",
  standard: "Standard last — fits most foot shapes.",
  wide: "Wide last — extra room across the ball of the foot.",
  extra_wide: "Extra-wide last — generous fit for very wide feet.",
} as const;

/**
 * Product detail page reached from /products/:productId — typically by
 * tapping a recommended shoe card on /recommendations/:scanId.
 *
 * Shows the catalog metadata, computes a fresh fit score against the
 * user's most recent scan, and offers two CTAs: "View in store" (a
 * placeholder for a real merchant URL) and "Toggle brand preference"
 * (writes to `UserPreferences.preferredBrands` so future recommendations
 * surface the brand earlier).
 */
export function ProductDetail() {
  const { productId = "" } = useParams();
  const nav = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setProfile(getOrCreateProfile());
  }, []);

  const product = useMemo<Product | undefined>(
    () => SHOE_CATALOG.find((p) => p.productId === productId),
    [productId],
  );

  // Compute a fresh match against the latest scan so we can show
  // size + score in this detail context rather than relying on the
  // recommendation snapshot baked into the original ScanResult.
  const match = useMemo<ShoeMatch | null>(() => {
    if (!product) return null;
    const scans = listScans();
    const latest = scans[0];
    if (!latest) return null;
    const foot = primaryFoot(latest);
    if (!foot) return null;
    // Pull the persistent fit profile so brand offsets, comfort headroom
    // and learned biases all flow into this detail-screen recommendation.
    const fitProfile = getOrCreateFitProfile();
    const rec = recommend(foot, [product], { profile: fitProfile });
    return rec.matches[0] ?? null;
  }, [product]);

  const latestLengthMm = useMemo(() => {
    const scans = listScans();
    const latest = scans[0];
    return latest ? averageLengthMm(latest) : undefined;
  }, []);

  if (!product) {
    return (
      <ErrorState
        message="That product isn't in the catalogue."
        onRetry={() => nav("/home")}
      />
    );
  }

  const preferred =
    profile?.preferences.preferredBrands
      .map((b) => b.toLowerCase())
      .includes(product.brand.toLowerCase()) ?? false;

  const togglePreferred = () => {
    if (!profile) return;
    const cur = profile.preferences.preferredBrands;
    const lc = product.brand.toLowerCase();
    const next = cur.some((b) => b.toLowerCase() === lc)
      ? cur.filter((b) => b.toLowerCase() !== lc)
      : [...cur, product.brand];
    setProfile(updatePreferences({ preferredBrands: next }));
  };

  const length =
    latestLengthMm != null
      ? splitLength(latestLengthMm, profile?.preferences.units ?? "mm")
      : null;

  return (
    <PageLayout withTopBar>
      <TopBar title="Product details" />

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-card-grad border border-white/5 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-surface-3 grid place-items-center overflow-hidden shrink-0">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.model}
                className="w-full h-full object-cover"
              />
            ) : (
              <ShoppingBag className="w-8 h-8 text-neon" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-ink-muted">
              {product.brand}
            </div>
            <h1 className="text-2xl font-extrabold font-display leading-tight">
              {product.model}
            </h1>
            <div className="mt-1 text-sm text-ink-muted">
              {CATEGORY_LABEL[product.category]} ·{" "}
              <span className="text-ink">${product.priceUsd.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-ink-muted leading-relaxed mt-4">
          {product.description}
        </p>
      </motion.section>

      {/* Fit summary tied to the latest scan */}
      <section className="space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-ink-muted">
          For your foot
        </div>
        {match ? (
          <div className="rounded-2xl bg-card-grad border border-white/5 p-5 flex items-center gap-4">
            <FitScoreRing label="Fit" percent={match.fitScore} />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ink-muted">Recommended size</div>
              <div className="text-2xl font-bold font-display">
                EU {match.recommendedEuSize}
              </div>
              <div className="text-xs text-lime mt-1">
                Comfort {match.comfortScore}%
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-card-grad border border-white/5 p-5 flex items-center gap-3">
            <Footprints className="w-5 h-5 text-ink-muted" />
            <div className="text-sm text-ink-muted">
              Scan your foot to see a personalised size for this shoe.
            </div>
          </div>
        )}
        {length ? (
          <p className="text-xs text-ink-muted">
            Based on your latest scan ({length.value} {length.unit} long).
          </p>
        ) : null}
      </section>

      {/* Spec strip */}
      <section className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <Spec
          icon={Ruler}
          label="EU size range"
          value={`${product.sizeRangeEu.min} – ${product.sizeRangeEu.max}`}
        />
        <Spec
          icon={Sparkles}
          label="Last / fit"
          value={fitTypeLabel(product.fitType)}
          hint={FIT_TYPE_DESCRIPTION[product.fitType]}
        />
        <Spec icon={Tag} label="Category" value={CATEGORY_LABEL[product.category]} />
        <Spec
          icon={Palette}
          label="Colourways"
          value={`${product.colorways.length} options`}
        />
      </section>

      {/* Colourways list */}
      <section className="rounded-2xl bg-card-grad border border-white/5 p-4">
        <div className="text-[10px] uppercase tracking-widest text-ink-muted mb-2">
          Available colours
        </div>
        <div className="flex flex-wrap gap-2">
          {product.colorways.map((c) => (
            <span
              key={c}
              className="px-3 py-1.5 rounded-full bg-surface-2 border border-white/5 text-xs text-ink"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      <div className="space-y-2">
        <PrimaryButton
          className="w-full"
          onClick={() =>
            window.open(productStoreUrl(product), "_blank", "noopener,noreferrer")
          }
          leadingIcon={<ShoppingBag className="w-5 h-5" />}
        >
          View in store
        </PrimaryButton>

        <button
          onClick={togglePreferred}
          className={`w-full h-12 rounded-full font-semibold inline-flex items-center justify-center gap-2 border transition-colors ${
            preferred
              ? "bg-coral/20 border-coral/40 text-coral"
              : "bg-surface-2 border-white/5 text-ink hover:bg-surface-3"
          }`}
        >
          {preferred ? (
            <>
              <Check className="w-4 h-4" />
              {product.brand} is in your favourites
            </>
          ) : (
            <>
              <Heart className="w-4 h-4" />
              Prefer {product.brand}
            </>
          )}
        </button>
        <p className="text-[11px] text-ink-muted text-center">
          Preferred brands rank higher in your future recommendations.
        </p>
      </div>

      <FitFeedback
        productId={product.productId}
        brand={product.brand}
        size={match ? String(match.recommendedEuSize) : undefined}
        sizeSystem="eu"
      />
    </PageLayout>
  );
}

function Spec({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-card-grad border border-white/5 p-3 space-y-1">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink-muted">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-sm font-semibold">{value}</div>
      {hint ? <div className="text-[11px] text-ink-muted">{hint}</div> : null}
    </div>
  );
}

function fitTypeLabel(fit: Product["fitType"]): string {
  return fit.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
