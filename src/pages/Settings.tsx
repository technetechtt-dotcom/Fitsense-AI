import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { DataConsentCard } from "../components/DataConsentCard";
import { hasCloudSyncConsent } from "../lib/consent";
import { restoreFromCloud } from "../lib/cloud/restore";
import { ApiConnectionStatus } from "../components/ApiConnectionStatus";
import { canUseCloudSync, isApiConfigured } from "../lib/api/config";
import { getOrCreateProfile, signOut, updatePreferences } from "../lib/storage";
import { signOutCloudAccount } from "../lib/cloud/auth";
import { SHOE_CATALOG } from "../data/catalog";
import type { CalibrationReference, MeasurementUnit, UserProfile } from "../types";
import { CALIBRATION_META } from "../types";

export function Settings() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    setProfile(getOrCreateProfile());
  }, []);

  // Distinct brand list from the catalog — used for the brand-preference chips.
  const brands = useMemo(
    () => Array.from(new Set(SHOE_CATALOG.map((p) => p.brand))).sort(),
    [],
  );

  if (!profile) return null;
  const prefs = profile.preferences;

  const setUnits = (units: MeasurementUnit) => setProfile(updatePreferences({ units }));
  const setCalibration = (ref: CalibrationReference) =>
    setProfile(updatePreferences({ defaultCalibration: ref }));
  const toggleBrand = (brand: string) => {
    const lc = brand.toLowerCase();
    const next = prefs.preferredBrands.some((b) => b.toLowerCase() === lc)
      ? prefs.preferredBrands.filter((b) => b.toLowerCase() !== lc)
      : [...prefs.preferredBrands, brand];
    setProfile(updatePreferences({ preferredBrands: next }));
  };

  return (
    <PageLayout withTopBar>
      <TopBar title="Settings" />

      <Section label="Account">
        <div className="text-base font-semibold">
          {profile.displayName ?? profile.email ?? "Guest"}
        </div>
        <div className="text-sm text-ink-muted">
          {profile.isAnonymous
            ? "Guest on this device"
            : (profile.email ?? "Signed in")}
        </div>
        <button
          onClick={() => nav("/fit-profile")}
          className="mt-3 w-full rounded-2xl bg-surface-2 border border-white/5 px-4 py-3 text-left flex items-center justify-between hover:bg-surface-3"
        >
          <div>
            <div className="text-sm font-semibold">Fit profile</div>
            <div className="text-xs text-ink-muted">
              View geometry, AI insights & portable identity token
            </div>
          </div>
          <span className="text-neon text-xs">Open →</span>
        </button>
      </Section>

      <Section label="Measurement units">
        <div className="flex gap-2">
          <Chip
            active={prefs.units === "mm"}
            label="Millimetres"
            onClick={() => setUnits("mm")}
          />
          <Chip
            active={prefs.units === "in"}
            label="Inches"
            onClick={() => setUnits("in")}
          />
        </div>
      </Section>

      <Section label="Default calibration">
        <div className="flex flex-wrap gap-2">
          {(["arcore_plane", "a4_paper", "credit_card"] as CalibrationReference[]).map(
            (ref) => (
              <Chip
                key={ref}
                active={prefs.defaultCalibration === ref}
                label={CALIBRATION_META[ref].label}
                onClick={() => setCalibration(ref)}
              />
            ),
          )}
        </div>
      </Section>

      <Section label="Preferred brands">
        <p className="text-xs text-ink-muted -mt-1">
          Tap a brand to give its shoes a boost in your recommendations.
        </p>
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => {
            const active = prefs.preferredBrands.some(
              (x) => x.toLowerCase() === b.toLowerCase(),
            );
            return (
              <Chip key={b} active={active} label={b} onClick={() => toggleBrand(b)} />
            );
          })}
        </div>
      </Section>

      {import.meta.env.DEV ? (
        <Section label="Experimental measurement">
          <label className="flex items-start justify-between gap-3 cursor-pointer">
            <span>
              <span className="block text-sm">
                Unvalidated seated-scan estimate (+4 mm)
              </span>
              <span className="block text-xs text-ink-muted mt-0.5">
                Development only. Valid production scans are standing, weight-bearing
                and add no population-average offset.
              </span>
            </span>
            <input
              type="checkbox"
              checked={prefs.applyHeelPadOffset}
              onChange={() =>
                setProfile(
                  updatePreferences({
                    applyHeelPadOffset: !prefs.applyHeelPadOffset,
                  }),
                )
              }
              className="accent-neon w-5 h-5 mt-0.5"
            />
          </label>
        </Section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-[10px] uppercase tracking-widest text-ink-muted">
          Privacy
        </h2>
        <DataConsentCard />
      </section>

      {isApiConfigured() ? (
        <Section label="API connection">
          <ApiConnectionStatus />
        </Section>
      ) : null}

      {canUseCloudSync() && hasCloudSyncConsent() ? (
        <Section label="Cloud backup">
          <p className="text-xs text-ink-muted leading-relaxed">
            Pull scans, fit profile, and events from your cloud account onto this
            device.
            {isApiConfigured()
              ? " Sync goes through the FitSense API when configured."
              : ""}
          </p>
          <button
            type="button"
            disabled={restoring}
            onClick={async () => {
              setRestoring(true);
              setRestoreMsg(null);
              const res = await restoreFromCloud();
              setRestoreMsg(res.message);
              setRestoring(false);
            }}
            className="w-full rounded-2xl bg-surface-2 border border-white/5 px-4 py-3 text-sm font-semibold hover:bg-surface-3 disabled:opacity-50"
          >
            {restoring ? "Restoring…" : "Restore from cloud"}
          </button>
          {restoreMsg ? <p className="text-xs text-neon">{restoreMsg}</p> : null}
        </Section>
      ) : null}

      <Section label="Data rights">
        <button
          onClick={() => nav("/privacy")}
          className="w-full rounded-2xl bg-surface-2 border border-white/5 px-4 py-3 text-left flex items-center justify-between hover:bg-surface-3"
        >
          <div>
            <div className="text-sm font-semibold">Privacy controls</div>
            <div className="text-xs text-ink-muted">
              Policy disclosure, data export & delete
            </div>
          </div>
          <span className="text-neon text-xs">Open →</span>
        </button>
      </Section>

      <div className="flex-1" />

      <button
        onClick={async () => {
          await signOutCloudAccount().catch(() => undefined);
          signOut();
          nav("/splash", { replace: true });
        }}
        className="w-full h-12 rounded-full border border-white/10 text-sm font-semibold hover:bg-surface-2"
      >
        Sign out
      </button>
      <div className="text-xs text-ink-muted text-center">Version 0.1.0</div>
    </PageLayout>
  );
}

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

function Section({ label, children }: SectionProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</h2>
      <div className="rounded-2xl bg-card-grad border border-white/5 p-4 space-y-3">
        {children}
      </div>
    </section>
  );
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
        active ? "bg-neon text-surface-0" : "bg-surface-3 text-ink hover:bg-surface-2"
      }`}
    >
      {label}
    </button>
  );
}
