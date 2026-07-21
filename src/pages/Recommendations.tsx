import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Brain, ClipboardCheck } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { StatTile } from "../components/StatTile";
import { ShoeCard } from "../components/ShoeCard";
import { Loading } from "../components/Loading";
import { ErrorState } from "../components/ErrorState";
import { FitFeedback } from "../components/FitFeedback";
import { SHOE_CATALOG } from "../data/catalog";
import {
  buildBrandSizeSheet,
  recommend,
  type BrandSizeRow,
} from "../lib/recommendation";
import { getOrCreateProfile, getScan } from "../lib/storage";
import { getOrCreateFitProfile } from "../lib/fitProfile";
import { primaryFoot } from "../types";
import type { FitProfile, ScanResult, SizeRecommendation, UserProfile } from "../types";

export function Recommendations() {
  const { scanId = "" } = useParams();
  const nav = useNavigate();
  const [scan, setScan] = useState<ScanResult | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fitProfile, setFitProfile] = useState<FitProfile | null>(null);

  useEffect(() => {
    setScan(getScan(scanId) ?? null);
    setProfile(getOrCreateProfile());
    setFitProfile(getOrCreateFitProfile());
  }, [scanId]);

  // Recompute recommendations fresh from the latest catalog every render —
  // catches catalogue updates and freshly-logged events without forcing a
  // re-scan.
  const rec: SizeRecommendation | null = useMemo(() => {
    if (!scan || !fitProfile) return null;
    const foot = primaryFoot(scan);
    if (!foot) return null;
    return recommend(foot, SHOE_CATALOG, {
      preferredBrands: profile?.preferences.preferredBrands,
      profile: fitProfile,
    });
  }, [scan, profile, fitProfile]);

  const sheet: BrandSizeRow[] = useMemo(() => {
    if (!scan || !fitProfile) return [];
    const foot = primaryFoot(scan);
    if (!foot) return [];
    return buildBrandSizeSheet(foot, { profile: fitProfile });
  }, [scan, fitProfile]);

  if (scan === undefined) return <Loading label="Crunching numbers…" />;
  if (scan === null || !rec) {
    return (
      <ErrorState
        message="No measurement to recommend against."
        onRetry={() => nav("/home")}
      />
    );
  }

  const learnedFromCount = Object.keys(
    fitProfile?.insights?.brandConfidence ?? {},
  ).length;

  return (
    <PageLayout withTopBar gap="gap-4">
      <TopBar title="Recommended for you" />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile label="UK" value={rec.uk} accent />
        <StatTile label="US" value={rec.us} accent />
        <StatTile label="EU" value={rec.eu} accent />
      </div>

      {learnedFromCount > 0 ? (
        <div className="rounded-2xl bg-lime/10 border border-lime/30 px-4 py-3 text-xs text-lime flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span>
            Personalised by {learnedFromCount} brand
            {learnedFromCount === 1 ? "" : "s"} you've tried.
          </span>
          <button
            onClick={() => nav("/fit-profile")}
            className="ml-auto text-[11px] underline-offset-2 hover:underline"
          >
            Open profile
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-surface-2 border border-white/8 px-4 py-3 text-xs text-ink-muted flex items-center gap-2">
          <Brain className="w-4 h-4 text-neon" />
          <span>
            Rate or return the shoes you try — your recommendations get smarter every
            time.
          </span>
          <button
            onClick={() => nav("/fit-profile")}
            className="ml-auto text-[11px] text-neon hover:underline"
          >
            View profile
          </button>
        </div>
      )}

      {sheet.length > 0 ? (
        <section className="rounded-2xl bg-card-grad border border-white/8 p-4 space-y-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink-muted">
            <ClipboardCheck className="w-3.5 h-3.5" />
            Your size in every brand
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sheet.slice(0, 6).map((r) => (
              <span
                key={r.brand}
                className="px-2.5 py-1 rounded-full bg-surface-2 text-[11px] border border-white/8"
              >
                <span className="text-ink-muted">{r.brand}</span>{" "}
                <span className="font-semibold">UK {r.uk}</span>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {rec.matches.length === 0 ? (
        <div className="text-sm text-ink-muted py-8 text-center">
          No products match your size yet — try a re-scan.
        </div>
      ) : (
        <div className="space-y-3">
          {rec.matches.map((m, i) => (
            <div key={m.productId} className="space-y-1.5">
              <ShoeCard
                match={m}
                index={i}
                onClick={() => nav(`/products/${m.productId}`)}
              />
              <FitFeedback
                productId={m.productId}
                brand={m.brand}
                size={String(m.recommendedEuSize)}
                sizeSystem="eu"
                compact
              />
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
