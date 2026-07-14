import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Sparkles } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { SectionHeader } from "../components/SectionHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { resolveEmbedHandoffConfig } from "../lib/api/handoffConfig";
import { getApiBaseUrl, isApiConfigured } from "../lib/api/config";
import { buildEmbedUrl, type EmbedTheme, type SizeSystem } from "../embed/types";
import { listenFromEmbed } from "../embed/bridge";

type PartnerKey = "temu" | "shein" | "bash" | "superbalist" | "generic";

interface PartnerPreset {
  label: string;
  storeName: string;
  brand: string;
  sizeSystem: SizeSystem;
  theme: EmbedTheme;
  productId: string;
}

const PARTNERS: Record<PartnerKey, PartnerPreset> = {
  temu: {
    label: "Temu",
    storeName: "Temu",
    brand: "Generic",
    sizeSystem: "us",
    productId: "TEMU-SNK-2031",
    theme: {
      mode: "light",
      primary: "#FB7701",
      bg: "#ffffff",
      text: "#1a1a1a",
      radius: "10px",
    },
  },
  shein: {
    label: "Shein",
    storeName: "SHEIN",
    brand: "SHEIN Active",
    sizeSystem: "eu",
    productId: "SHEIN-WMN-4421",
    theme: {
      mode: "light",
      primary: "#000000",
      bg: "#ffffff",
      text: "#111111",
      radius: "0px",
      font: "'Helvetica Neue', Arial, sans-serif",
    },
  },
  bash: {
    label: "Bash",
    storeName: "Bash",
    brand: "Nike",
    sizeSystem: "uk",
    productId: "BASH-NK-AM90",
    theme: {
      mode: "light",
      primary: "#111111",
      bg: "#fafafa",
      text: "#111111",
      radius: "8px",
    },
  },
  superbalist: {
    label: "Superbalist",
    storeName: "Superbalist",
    brand: "Adidas",
    sizeSystem: "uk",
    productId: "SB-ADI-SBA",
    theme: {
      mode: "dark",
      primary: "#FF3D00",
      bg: "#0d0d0d",
      text: "#f5f5f5",
      surface: "#1a1a1a",
      radius: "4px",
    },
  },
  generic: {
    label: "Generic store",
    storeName: "Your store",
    brand: "Acme Sneakers",
    sizeSystem: "uk",
    productId: "DEMO-SKU-001",
    theme: {
      mode: "light",
      primary: "#0a84ff",
      bg: "#ffffff",
      text: "#111827",
      radius: "14px",
    },
  },
};

export function Integrations() {
  const [partner, setPartner] = useState<PartnerKey>("temu");
  const preset = PARTNERS[partner];
  const [lastSize, setLastSize] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const iframeUrl = useMemo(
    () =>
      buildEmbedUrl(`${window.location.origin}/`, {
        productId: preset.productId,
        brand: preset.brand,
        storeName: preset.storeName,
        sizeSystem: preset.sizeSystem,
        theme: preset.theme,
        handoff: resolveEmbedHandoffConfig({ transport: "http" }),
      }),
    [preset],
  );

  const handoffBaseSnippet =
    getApiBaseUrl() ?? "https://api.fitsense.ai";

  // Listen for size events from the live preview iframe.
  useMemo(() => {
    return listenFromEmbed(window.location.origin, (msg) => {
      if (msg.type === "fitsense:size" || msg.type === "fitsense:apply") {
        const s = msg.size;
        const label =
          preset.sizeSystem === "uk"
            ? `UK ${s.uk}`
            : preset.sizeSystem === "us"
            ? `US ${s.us}`
            : preset.sizeSystem === "eu"
            ? `EU ${s.eu}`
            : `${s.mondopointMm.toFixed(0)} mm`;
        setLastSize(label);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scriptSnippet = useMemo(() => buildScriptSnippet(preset), [preset]);
  const dataAttrSnippet = useMemo(
    () => buildDataAttrSnippet(preset),
    [preset],
  );
  const jsApiSnippet = useMemo(() => buildJsApiSnippet(preset), [preset]);

  return (
    <PageLayout withTopBar>
      <TopBar title="Integrations" />

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-3xl p-6 bg-hero-grad text-surface-0 relative overflow-hidden"
      >
        <Sparkles className="w-6 h-6 mb-2" />
        <h2 className="text-fluid-title font-black font-display leading-tight">
          Drop FitSense into any storefront in&nbsp;5&nbsp;minutes.
        </h2>
        <p className="text-sm opacity-90 mt-2 leading-relaxed">
          One <code>&lt;script&gt;</code> tag + one button attribute. The fit
          finder opens as a modal, returns a size, and matches your store's
          look — no changes to your existing checkout.
        </p>
      </motion.section>

      <section>
        <SectionHeader title="Preview as a partner" />
        <div className="flex flex-wrap gap-2 mt-3">
          {(Object.keys(PARTNERS) as PartnerKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setPartner(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                partner === key
                  ? "bg-neon text-surface-0"
                  : "bg-surface-2 text-ink-muted hover:text-ink"
              }`}
            >
              {PARTNERS[key].label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 bg-card-grad">
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
            <div className="text-xs text-ink-muted">
              <span className="text-ink font-semibold">
                {preset.storeName}
              </span>{" "}
              · {preset.brand} · size system{" "}
              <code className="text-neon">{preset.sizeSystem}</code>
            </div>
            <a
              href={iframeUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open preview in new tab"
              className="text-ink-muted hover:text-ink"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            title="FitSense embed preview"
            allow="camera; fullscreen"
            className="w-full min-h-[280px] h-[clamp(280px,55vh,560px)] bg-white"
          />
        </div>

        {lastSize ? (
          <div className="mt-3 rounded-xl p-3 bg-surface-2 border border-white/5 text-sm">
            <span className="text-ink-muted">Host received: </span>
            <span className="text-neon font-semibold">{lastSize}</span>
          </div>
        ) : null}
      </section>

      <section>
        <SectionHeader title="1 · Include the SDK" />
        <Snippet code={scriptSnippet} />
      </section>

      <section>
        <SectionHeader title="2 · Open from any button" />
        <p className="text-xs text-ink-muted mb-2">
          Declarative (zero JS) — add{" "}
          <code className="text-neon">data-fitsense</code> to any element.
        </p>
        <Snippet code={dataAttrSnippet} />
      </section>

      <section>
        <SectionHeader title="3 · Or call the API" />
        <p className="text-xs text-ink-muted mb-2">
          Imperative — receive the size in a callback.
        </p>
        <Snippet code={jsApiSnippet} />
      </section>

      <section>
        <SectionHeader title="Cross-device handoff (desktop → phone)" />
        <p className="text-xs text-ink-muted mb-2">
          On desktop the user clicks <em>Continue on phone</em> inside the
          embed → a QR appears → they scan with their phone → the phone
          completes the AR scan → the size is posted back to the desktop
          modal automatically. Open the live preview above and tap{" "}
          <em>Continue on phone</em> to see it.
        </p>
        <Snippet
          code={`// With VITE_API_BASE_URL set, handoff uses the FitSense API automatically.
// Or set baseUrl explicitly for a custom relay:
FitSense.init({
  handoff: {
    baseUrl: "${handoffBaseSnippet}",
    transport: "http",
    pollMs: 1500,
  },
});

// Relay endpoints (built into backend/):
//   PUT    /v1/handoff/:sessionId   body: { payload }   → 204
//   GET    /v1/handoff/:sessionId   → 200 { payload? }
//   DELETE /v1/handoff/:sessionId   → 204`}
        />
        {isApiConfigured() ? (
          <p className="text-xs text-neon mt-2">
            This dev build is wired to the API
            {handoffBaseSnippet ? ` at ${handoffBaseSnippet || "same origin"}` : ""}.
            Run <code className="text-ink">npm run dev:full</code> to start web + API.
          </p>
        ) : null}
      </section>

      <section>
        <SectionHeader title="Why it just works" />
        <ul className="text-sm text-ink-muted leading-relaxed space-y-2 mt-2 list-disc pl-5">
          <li>
            <strong className="text-ink">Sandboxed iframe</strong> — host CSS,
            JS and DOM are never touched.
          </li>
          <li>
            <strong className="text-ink">Themable</strong> — re-skin via CSS
            tokens (<code>--fs-primary</code>, <code>--fs-radius</code>, …) so
            it matches the host site.
          </li>
          <li>
            <strong className="text-ink">Typed callback</strong> — host gets{" "}
            <code>{`{ uk, us, eu, mondopointMm, fitScore }`}</code> and applies
            it to its own size selector.
          </li>
          <li>
            <strong className="text-ink">Cross-device</strong> — desktop
            visitors can scan with their phone via QR; result flows back
            automatically.
          </li>
          <li>
            <strong className="text-ink">Universal</strong> — works on
            Shopify, WooCommerce, Magento, BigCommerce, Temu, Shein, Bash,
            Superbalist, or any plain HTML page.
          </li>
        </ul>
      </section>

      <PrimaryButton onClick={() => window.open(iframeUrl, "_blank")}>
        Open live preview in new tab
      </PrimaryButton>
    </PageLayout>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function Snippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  };
  return (
    <div className="relative">
      <pre className="rounded-xl p-4 bg-black/40 border border-white/5 overflow-x-auto text-xs leading-relaxed text-ink-muted">
        <code>{code}</code>
      </pre>
      <button
        onClick={onCopy}
        className="absolute top-2 right-2 rounded-md px-2 py-1 text-xs bg-surface-2 hover:bg-surface-3 text-ink-muted hover:text-ink flex items-center gap-1"
      >
        <Copy className="w-3 h-3" />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function buildScriptSnippet(p: PartnerPreset): string {
  return `<!-- 1. Drop this once, anywhere on your page -->
<script src="https://cdn.fitsense.ai/embed.js" defer></script>

<!-- 2. Optional: page-wide defaults (theme to match ${p.storeName}) -->
<script>
  window.FitSense = window.FitSense || [];
  window.FitSense.push(["init", {
    storeName: "${p.storeName}",
    sizeSystem: "${p.sizeSystem}",
    theme: {
      primary: "${p.theme.primary}",
      bg: "${p.theme.bg}",
      text: "${p.theme.text}",
      radius: "${p.theme.radius}",
      mode: "${p.theme.mode}"
    }
  }]);
</script>`;
}

function buildDataAttrSnippet(p: PartnerPreset): string {
  return `<!-- Reuse your existing button styling — we attach the click handler -->
<button
  data-fitsense
  data-product-id="${p.productId}"
  data-brand="${p.brand}"
  data-store-name="${p.storeName}"
  data-size-system="${p.sizeSystem}"
  data-on-size="fitsenseApplySize"
  class="your-existing-cta-class"
>
  Find my size
</button>

<script>
  function fitsenseApplySize(size /*, scan */) {
    // Apply the recommendation to your size <select>
    const select = document.querySelector('#product-size-select');
    if (select) select.value = size.${p.sizeSystem === "mondopoint" ? "mondopointMm" : p.sizeSystem};
    select?.dispatchEvent(new Event('change', { bubbles: true }));
  }
</script>`;
}

function buildJsApiSnippet(p: PartnerPreset): string {
  return `// Open imperatively (e.g. inside a React onClick handler)
FitSense.open({
  productId: "${p.productId}",
  brand: "${p.brand}",
  storeName: "${p.storeName}",
  sizeSystem: "${p.sizeSystem}",
  theme: {
    primary: "${p.theme.primary}",
    bg: "${p.theme.bg}",
    text: "${p.theme.text}",
    radius: "${p.theme.radius}",
    mode: "${p.theme.mode}"
  },
  onSize: (size, scan) => {
    console.log("Recommended:", size);
    // size = { uk: "9", us: "10", eu: "43", mondopointMm: 270, fitScore: 0.92 }
    // scan = { scanId, lengthMm, widthMm, widthToLengthRatio, capturedAtEpochMs }
  },
  onClose: () => {
    console.log("Fit finder closed");
  }
});`;
}
