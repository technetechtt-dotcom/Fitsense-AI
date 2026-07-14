import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  Cake,
  Check,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Download,
  Footprints,
  History,
  Lightbulb,
  Ruler,
  Share2,
  Sparkles,
  Upload,
} from "lucide-react";
import { PageLayout, StickyPageHeader } from "../components/PageLayout";
import { PrimaryButton } from "../components/PrimaryButton";
import {
  getOrCreateFitProfile,
  listFitEvents,
  persistInsights,
  removeFitEvent,
  saveFitProfile,
  updateFitProfile,
} from "../lib/fitProfile";
import { deriveInsights } from "../lib/fitLearning";
import {
  buildBrandSizeSheet,
  type BrandSizeRow,
} from "../lib/recommendation";
import {
  exportFitToken,
  importFitToken,
} from "../lib/portableFitIdentity";
import { getOrCreateProfile } from "../lib/storage";
import { formatLength, splitLength } from "../lib/format";
import {
  COMFORT_HEADROOM_MM,
  type ArchHeight,
  type ComfortFit,
  type FitDimension,
  type FitEvent,
  type FitProfile,
  type MidsoleFeel,
  type ToeShape,
  type WidthClass,
} from "../types";

/**
 * The Fit Profile screen — the user-facing surface of the Portable Fit
 * Identity.
 *
 * Four sections:
 *
 *   1. Foot profile card (Length / Width / Arch / Toe / Asymmetry / Comfort).
 *      Editable inline so the user can correct anything the scanner inferred.
 *
 *   2. Brand cheat sheet — same foot, many brands, different sizes. Brings
 *      the "Nike UK 8, Adidas UK 8.5, Puma UK 9" promise to life.
 *
 *   3. AI insights — what the system has learned from purchases / returns /
 *      ratings / wear feedback, with confidence dampener when there are
 *      too few events to be reliable.
 *
 *   4. Portable identity — export the profile as a compact token (also
 *      rendered as copyable text) and import another device's token.
 */
export function FitProfile() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<FitProfile>(() =>
    getOrCreateFitProfile(),
  );
  const [events, setEvents] = useState<FitEvent[]>(() => listFitEvents());

  // Recompute insights whenever events change.
  useEffect(() => {
    const insights = deriveInsights(profile, events);
    if (
      JSON.stringify(insights) !== JSON.stringify(profile.insights)
    ) {
      const next = persistInsights(insights);
      setProfile(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  const units = useMemo(
    () => getOrCreateProfile().preferences.units,
    [],
  );

  const onPatch = (patch: Partial<FitProfile>) => {
    setProfile(updateFitProfile(patch));
  };

  const sheet: BrandSizeRow[] = useMemo(() => {
    if (!profile.lengthMm) return [];
    return buildBrandSizeSheet(
      {
        lengthMm: profile.lengthMm,
        widthMm: profile.widthMm ?? profile.lengthMm * 0.38,
        confidence: 1,
        foot: "right",
        calibration: "a4_paper",
        pixelsPerMm: 0,
      },
      { profile },
    );
  }, [profile]);

  return (
    <PageLayout gap="gap-0" className="!pb-0">
      <StickyPageHeader>
        <button
          onClick={() => nav(-1)}
          className="touch-target w-9 h-9 rounded-full grid place-items-center hover:bg-ink-dim/20 shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold leading-tight">Fit profile</h1>
          <p className="text-xs text-ink-muted line-clamp-2 sm:line-clamp-none">
            Your portable fit identity. Learns from every scan and purchase.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neon/15 border border-neon/35 text-[10px] uppercase tracking-widest text-neon shrink-0">
          <Sparkles className="w-3 h-3" />
          v{profile.version}
        </span>
      </StickyPageHeader>

      <div className="pt-5 space-y-5 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <FootProfileCard profile={profile} units={units} onPatch={onPatch} />
        {profile.lengthMm ? (
          <BrandCheatSheet rows={sheet} />
        ) : (
          <EmptyScanPrompt onScan={() => nav("/scan")} />
        )}
        <InsightCard profile={profile} events={events} />
        <BrandFitSignatureCard profile={profile} />
        <ReplacementCard profile={profile} />
        <HistoryCard
          events={events}
          onClearOne={(id) => {
            removeFitEvent(id);
            setEvents(listFitEvents());
          }}
        />
        <PortableSection profile={profile} onImport={setProfile} />
      </div>
    </PageLayout>
  );
}

// ─── Foot profile card ──────────────────────────────────────────────────

function FootProfileCard({
  profile,
  units,
  onPatch,
}: {
  profile: FitProfile;
  units: "mm" | "in";
  onPatch: (patch: Partial<FitProfile>) => void;
}) {
  const length = profile.lengthMm
    ? splitLength(profile.lengthMm, units)
    : { value: "—", unit: units };
  return (
    <section className="rounded-3xl bg-card-grad border border-white/8 p-5 space-y-5">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-neon/15 grid place-items-center">
          <Footprints className="w-5 h-5 text-neon" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-base">Foot profile</h2>
          <p className="text-xs text-ink-muted">
            Adjust anything we got wrong — the recommendation engine
            picks it up instantly.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <StatBlock
          label="Length"
          value={length.value}
          unit={length.unit}
          icon={<Ruler className="w-4 h-4 text-neon" />}
        />
        <StatBlock
          label="Width"
          value={
            profile.widthMm ? splitLength(profile.widthMm, units).value : "—"
          }
          unit={profile.widthMm ? splitLength(profile.widthMm, units).unit : ""}
          icon={<Ruler className="w-4 h-4 text-lime rotate-90" />}
        />
      </div>

      <FieldRow label="Width class">
        <Picker<WidthClass>
          value={profile.widthClass}
          options={[
            { id: "narrow", label: "Narrow" },
            { id: "regular", label: "Regular" },
            { id: "wide", label: "Wide" },
            { id: "extra_wide", label: "Extra wide" },
          ]}
          onChange={(v) => onPatch({ widthClass: v })}
        />
      </FieldRow>

      <FieldRow label="Arch">
        <Picker<ArchHeight>
          value={profile.archHeight}
          options={[
            { id: "low", label: "Low" },
            { id: "medium", label: "Medium" },
            { id: "high", label: "High" },
            { id: "unknown", label: "Not sure" },
          ]}
          onChange={(v) => onPatch({ archHeight: v })}
        />
      </FieldRow>

      <FieldRow label="Toe shape">
        <Picker<ToeShape>
          value={profile.toeShape}
          options={[
            { id: "egyptian", label: "Egyptian" },
            { id: "greek", label: "Greek" },
            { id: "roman", label: "Roman" },
            { id: "square", label: "Square" },
            { id: "rounded", label: "Rounded" },
            { id: "unknown", label: "—" },
          ]}
          onChange={(v) => onPatch({ toeShape: v })}
        />
      </FieldRow>

      <FieldRow label="Comfort">
        <Picker<ComfortFit>
          value={profile.comfortFit}
          options={[
            {
              id: "snug",
              label: `Snug (+${COMFORT_HEADROOM_MM.snug} mm)`,
            },
            {
              id: "standard",
              label: `Standard (+${COMFORT_HEADROOM_MM.standard} mm)`,
            },
            {
              id: "relaxed",
              label: `Relaxed (+${COMFORT_HEADROOM_MM.relaxed} mm)`,
            },
          ]}
          onChange={(v) => onPatch({ comfortFit: v })}
        />
      </FieldRow>

      <FieldRow label="Midsole feel">
        <Picker<MidsoleFeel>
          value={profile.preferredMidsoleFeel}
          options={[
            { id: "firm", label: "Firm" },
            { id: "balanced", label: "Balanced" },
            { id: "soft", label: "Soft" },
            { id: "unknown", label: "No preference" },
          ]}
          onChange={(v) => onPatch({ preferredMidsoleFeel: v })}
        />
      </FieldRow>

      {profile.asymmetryMm !== undefined &&
      Math.abs(profile.asymmetryMm) > 1 ? (
        <p className="text-[11px] text-ink-muted leading-relaxed">
          <span className="text-ink">Asymmetry:</span>{" "}
          {profile.asymmetryMm > 0 ? "Left" : "Right"} foot is{" "}
          {formatLength(Math.abs(profile.asymmetryMm), units)} longer — we
          recommend sizing to the larger foot.
        </p>
      ) : null}

      <details className="text-xs text-ink-muted">
        <summary className="cursor-pointer inline-flex items-center gap-1 hover:text-ink">
          <Cake className="w-3.5 h-3.5" />
          Add birth year (optional, enables growth tracking)
        </summary>
        <input
          type="number"
          placeholder="e.g. 2014 for an 11-year-old"
          defaultValue={profile.birthYear ?? ""}
          min={1900}
          max={2100}
          className="mt-2 w-full px-3 py-2 rounded-xl bg-surface-2 border border-white/5 text-sm text-ink"
          onBlur={(e) => {
            const n = parseInt(e.currentTarget.value, 10);
            onPatch({
              birthYear: Number.isFinite(n) && n > 1900 ? n : undefined,
            });
          }}
        />
      </details>
    </section>
  );
}

function StatBlock({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface-2 border border-white/5 p-4 space-y-1">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold leading-none">
        {value} <span className="text-sm text-ink-muted font-medium">{unit}</span>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-ink-muted shrink-0 w-24">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function Picker<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-end">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`text-xs px-2.5 py-1.5 rounded-full font-medium transition-colors ${
              active
                ? "bg-neon text-surface-0"
                : "bg-surface-2 border border-white/8 text-ink-soft hover:border-white/20"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Brand cheat sheet ─────────────────────────────────────────────────

function BrandCheatSheet({ rows }: { rows: BrandSizeRow[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="rounded-3xl bg-card-grad border border-white/8 p-5 space-y-3">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet/15 grid place-items-center">
          <ClipboardCheck className="w-5 h-5 text-violet" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-base">Same foot, different brands</h2>
          <p className="text-xs text-ink-muted">
            Brands fit differently. Here's your size in each.
          </p>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-1.5">
        {rows.map((r) => (
          <div
            key={r.brand}
            className="rounded-2xl bg-surface-2 border border-white/5 px-3.5 py-3 grid grid-cols-[1fr_auto_auto] gap-3 items-center"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{r.brand}</div>
              <div className="text-[11px] text-ink-muted truncate">
                {r.note}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-ink-muted">
                UK / EU
              </div>
              <div className="text-sm font-bold tabular-nums">
                {r.uk} <span className="text-ink-muted">/</span> {r.eu}
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-block text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  r.toeBoxWidth === "wide" || r.toeBoxWidth === "extra_wide"
                    ? "bg-lime/15 text-lime border border-lime/30"
                    : r.toeBoxWidth === "narrow"
                    ? "bg-coral/15 text-coral border border-coral/30"
                    : "bg-ink-dim/30 text-ink-soft border border-white/10"
                }`}
              >
                {r.toeBoxWidth.replace("_", " ")} toe
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyScanPrompt({ onScan }: { onScan: () => void }) {
  return (
    <section className="rounded-3xl bg-card-grad border border-white/8 p-5 text-center space-y-3">
      <Footprints className="w-8 h-8 text-neon mx-auto" />
      <h2 className="font-bold">Scan to build your brand cheat sheet</h2>
      <p className="text-xs text-ink-muted">
        Once you've measured your foot we'll show your size in every brand
        in the catalog.
      </p>
      <PrimaryButton onClick={onScan} className="w-full">
        Start a scan
      </PrimaryButton>
    </section>
  );
}

// ─── AI insights ────────────────────────────────────────────────────────

function InsightCard({
  profile,
  events,
}: {
  profile: FitProfile;
  events: FitEvent[];
}) {
  const insights = profile.insights;
  const eventCount = events.length;
  const learnedBrands = insights
    ? Object.entries(insights.brandConfidence).sort(
        ([, a], [, b]) => b - a,
      )
    : [];
  return (
    <section className="rounded-3xl bg-card-grad border border-white/8 p-5 space-y-3">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-lime/15 grid place-items-center">
          <Brain className="w-5 h-5 text-lime" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-base">What we've learned</h2>
          <p className="text-xs text-ink-muted">
            {eventCount === 0
              ? "No history yet — buy / rate / return shoes and the AI will start tuning your recommendations."
              : `From ${eventCount} signal${eventCount === 1 ? "" : "s"} so far.`}
          </p>
        </div>
      </header>

      {insights ? (
        <div className="grid grid-cols-2 gap-2">
          <InsightTile
            label="Tightness shift"
            value={
              insights.meanTightness === 0
                ? "Neutral"
                : insights.meanTightness > 0
                ? `+${insights.meanTightness.toFixed(1)} (looser)`
                : `${insights.meanTightness.toFixed(1)} (tighter)`
            }
            icon={<Lightbulb className="w-3.5 h-3.5" />}
          />
          <InsightTile
            label="Returns (12mo)"
            value={String(insights.returnCount)}
          />
          <InsightTile
            label="Toe-box pref"
            value={insights.prefersWiderToeBox ? "Prefers wider" : "Standard"}
          />
          <InsightTile
            label="Midsole pref"
            value={insights.prefersSofterMidsole ? "Prefers softer" : "Balanced"}
          />
        </div>
      ) : null}

      {learnedBrands.length > 0 ? (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-muted mb-1.5">
            Brand confidence
          </div>
          <div className="space-y-1.5">
            {learnedBrands.slice(0, 6).map(([brand, conf]) => (
              <div key={brand} className="flex items-center gap-2 text-xs">
                <span className="capitalize w-24 truncate">{brand}</span>
                <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden relative">
                  <div
                    className={`absolute top-0 bottom-0 ${
                      conf >= 0 ? "bg-lime" : "bg-coral"
                    }`}
                    style={{
                      left: conf >= 0 ? "50%" : `${50 + conf * 50}%`,
                      width: `${Math.abs(conf) * 50}%`,
                    }}
                  />
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
                </div>
                <span className="w-10 text-right tabular-nums text-ink-muted">
                  {conf >= 0 ? "+" : ""}
                  {(conf * 100).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function InsightTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface-2 border border-white/5 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ink-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

// ─── Brand fit signature ──────────────────────────────────────────────

const DIMENSION_LABEL: Record<FitDimension, string> = {
  size: "size",
  length: "length",
  width: "width",
  toeBox: "toe-box",
  heel: "heel",
  arch: "arch",
  instep: "instep",
};

/**
 * Human-readable "Nike runs short for you" / "Adidas felt narrow" copy
 * derived from the −2..+2 mean for a single dimension on a single brand.
 */
function describeDimensionTrend(
  dim: FitDimension,
  avg: number,
): { label: string; tone: "lime" | "coral" | "muted" } {
  const dir = avg < 0 ? "neg" : avg > 0 ? "pos" : "neutral";
  const magnitude = Math.abs(avg);
  if (magnitude < 0.4) return { label: "spot on", tone: "lime" };
  const intensity = magnitude >= 1.4 ? "very" : magnitude >= 0.8 ? "" : "a bit";
  const join = (...parts: string[]) => parts.filter(Boolean).join(" ");
  switch (dim) {
    case "size":
    case "length":
      return {
        label: join(intensity, dir === "neg" ? "short" : "long"),
        tone: "coral",
      };
    case "width":
    case "toeBox":
      return {
        label: join(intensity, dir === "neg" ? "narrow" : "wide"),
        tone: "coral",
      };
    case "heel":
      return {
        label: join(intensity, dir === "neg" ? "slips" : "tight"),
        tone: "coral",
      };
    case "arch":
      return {
        label: join(intensity, dir === "neg" ? "flat" : "high"),
        tone: "coral",
      };
    case "instep":
      return {
        label: join(intensity, dir === "neg" ? "tight" : "loose"),
        tone: "coral",
      };
  }
}

function BrandFitSignatureCard({ profile }: { profile: FitProfile }) {
  const sig = profile.insights?.brandFitSignature ?? {};
  const counts = profile.insights?.brandFitSampleCount ?? {};
  const brands = Object.entries(sig).sort(
    ([a], [b]) => (counts[b] ?? 0) - (counts[a] ?? 0) || a.localeCompare(b),
  );
  if (brands.length === 0) return null;
  return (
    <section className="rounded-3xl bg-card-grad border border-white/8 p-5 space-y-3">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-neon/15 grid place-items-center">
          <Ruler className="w-5 h-5 text-neon" />
        </div>
        <div>
          <h2 className="font-bold text-base">Learned brand fit</h2>
          <p className="text-xs text-ink-muted">
            How each brand has historically fit you. Drives per-brand size
            corrections automatically.
          </p>
        </div>
      </header>
      <div className="space-y-2">
        {brands.map(([brand, dims]) => {
          const n = counts[brand] ?? 0;
          const entries: Array<[FitDimension, number]> = [];
          for (const [rawDim, v] of Object.entries(dims)) {
            if (typeof v === "number") {
              entries.push([rawDim as FitDimension, v]);
            }
          }
          if (entries.length === 0) return null;
          return (
            <div
              key={brand}
              className="rounded-2xl bg-surface-2 border border-white/5 px-3.5 py-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold capitalize">{brand}</div>
                <div className="text-[10px] uppercase tracking-widest text-ink-muted">
                  {n} rating{n === 1 ? "" : "s"}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entries.map(([dim, avg]) => {
                  const t = describeDimensionTrend(dim, avg);
                  const tone =
                    t.tone === "lime"
                      ? "bg-lime/15 text-lime border-lime/30"
                      : t.tone === "coral"
                      ? "bg-coral/15 text-coral border-coral/30"
                      : "bg-ink-dim/30 text-ink-soft border-white/10";
                  return (
                    <span
                      key={dim}
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${tone}`}
                    >
                      <span className="text-ink-muted">
                        {DIMENSION_LABEL[dim]}
                      </span>
                      <span className="font-semibold">{t.label}</span>
                      <span className="text-ink-muted tabular-nums">
                        {avg > 0 ? "+" : ""}
                        {avg.toFixed(1)}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Replacement timing ────────────────────────────────────────────────

function ReplacementCard({ profile }: { profile: FitProfile }) {
  const hints = profile.insights?.replacementHints ?? [];
  const projected = profile.insights?.projectedLengthMm;
  if (hints.length === 0 && projected === undefined) return null;
  return (
    <section className="rounded-3xl bg-card-grad border border-white/8 p-5 space-y-3">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet/15 grid place-items-center">
          <ChevronRight className="w-5 h-5 text-violet" />
        </div>
        <div>
          <h2 className="font-bold text-base">What's next</h2>
          <p className="text-xs text-ink-muted">
            Predictions powered by your purchase + scan history.
          </p>
        </div>
      </header>
      {projected !== undefined ? (
        <div className="rounded-2xl bg-surface-2 border border-white/5 p-3 text-xs">
          <span className="text-ink-muted">Projected foot length in 6 months:</span>{" "}
          <span className="font-semibold">{projected.toFixed(1)} mm</span>
          <p className="text-[11px] text-ink-muted mt-1">
            Children's feet grow ≈ 1.5 sizes per year. Buying a half-size up
            now usually buys 3–4 months extra wear.
          </p>
        </div>
      ) : null}
      {hints.map((h, i) => (
        <div
          key={i}
          className="rounded-2xl bg-surface-2 border border-white/5 p-3 text-xs"
        >
          <span className="text-ink-muted capitalize">{h.category}</span>{" "}
          replacement:{" "}
          <span className="font-semibold">
            {new Date(h.nextReplacementEpochMs).toLocaleDateString()}
          </span>
          <p className="text-[11px] text-ink-muted mt-1">{h.reason}</p>
        </div>
      ))}
    </section>
  );
}

// ─── Event history ─────────────────────────────────────────────────────

function HistoryCard({
  events,
  onClearOne,
}: {
  events: FitEvent[];
  onClearOne: (id: string) => void;
}) {
  if (events.length === 0) return null;
  return (
    <section className="rounded-3xl bg-card-grad border border-white/8 p-5 space-y-3">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-ink-dim/40 grid place-items-center">
          <History className="w-5 h-5 text-ink-soft" />
        </div>
        <div>
          <h2 className="font-bold text-base">Signal history</h2>
          <p className="text-xs text-ink-muted">
            Every event the engine has learned from.
          </p>
        </div>
      </header>
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {events.slice(0, 30).map((e) => (
          <div
            key={e.eventId}
            className="rounded-xl bg-surface-2 border border-white/5 px-3 py-2 text-xs flex items-center gap-2"
          >
            <span className="w-16 shrink-0 text-ink-muted">
              {new Date(e.epochMs).toLocaleDateString()}
            </span>
            <span className="flex-1 truncate">{describeEvent(e)}</span>
            <button
              onClick={() => onClearOne(e.eventId)}
              className="text-ink-muted hover:text-coral text-[10px]"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function describeEvent(e: FitEvent): string {
  switch (e.kind) {
    case "scan":
      return `Scanned — ${e.lengthMm.toFixed(1)} mm`;
    case "purchase":
      return `Bought ${e.brand} (size ${e.size} ${e.sizeSystem.toUpperCase()})`;
    case "return":
      return `Returned ${e.brand} — ${e.reason.replace(/_/g, " ")}`;
    case "rating":
      return `Rated ${e.brand} ${"★".repeat(e.stars)}${"☆".repeat(5 - e.stars)}`;
    case "fit_rating": {
      const parts: string[] = [];
      for (const [rawDim, score] of Object.entries(e.dimensions)) {
        if (typeof score !== "number") continue;
        const dim = rawDim as FitDimension;
        const t = describeDimensionTrend(dim, score);
        parts.push(`${DIMENSION_LABEL[dim]} ${t.label}`);
      }
      const body = parts.length ? parts.join(", ") : "no axes scored";
      return `Fit-rated ${e.brand} — ${body}`;
    }
    case "wear":
      return `Wear feedback for ${e.brand} (${
        e.tightnessDelta > 0 ? "loose" : e.tightnessDelta < 0 ? "tight" : "good"
      })`;
    case "apply":
      return `Applied ${e.brand} (size ${e.size} ${e.sizeSystem.toUpperCase()})`;
  }
}

// ─── Portable identity ─────────────────────────────────────────────────

function PortableSection({
  profile,
  onImport,
}: {
  profile: FitProfile;
  onImport: (p: FitProfile) => void;
}) {
  const token = useMemo(() => exportFitToken(profile), [profile]);
  const [copied, setCopied] = useState(false);
  const [importValue, setImportValue] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard failures
    }
  };

  const doImport = () => {
    const userId = getOrCreateProfile().userId;
    const imported = importFitToken(importValue.trim(), userId);
    if (!imported) {
      setImportError("That doesn't look like a FitSense token.");
      return;
    }
    const saved = saveFitProfile(imported);
    onImport(saved);
    setImportError(null);
    setImportValue("");
  };

  return (
    <section className="rounded-3xl bg-card-grad border border-white/8 p-5 space-y-4">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-neon/15 grid place-items-center">
          <Share2 className="w-5 h-5 text-neon" />
        </div>
        <div>
          <h2 className="font-bold text-base">Portable fit identity</h2>
          <p className="text-xs text-ink-muted">
            Take your profile to any FitSense-enabled store — no re-scan
            needed.
          </p>
        </div>
      </header>

      <div className="rounded-2xl bg-surface-2 border border-white/5 p-3 space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-ink-muted flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" />
          Your token
        </div>
        <div
          className="text-[11px] font-mono text-ink break-all bg-black/30 rounded-xl px-3 py-2 max-h-24 overflow-y-auto"
          aria-label="Fit identity token"
        >
          {token}
        </div>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-surface-3 text-xs font-semibold hover:bg-ink-dim/30"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-lime" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-2 border border-white/5 p-3 space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-ink-muted flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" />
          Import from another device
        </div>
        <input
          value={importValue}
          onChange={(e) => setImportValue(e.target.value)}
          placeholder="FSP1.…"
          className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-black/30 border border-white/8 focus:outline-none focus:border-neon/40"
        />
        {importError ? (
          <p className="text-[11px] text-coral">{importError}</p>
        ) : null}
        <button
          onClick={doImport}
          disabled={importValue.trim().length === 0}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neon/15 text-neon text-xs font-semibold hover:bg-neon/25 disabled:opacity-40"
        >
          Import token
        </button>
      </div>
    </section>
  );
}
