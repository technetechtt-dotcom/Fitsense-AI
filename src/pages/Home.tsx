import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Footprints,
  History,
  ScanLine,
  Settings as SettingsIcon,
  Sparkles,
  Store,
} from "lucide-react";
import { ConsentBanner } from "../components/ConsentBanner";
import { PageLayout } from "../components/PageLayout";
import { PrimaryButton } from "../components/PrimaryButton";
import { MeasurementCard } from "../components/MeasurementCard";
import { SectionHeader } from "../components/SectionHeader";
import { getOrCreateProfile, listScans } from "../lib/storage";
import { formatLength } from "../lib/format";
import type { ScanResult, UserProfile } from "../types";

export function Home() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scans, setScans] = useState<ScanResult[]>([]);

  useEffect(() => {
    setProfile(getOrCreateProfile());
    setScans(listScans());
  }, []);

  const displayName = profile?.displayName ?? "Guest";
  const units = profile?.preferences.units ?? "mm";
  const latestScanId = scans[0]?.scanId;
  const cachedLengthMm = profile?.cachedFootLengthMm;
  const greetingSubtitle =
    cachedLengthMm != null
      ? `Last measurement · ${formatLength(cachedLengthMm, units)}`
      : "Ready to scan?";

  return (
    <PageLayout gap="gap-6" className="!pt-[max(1.5rem,env(safe-area-inset-top))]">
      <ConsentBanner />

      {/* Greeting */}
      <header className="space-y-0.5 animate-fadeUp">
        <div className="text-sm text-ink-muted">Hello,</div>
        <h1 className="text-fluid-display font-extrabold font-display break-words">
          {displayName}
        </h1>
        <div className="text-sm text-neon">{greetingSubtitle}</div>
      </header>

      {/* Hero card */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="rounded-3xl p-5 sm:p-6 bg-hero-grad text-surface-0 shadow-glow space-y-4 overflow-hidden relative"
      >
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-6 -bottom-12 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="text-[11px] uppercase tracking-[0.2em] font-semibold relative">
          AR-powered foot sizing
        </div>
        <h2 className="text-fluid-hero font-black font-display relative leading-tight">
          Scan once.
          <br />
          Fit perfectly.
        </h2>
        <PrimaryButton
          className="w-full"
          onClick={() => nav("/scan")}
          variant="solid"
          leadingIcon={<ScanLine className="w-5 h-5 text-neon" />}
        >
          Start scan
        </PrimaryButton>
      </motion.section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
        <QuickAction
          icon={Brain}
          label="Fit profile"
          onClick={() => nav("/fit-profile")}
        />
        <QuickAction
          icon={Store}
          label="Recommendations"
          disabled={!latestScanId}
          onClick={() =>
            latestScanId && nav(`/recommendations/${latestScanId}`)
          }
        />
        <QuickAction
          icon={History}
          label="My measurements"
          onClick={() => nav("/measurements")}
        />
        <QuickAction
          icon={Sparkles}
          label="Integrations"
          onClick={() => nav("/integrations")}
        />
        <QuickAction
          icon={SettingsIcon}
          label="Settings"
          onClick={() => nav("/settings")}
          className="col-span-2 md:col-span-1"
        />
      </section>

      {/* Recent scans */}
      <section className="space-y-3">
        <SectionHeader title="Recent scans" />
        {scans.length === 0 ? (
          <button
            onClick={() => nav("/scan")}
            className="w-full rounded-2xl p-5 bg-card-grad border border-white/5 flex items-center gap-3 text-left hover:border-white/10"
          >
            <Footprints className="w-5 h-5 text-neon" />
            <span className="text-sm text-ink-muted">
              No scans yet — start your first measurement.
            </span>
          </button>
        ) : (
          <div className="space-y-3">
            {scans.slice(0, 5).map((scan, i) => (
              <MeasurementCard
                key={scan.scanId}
                scan={scan}
                index={i}
                units={units}
                onClick={() => nav(`/results/${scan.scanId}`)}
              />
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}

interface QuickProps {
  icon: typeof History;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  className = "",
}: QuickProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl min-h-[6.5rem] sm:h-28 p-3 flex flex-col justify-between bg-card-grad border border-white/5 text-left hover:border-white/10 disabled:opacity-40 disabled:hover:border-white/5 ${className}`}
    >
      <span className="w-9 h-9 rounded-xl bg-surface-3 grid place-items-center">
        <Icon className="w-4 h-4 text-neon" />
      </span>
      <span className="text-xs font-semibold leading-snug">{label}</span>
    </button>
  );
}
