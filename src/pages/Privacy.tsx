import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CloudDownload, Download, ShieldCheck, Trash2 } from "lucide-react";
import { PageLayout, StickyPageHeader } from "../components/PageLayout";
import {
  hasCloudSyncConsent,
  loadConsent,
  onConsentChange,
  type ConsentState,
} from "../lib/consent";
import { downloadExport, eraseLocalData } from "../lib/dataRights";
import { eraseCloudData } from "../lib/cloud/sync";
import { restoreFromCloud } from "../lib/cloud/restore";
import { canUseCloudSync } from "../lib/api/config";

/**
 * Full privacy & data-rights surface. Reached from Settings → "Privacy
 * controls" and from the Privacy policy link on the consent card.
 */
export function Privacy() {
  const nav = useNavigate();
  const [state, setState] = useState<ConsentState>(() => loadConsent());
  const [confirmingErase, setConfirmingErase] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const controllerName =
    import.meta.env.VITE_PRIVACY_CONTROLLER_NAME?.trim() || "FitSense AI";
  const privacyContactUrl = import.meta.env.VITE_PRIVACY_CONTACT_URL?.trim() || null;

  useEffect(() => onConsentChange(setState), []);

  const onErase = async () => {
    setErasing(true);
    try {
      // Cloud-side erase first (no-op when sync isn't enabled).
      await eraseCloudData().catch(() => undefined);
    } finally {
      eraseLocalData();
      setErasing(false);
      nav("/splash", { replace: true });
    }
  };

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
          <h1 className="text-lg font-bold leading-tight">Privacy</h1>
          <p className="text-xs text-ink-muted">
            Control what data leaves your device.
          </p>
        </div>
        <ShieldCheck className="w-5 h-5 text-neon shrink-0" />
      </StickyPageHeader>

      <div className="pt-5 space-y-5 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <Section label="Consent choices">
          <p className="text-xs text-ink-muted leading-relaxed">
            Cloud sync, AI personalisation, and anonymous analytics are managed on the
            Settings page under{" "}
            <span className="text-ink font-medium">Your data, your choice</span>.
          </p>
          <button
            type="button"
            onClick={() => nav("/settings")}
            className="text-xs text-neon hover:underline"
          >
            Open Settings →
          </button>
        </Section>

        <Section label="Your data">
          {canUseCloudSync() && hasCloudSyncConsent() ? (
            <ActionRow
              icon={<CloudDownload className="w-4 h-4 text-neon" />}
              title="Restore from cloud"
              body="Merge scans, fit profile, and events from your cloud backup into this device."
              actionLabel={restoring ? "…" : "Restore"}
              disabled={restoring}
              onClick={async () => {
                setRestoring(true);
                const res = await restoreFromCloud();
                setRestoreMsg(res.message);
                setRestoring(false);
              }}
            />
          ) : null}
          {restoreMsg ? <p className="text-xs text-neon">{restoreMsg}</p> : null}
          <ActionRow
            icon={<Download className="w-4 h-4 text-neon" />}
            title="Export everything"
            body="Download a JSON copy of your profile, scans, events, and consent choices."
            actionLabel="Download"
            onClick={() => downloadExport()}
          />
          <ActionRow
            icon={<Trash2 className="w-4 h-4 text-coral" />}
            title="Delete my account"
            body="Erase your profile, scans, events, and any cloud-synced copies. This is permanent."
            actionLabel={
              erasing
                ? "Deleting…"
                : confirmingErase
                  ? "Tap again to confirm"
                  : "Delete"
            }
            destructive
            disabled={erasing}
            onClick={() => {
              if (!confirmingErase) {
                setConfirmingErase(true);
                setTimeout(() => setConfirmingErase(false), 5000);
                return;
              }
              void onErase();
            }}
          />
        </Section>

        <Section label="Privacy policy">
          <div className="text-xs text-ink-muted leading-relaxed space-y-3">
            <p>
              <strong className="text-ink">Controller.</strong> This deployment is
              operated by <span className="text-ink">{controllerName}</span>
              {privacyContactUrl ? (
                <>
                  {" "}
                  (
                  <a href={privacyContactUrl} className="text-neon hover:underline">
                    privacy contact
                  </a>
                  )
                </>
              ) : null}
              .
            </p>
            <p>
              <strong className="text-ink">What we process.</strong> Foot measurements
              derived from camera frames (processed on-device), fit preferences, scan
              history, and optional anonymous usage events. Raw camera frames are not
              uploaded.
            </p>
            <p>
              <strong className="text-ink">Legal bases.</strong> Consent for cloud sync,
              AI personalisation, and analytics. Contractual necessity for core sizing
              when you request a recommendation. Under POPIA (South Africa), processing
              is limited to the purpose you consented to; we do not sell foot
              measurement data.
            </p>
            <p>
              <strong className="text-ink">Retention.</strong> Local data remains until
              you delete it or sign out. Cloud copies are removed when you erase cloud
              data, and server retention jobs purge inactive sync rows after configured
              periods (default 730 days). Handoff sessions expire within minutes.
            </p>
            <p>
              <strong className="text-ink">Your rights (POPIA / GDPR).</strong> Access
              (export), correction, deletion, and withdrawal of consent at any time via
              Settings and this page. Portable Fit Identity recovery codes are one-time
              and hashed at rest.
            </p>
          </div>
        </Section>

        <Section label="Disclosure">
          <p className="text-xs text-ink-muted leading-relaxed">
            FitSense AI processes foot measurements locally in your browser unless you
            turn on cloud sync. We never upload raw camera frames. The on-device learned
            ranker only runs when you enable AI personalisation — no labels leave your
            device.
          </p>
          {state.acceptedAtEpochMs ? (
            <p className="text-[10px] text-ink-muted mt-2">
              Last reviewed {new Date(state.acceptedAtEpochMs).toLocaleString()} (policy
              v{state.acceptedPolicyVersion}).
            </p>
          ) : null}
        </Section>
      </div>
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
      <div className="rounded-3xl bg-card-grad border border-white/8 p-4 space-y-3">
        {children}
      </div>
    </section>
  );
}

interface ActionRowProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel: string;
  destructive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ActionRow({
  icon,
  title,
  body,
  actionLabel,
  destructive,
  disabled,
  onClick,
}: ActionRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-surface-2 grid place-items-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <p className="text-[11px] text-ink-muted leading-relaxed mt-0.5">{body}</p>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-40 ${
          destructive
            ? "bg-coral/15 text-coral border border-coral/30 hover:bg-coral/25"
            : "bg-neon/15 text-neon border border-neon/30 hover:bg-neon/25"
        }`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
