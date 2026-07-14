import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { StatTile } from "../components/StatTile";
import { FitScoreRing } from "../components/FitScoreRing";
import { PrimaryButton } from "../components/PrimaryButton";
import { Loading } from "../components/Loading";
import { ErrorState } from "../components/ErrorState";
import { CALIBRATION_META, isWide, primaryFoot } from "../types";
import type { ScanResult, UserProfile } from "../types";
import { getOrCreateProfile, getScan } from "../lib/storage";
import { splitLength } from "../lib/format";

export function Results() {
  const { scanId = "" } = useParams();
  const nav = useNavigate();
  const [scan, setScan] = useState<ScanResult | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setScan(getScan(scanId) ?? null);
    setProfile(getOrCreateProfile());
  }, [scanId]);

  if (scan === undefined) return <Loading label="Loading scan…" />;
  if (scan === null) {
    return (
      <ErrorState
        message="We couldn't find that scan."
        onRetry={() => nav("/home")}
      />
    );
  }

  const foot = primaryFoot(scan);
  const rec = scan.recommendation;
  const units = profile?.preferences.units ?? "mm";
  const length = foot ? splitLength(foot.lengthMm, units) : null;
  const width = foot ? splitLength(foot.widthMm, units) : null;

  return (
    <PageLayout withTopBar>
      <TopBar title="Scan results" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-2 gap-3"
      >
        <StatTile
          label="Length"
          value={length?.value ?? "—"}
          unit={length?.unit}
        />
        <StatTile
          label="Width"
          value={width?.value ?? "—"}
          unit={width?.unit}
        />
      </motion.div>

      {rec ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="grid grid-cols-3 gap-2 sm:gap-3"
        >
          <StatTile label="UK" value={rec.uk} accent />
          <StatTile label="US" value={rec.us} accent />
          <StatTile label="EU" value={rec.eu} accent />
        </motion.div>
      ) : null}

      {foot ? (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl bg-card-grad border border-white/5 p-4 flex flex-col xs:flex-row items-center gap-4 sm:gap-5"
        >
          <FitScoreRing
            label="confidence"
            percent={Math.round(foot.confidence * 100)}
          />
          <div className="space-y-1 flex-1 text-sm">
            {isWide(foot) ? (
              <div className="flex items-center gap-1.5 text-lime font-semibold">
                <Zap className="w-4 h-4" />
                Wide-foot detected
              </div>
            ) : null}
            <div className="text-ink-muted">
              Confidence: {Math.round(foot.confidence * 100)}%
            </div>
            <div className="text-ink-muted">
              Calibration: {CALIBRATION_META[foot.calibration].label}
            </div>
            <div className="text-ink-muted">
              {scan.arcoreUsed ? "ARCore-assisted" : "Reference-card scan"}
            </div>
          </div>
        </motion.section>
      ) : null}

      <div className="flex-1" />

      <div className="space-y-3">
        <PrimaryButton
          className="w-full"
          onClick={() => nav(`/recommendations/${scan.scanId}`)}
        >
          See matching shoes
        </PrimaryButton>
        <button
          onClick={() => nav("/scan")}
          className="w-full h-12 rounded-full border border-white/10 text-sm font-semibold hover:bg-surface-2"
        >
          Re-scan
        </button>
      </div>
    </PageLayout>
  );
}
