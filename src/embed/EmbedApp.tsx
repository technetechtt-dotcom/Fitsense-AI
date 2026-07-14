import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Ruler,
  Smartphone,
  X,
} from "lucide-react";
import { buildScanResult, simulatedMeasurement } from "../lib/measurement";
import { recommend } from "../lib/recommendation";
import { SHOE_CATALOG } from "../data/catalog";
import { CALIBRATION_META, primaryFoot, widthToLengthRatio } from "../types";
import type {
  CalibrationReference,
  FootMeasurement,
  ScanResult,
} from "../types";
import { ArScanner } from "../components/ArScanner";
import { detectArSupport } from "../lib/webxr";
import { EmbedLiveScanner } from "./EmbedLiveScanner";
import { listenFromHost, postToHost } from "./bridge";
import { useApplyEmbedTheme } from "./EmbedTheme";
import { QrCode } from "./QrCode";
import { resolveEmbedHandoffConfig } from "../lib/api/handoffConfig";
import {
  buildEmbedUrl,
  readEmbedConfigFromUrl,
  type EmbedConfig,
  type EmbedScanSummary,
  type EmbedSizeResult,
  type SizeSystem,
} from "./types";
import {
  createHandoffTransport,
  newSessionId,
  type HandoffPayload,
  type HandoffTransport,
} from "./handoff";
import "./embed.css";

type Step =
  | "intro"
  | "scanning"
  | "live-scan"
  | "ar-scan"
  | "result"
  | "handoff-desktop"
  | "handoff-waiting"
  | "handoff-done";

const VERSION = "1.1.0";

/**
 * Compact, host-themable scan flow rendered inside the iframe injected by
 * the embed SDK.
 *
 * Operates in three runtime modes depending on URL params and capabilities:
 *
 *  1. **Mobile / camera-capable direct mode** — runs the scan locally and
 *     posts the size back to the host via `bridge.ts`.
 *
 *  2. **Desktop sender mode** — when the user picks "Continue on phone"
 *     we generate a session id, display a QR code with the same embed
 *     URL + `?session=<id>`, and subscribe to a handoff transport. Once
 *     the phone publishes a result we apply it as if it had been captured
 *     locally.
 *
 *  3. **Phone receiver mode** — when `?session=<id>` is present we run
 *     the normal scan flow, publish the result to the handoff transport,
 *     and show a "✅ result sent" terminal screen.
 */
export function EmbedApp() {
  const initialConfig = useMemo(() => {
    const raw = readEmbedConfigFromUrl(window.location.href);
    return {
      ...raw,
      handoff: resolveEmbedHandoffConfig(raw.handoff),
    };
  }, []);
  const [config, setConfig] = useState<EmbedConfig>(initialConfig);
  const [step, setStep] = useState<Step>(() =>
    initialConfig.handoff?.sessionId ? "intro" : "intro",
  );
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  useApplyEmbedTheme(config.theme);

  const isPhoneReceiver = !!config.handoff?.sessionId;

  // Announce readiness + accept reconfiguration from the host page.
  useEffect(() => {
    postToHost({ type: "fitsense:ready", version: VERSION });
    return listenFromHost((msg) => {
      if (msg.type === "fitsense:configure") {
        setConfig((prev) => ({
          ...prev,
          ...msg.config,
          handoff: resolveEmbedHandoffConfig({
            ...prev.handoff,
            ...msg.config.handoff,
          }),
        }));
      }
    });
  }, []);

  useEmitResize([step, scan?.scanId]);

  const close = () => postToHost({ type: "fitsense:close" });

  // ─── Calibration the user picked (used by live scanner step) ──────
  const [calibrationForScan, setCalibrationForScan] =
    useState<CalibrationReference>("arcore_plane");

  /**
   * Fake-scan simulation. Only used for AR-plane mode inside the embed
   * today (iframes need explicit `allow="xr-spatial-tracking"` for real
   * WebXR which isn't yet universal among partners). A4 / card flows go
   * through the live scanner.
   */
  const runSimulatedScan = useCallback(
    async (calibration: CalibrationReference): Promise<ScanResult> => {
      setStep("scanning");
      setProgress(0);
      for (let i = 1; i <= 6; i++) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 130));
        setProgress(i / 6);
      }
      const measurement = simulatedMeasurement(calibration);
      const recommendation = recommend(measurement, SHOE_CATALOG);
      return buildScanResult(
        config.productId ?? "embed-anonymous",
        measurement,
        recommendation,
      );
    },
    [config.productId],
  );

  const finaliseLocal = useCallback(
    (result: ScanResult) => {
      setScan(result);
      setStep("result");
      const summary = toScanSummary(result);
      postToHost({ type: "fitsense:scan", scan: summary });
      const size = toSizeResult(result, config.sizeSystem ?? "uk");
      if (size) {
        postToHost({ type: "fitsense:size", size, scan: summary });
      }
    },
    [config.sizeSystem],
  );

  const finalisePhone = useCallback(
    async (result: ScanResult) => {
      const sessionId = config.handoff?.sessionId;
      if (!sessionId) {
        setHandoffError("Missing handoff session id.");
        setStep("intro");
        return;
      }
      try {
        const size = toSizeResult(result, config.sizeSystem ?? "uk");
        if (!size) {
          setHandoffError("Could not produce a size recommendation.");
          setStep("intro");
          return;
        }
        const transport = createHandoffTransport(config.handoff);
        const payload: HandoffPayload = {
          size,
          scan: toScanSummary(result),
          completedAtEpochMs: Date.now(),
          v: 1,
        };
        await transport.publish(sessionId, payload);
        setScan(result);
        setStep("handoff-done");
      } catch (err) {
        setHandoffError(
          err instanceof Error ? err.message : "Handoff failed.",
        );
        setStep("result");
      }
    },
    [config.handoff, config.sizeSystem],
  );

  const startLocalScan = async (calibration: CalibrationReference) => {
    setCalibrationForScan(calibration);
    if (calibration === "arcore_plane") {
      const support = await detectArSupport();
      if (support.kind === "supported") {
        setStep("ar-scan");
        return;
      }
      const result = await runSimulatedScan(calibration);
      finaliseLocal(result);
      return;
    }
    setStep("live-scan");
  };

  const startPhoneScan = async (calibration: CalibrationReference) => {
    if (!config.handoff?.sessionId) {
      setHandoffError("Missing handoff session id.");
      setStep("intro");
      return;
    }
    setCalibrationForScan(calibration);
    if (calibration === "arcore_plane") {
      const support = await detectArSupport();
      if (support.kind === "supported") {
        setStep("ar-scan");
        return;
      }
      const result = await runSimulatedScan(calibration);
      await finalisePhone(result);
      return;
    }
    setStep("live-scan");
  };

  const onArMeasured = useCallback(
    (measurement: FootMeasurement) => {
      const recommendation = recommend(measurement, SHOE_CATALOG);
      const result = buildScanResult(
        config.productId ?? "embed-anonymous",
        measurement,
        recommendation,
      );
      if (isPhoneReceiver) {
        void finalisePhone(result);
      } else {
        finaliseLocal(result);
      }
    },
    [config.productId, finaliseLocal, finalisePhone, isPhoneReceiver],
  );

  /** Called by EmbedLiveScanner when the user confirms a tap measurement. */
  const onLiveMeasured = useCallback(
    (measurement: FootMeasurement) => {
      const recommendation = recommend(measurement, SHOE_CATALOG);
      const result = buildScanResult(
        config.productId ?? "embed-anonymous",
        measurement,
        recommendation,
      );
      if (isPhoneReceiver) {
        finalisePhone(result);
      } else {
        finaliseLocal(result);
      }
    },
    [config.productId, finaliseLocal, finalisePhone, isPhoneReceiver],
  );

  // ─── Desktop sender: open session, await phone payload ─────────────
  const handoffSession = useDesktopHandoff({
    enabled: step === "handoff-desktop" || step === "handoff-waiting",
    config,
    onPayload: (payload) => {
      // Reconstruct a minimal ScanResult shell for the result UI.
      const reconstructed = reconstructScanResult(
        config,
        payload,
      );
      setScan(reconstructed);
      setStep("result");
      postToHost({ type: "fitsense:scan", scan: payload.scan });
      postToHost({
        type: "fitsense:size",
        size: payload.size,
        scan: payload.scan,
      });
    },
  });

  const openHandoff = () => {
    setHandoffError(null);
    setStep("handoff-desktop");
  };

  const apply = () => {
    if (!scan) return;
    const size = toSizeResult(scan, config.sizeSystem ?? "uk");
    if (!size) return;
    const summary = toScanSummary(scan);
    postToHost({ type: "fitsense:apply", size, scan: summary });
    postToHost({ type: "fitsense:close" });
  };

  return (
    <div className="fs-root">
      <Header config={config} onClose={close} showPhoneBadge={isPhoneReceiver} />
      <main className="fs-main">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div key="intro" {...stepMotion} className="fs-step">
              <Intro
                config={config}
                isPhoneReceiver={isPhoneReceiver}
                onStart={() =>
                  isPhoneReceiver
                    ? startPhoneScan("arcore_plane")
                    : startLocalScan("arcore_plane")
                }
                onStartWithCard={() =>
                  isPhoneReceiver
                    ? startPhoneScan("credit_card")
                    : startLocalScan("credit_card")
                }
                onStartWithA4={() =>
                  isPhoneReceiver
                    ? startPhoneScan("a4_paper")
                    : startLocalScan("a4_paper")
                }
                onOpenHandoff={openHandoff}
                handoffError={handoffError}
              />
            </motion.div>
          )}
          {step === "scanning" && (
            <motion.div key="scanning" {...stepMotion} className="fs-step">
              <Scanning progress={progress} />
            </motion.div>
          )}
          {step === "ar-scan" ? (
            <ArScanner
              onMeasured={onArMeasured}
              onCancel={() => setStep("intro")}
              onError={(message) => {
                setHandoffError(message);
                setStep("intro");
              }}
            />
          ) : null}

          {step === "live-scan" &&
            calibrationForScan !== "arcore_plane" && (
              <motion.div key="live-scan" {...stepMotion}>
                <EmbedLiveScanner
                  calibration={calibrationForScan}
                  onMeasured={onLiveMeasured}
                  onCancel={() => setStep("intro")}
                />
              </motion.div>
            )}
          {(step === "handoff-desktop" || step === "handoff-waiting") &&
            handoffSession && (
              <motion.div
                key="handoff"
                {...stepMotion}
                className="fs-step"
              >
                <HandoffDesktop
                  qrUrl={handoffSession.qrUrl}
                  status={handoffSession.status}
                  transportKind={handoffSession.transportKind}
                  onCancel={() => setStep("intro")}
                />
              </motion.div>
            )}
          {step === "handoff-done" && (
            <motion.div
              key="handoff-done"
              {...stepMotion}
              className="fs-step"
            >
              <HandoffDone scan={scan} sizeSystem={config.sizeSystem ?? "uk"} />
            </motion.div>
          )}
          {step === "result" && scan && (
            <motion.div key="result" {...stepMotion} className="fs-step">
              <Result
                scan={scan}
                sizeSystem={config.sizeSystem ?? "uk"}
                onApply={apply}
                onRescan={() => {
                  setScan(null);
                  setStep("intro");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

const stepMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: "easeOut" },
} as const;

// ─── Header / footer ─────────────────────────────────────────────────────

function Header({
  config,
  onClose,
  showPhoneBadge,
}: {
  config: EmbedConfig;
  onClose: () => void;
  showPhoneBadge?: boolean;
}) {
  return (
    <header className="fs-header">
      <div className="fs-brand">
        <Ruler size={16} aria-hidden />
        <span className="fs-brand-name">
          {config.storeName ? `${config.storeName} · ` : ""}Fit finder
        </span>
        {showPhoneBadge ? (
          <span className="fs-pill">Phone session</span>
        ) : config.brand ? (
          <span className="fs-pill">{config.brand}</span>
        ) : null}
      </div>
      <button
        type="button"
        className="fs-icon-btn"
        onClick={onClose}
        aria-label="Close fit finder"
      >
        <X size={18} />
      </button>
    </header>
  );
}

function Footer() {
  return (
    <footer className="fs-footer">
      Powered by <strong>FitSense AI</strong>
    </footer>
  );
}

// ─── Intro ───────────────────────────────────────────────────────────────

function Intro({
  config,
  isPhoneReceiver,
  onStart,
  onStartWithCard,
  onStartWithA4,
  onOpenHandoff,
  handoffError,
}: {
  config: EmbedConfig;
  isPhoneReceiver: boolean;
  onStart: () => void;
  onStartWithCard: () => void;
  onStartWithA4: () => void;
  onOpenHandoff: () => void;
  handoffError: string | null;
}) {
  return (
    <>
      <h2 className="fs-h2">
        {isPhoneReceiver
          ? "Finish the scan on this phone"
          : "Find your perfect size"}
      </h2>
      <p className="fs-muted">
        {isPhoneReceiver
          ? "Your size will be sent straight back to the other device."
          : config.brand
          ? `Get a tailored fit for ${config.brand} in under 30 seconds. Place your foot on a flat floor and we'll measure with AR.`
          : "Get a tailored fit in under 30 seconds. Place your foot on a flat floor and we'll measure with AR."}
      </p>
      <div className="fs-stack">
        <button className="fs-btn fs-btn-primary" onClick={onStart}>
          <Camera size={18} style={{ marginRight: 8 }} />
          Start AR scan
        </button>
        <div className="fs-divider">
          <span>or calibrate with</span>
        </div>
        <div className="fs-two">
          <button className="fs-btn fs-btn-ghost" onClick={onStartWithCard}>
            Bank card
          </button>
          <button className="fs-btn fs-btn-ghost" onClick={onStartWithA4}>
            A4 paper
          </button>
        </div>
        {!isPhoneReceiver ? (
          <button className="fs-btn fs-btn-ghost" onClick={onOpenHandoff}>
            <Smartphone size={16} style={{ marginRight: 8 }} />
            Continue on phone
          </button>
        ) : null}
      </div>
      {handoffError ? (
        <p className="fs-error">{handoffError}</p>
      ) : (
        <ul className="fs-list">
          <li>Privacy first — scans run in your browser.</li>
          <li>Works across UK, US, EU and Mondopoint sizing.</li>
        </ul>
      )}
    </>
  );
}

// ─── Scanning ────────────────────────────────────────────────────────────

function Scanning({ progress }: { progress: number }) {
  return (
    <div className="fs-scanning">
      <div className="fs-spinner-wrap">
        <Loader2 className="fs-spin" size={48} />
      </div>
      <h2 className="fs-h2">Measuring your foot…</h2>
      <p className="fs-muted">Hold the device steady — almost there.</p>
      <div className="fs-progress">
        <div
          className="fs-progress-bar"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Desktop handoff (QR + waiting) ──────────────────────────────────────

function HandoffDesktop({
  qrUrl,
  status,
  transportKind,
  onCancel,
}: {
  qrUrl: string;
  status: "waiting" | "received";
  transportKind: "http" | "broadcast";
  onCancel: () => void;
}) {
  return (
    <div className="fs-handoff">
      <h2 className="fs-h2">Continue on your phone</h2>
      <p className="fs-muted">
        Scan this QR with your phone camera to capture your foot. The size
        will appear here as soon as it's done.
      </p>
      <div className="fs-qr-wrap">
        <QrCode value={qrUrl} size={220} />
      </div>
      <div className="fs-handoff-status">
        {status === "waiting" ? (
          <>
            <Loader2 className="fs-spin" size={16} />
            <span>Waiting for phone…</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={16} />
            <span>Result received</span>
          </>
        )}
      </div>
      <p className="fs-muted fs-small">
        Or open this link on any device:{" "}
        <a
          href={qrUrl}
          target="_blank"
          rel="noreferrer"
          className="fs-link"
        >
          {shortHost(qrUrl)}
        </a>
      </p>
      <button className="fs-btn fs-btn-ghost" onClick={onCancel}>
        <RefreshCw size={16} style={{ marginRight: 8 }} />
        Cancel
      </button>
      {transportKind === "broadcast" ? (
        <p className="fs-muted fs-small fs-warn">
          Demo mode — running over BroadcastChannel (same-browser only).
          Configure <code>handoff.baseUrl</code> for real cross-device flow.
        </p>
      ) : null}
    </div>
  );
}

function HandoffDone({
  scan,
  sizeSystem,
}: {
  scan: ScanResult | null;
  sizeSystem: SizeSystem;
}) {
  const rec = scan?.recommendation;
  const chosen = pickSizeLabel(rec, sizeSystem);
  return (
    <div className="fs-handoff-done">
      <div className="fs-tick">
        <CheckCircle2 size={42} />
      </div>
      <h2 className="fs-h2">Sent back to your other device</h2>
      <p className="fs-muted">
        {rec
          ? `Recommended size: ${chosen.label} (${chosen.unit}). You can close this tab.`
          : "You can close this tab — your scan was delivered."}
      </p>
    </div>
  );
}

// ─── Result ──────────────────────────────────────────────────────────────

function Result({
  scan,
  sizeSystem,
  onApply,
  onRescan,
}: {
  scan: ScanResult;
  sizeSystem: SizeSystem;
  onApply: () => void;
  onRescan: () => void;
}) {
  const foot = primaryFoot(scan);
  const rec = scan.recommendation;
  const chosen = pickSizeLabel(rec, sizeSystem);

  return (
    <>
      <div className="fs-result-hero">
        <div className="fs-result-label">Your recommended size</div>
        <div className="fs-result-value">{chosen.label}</div>
        <div className="fs-muted">{chosen.unit}</div>
      </div>
      <div className="fs-stats">
        <Stat
          label="Length"
          value={foot ? `${foot.lengthMm.toFixed(1)} mm` : "—"}
        />
        <Stat
          label="Width"
          value={foot ? `${foot.widthMm.toFixed(1)} mm` : "—"}
        />
        <Stat
          label="Fit"
          value={
            rec && rec.matches[0]
              ? `${Math.round(rec.matches[0].fitScore)}%`
              : "—"
          }
        />
      </div>
      {rec ? (
        <div className="fs-size-grid">
          <SizeChip label="UK" value={rec.uk} highlight={sizeSystem === "uk"} />
          <SizeChip label="US" value={rec.us} highlight={sizeSystem === "us"} />
          <SizeChip label="EU" value={rec.eu} highlight={sizeSystem === "eu"} />
          <SizeChip
            label="MP"
            value={`${rec.mondopointMm.toFixed(0)} mm`}
            highlight={sizeSystem === "mondopoint"}
          />
        </div>
      ) : null}
      <p className="fs-muted fs-small">
        Calibration:{" "}
        {foot ? CALIBRATION_META[foot.calibration].label : "—"} · captured{" "}
        {new Date(scan.createdAtEpochMs).toLocaleTimeString()}
      </p>
      <div className="fs-stack">
        <button className="fs-btn fs-btn-primary" onClick={onApply}>
          <Check size={18} style={{ marginRight: 8 }} />
          Use size {chosen.label}
        </button>
        <button className="fs-btn fs-btn-ghost" onClick={onRescan}>
          Re-scan
        </button>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="fs-stat fs-card">
      <div className="fs-stat-label">{label}</div>
      <div className="fs-stat-value">{value}</div>
    </div>
  );
}

function SizeChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`fs-chip${highlight ? " fs-chip-active" : ""}`}>
      <span className="fs-chip-label">{label}</span>
      <span className="fs-chip-value">{value}</span>
    </div>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────

/**
 * Manages the desktop side of a handoff session: generates the session id,
 * subscribes to the chosen transport, and tears everything down on unmount
 * or when disabled.
 */
function useDesktopHandoff({
  enabled,
  config,
  onPayload,
}: {
  enabled: boolean;
  config: EmbedConfig;
  onPayload: (payload: HandoffPayload) => void;
}): {
  qrUrl: string;
  status: "waiting" | "received";
  transportKind: "http" | "broadcast";
} | null {
  const sessionIdRef = useRef<string | null>(null);
  const transportRef = useRef<HandoffTransport | null>(null);
  const [status, setStatus] = useState<"waiting" | "received">("waiting");

  // Stable session id for the lifetime of the desktop handoff step.
  if (enabled && !sessionIdRef.current) {
    sessionIdRef.current = newSessionId();
  }
  if (!enabled && sessionIdRef.current) {
    sessionIdRef.current = null;
    transportRef.current = null;
  }

  // QR URL is the same embed URL with this session injected.
  const qrUrl = useMemo(() => {
    if (!enabled || !sessionIdRef.current) return "";
    const base = `${window.location.origin}${window.location.pathname}`;
    // Strip session/handoff query-params from this iframe's URL so they
    // don't leak into the new phone URL incorrectly.
    const child: EmbedConfig = {
      ...config,
      handoff: resolveEmbedHandoffConfig({
        ...(config.handoff ?? {}),
        sessionId: sessionIdRef.current,
      }),
    };
    return buildEmbedUrl(base, child);
  }, [enabled, config]);

  useEffect(() => {
    if (!enabled || !sessionIdRef.current) return;
    const transport = createHandoffTransport(config.handoff);
    transportRef.current = transport;
    const unsubscribe = transport.subscribe(
      sessionIdRef.current,
      (payload) => {
        setStatus("received");
        onPayload(payload);
      },
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, config.handoff?.baseUrl, config.handoff?.transport]);

  if (!enabled || !sessionIdRef.current || !transportRef.current) return null;
  return {
    qrUrl,
    status,
    transportKind: transportRef.current.kind,
  };
}

/** Emits a `fitsense:resize` message whenever the rendered height changes. */
function useEmitResize(deps: ReadonlyArray<unknown>) {
  useLayoutEffect(() => {
    const measure = () => {
      const h = document.documentElement.scrollHeight;
      postToHost({ type: "fitsense:resize", height: h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ─── Pure helpers ────────────────────────────────────────────────────────

function toScanSummary(scan: ScanResult): EmbedScanSummary {
  const foot = primaryFoot(scan);
  return {
    scanId: scan.scanId,
    lengthMm: foot?.lengthMm ?? 0,
    widthMm: foot?.widthMm ?? 0,
    widthToLengthRatio: foot ? widthToLengthRatio(foot) : 0,
    capturedAtEpochMs: scan.createdAtEpochMs,
  };
}

function toSizeResult(
  scan: ScanResult,
  preferred: SizeSystem,
): EmbedSizeResult | null {
  const rec = scan.recommendation;
  if (!rec) return null;
  const topScore = rec.matches[0]?.fitScore ?? 0;
  return {
    uk: rec.uk,
    us: rec.us,
    eu: rec.eu,
    mondopointMm: rec.mondopointMm,
    fitScore: Math.max(0, Math.min(1, topScore / 100)),
    preferred,
  };
}

function pickSizeLabel(
  rec: ScanResult["recommendation"],
  system: SizeSystem,
): { label: string; unit: string } {
  if (!rec) return { label: "—", unit: "" };
  switch (system) {
    case "uk":
      return { label: rec.uk, unit: "UK" };
    case "us":
      return { label: rec.us, unit: "US" };
    case "eu":
      return { label: rec.eu, unit: "EU" };
    case "mondopoint":
      return { label: `${rec.mondopointMm.toFixed(0)} mm`, unit: "Mondopoint" };
  }
}

/**
 * Rebuilds a [ScanResult] shell from a phone-published handoff payload so
 * the existing [Result] UI can render it on the desktop side without
 * needing a separate code path.
 */
function reconstructScanResult(
  config: EmbedConfig,
  payload: HandoffPayload,
): ScanResult {
  const { scan, size } = payload;
  return {
    scanId: scan.scanId,
    userId: config.productId ?? "embed-handoff",
    createdAtEpochMs: scan.capturedAtEpochMs,
    arcoreUsed: true,
    rightFoot: {
      lengthMm: scan.lengthMm,
      widthMm: scan.widthMm,
      confidence: size.fitScore,
      foot: "right",
      calibration: "arcore_plane",
      pixelsPerMm: 0,
    },
    recommendation: {
      uk: size.uk,
      us: size.us,
      eu: size.eu,
      mondopointMm: size.mondopointMm,
      matches: [],
    },
  };
}

function shortHost(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname.length > 1 ? u.pathname : ""}`;
  } catch {
    return url;
  }
}

