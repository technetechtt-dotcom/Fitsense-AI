import { resolveHandoffBaseUrl } from "../lib/api/config";
import type { HandoffConfig } from "../lib/api/handoffTypes";

/**
 * FitSense AI · Embed protocol
 *
 * Shared between the standalone embed.js SDK that hosts ship to their
 * pages, the React iframe payload, and the parent-page integrations.
 *
 * Wire format is plain JSON over `window.postMessage`. Every message
 * carries a stable `type` discriminator under the `fitsense:` namespace.
 */

export type SizeSystem = "uk" | "us" | "eu" | "mondopoint";

export interface EmbedTheme {
  /** Brand accent colour (CTAs, focus ring). Any valid CSS colour. */
  primary?: string;
  /** Surface / background colour. */
  bg?: string;
  /** Primary text colour. */
  text?: string;
  /** Muted text colour (labels, captions). */
  textMuted?: string;
  /** Surface 1 (cards). */
  surface?: string;
  /** Border colour. */
  border?: string;
  /** Border radius for cards/buttons, e.g. "12px" or "0.75rem". */
  radius?: string;
  /** Font family. Inherits the host's font if left blank. */
  font?: string;
  /** "light" or "dark" base; affects the default neutrals. */
  mode?: "light" | "dark";
}

export interface EmbedProductContext {
  /** Host-side SKU / product id. Echoed back on events. */
  productId?: string;
  /** Brand label rendered in the embed header. */
  brand?: string;
  /** "sneaker" | "running" | "boots" | "casual" | "dress" | ... */
  category?: string;
  /** Size system the host's size selector uses. Drives the "Use this size" CTA. */
  sizeSystem?: SizeSystem;
}

export interface EmbedConfig extends EmbedProductContext {
  /** Optional API key for analytics / per-partner config. */
  apiKey?: string;
  /** Visible brand of the host store, shown in the embed header. */
  storeName?: string;
  /** Theme tokens. */
  theme?: EmbedTheme;
  /**
   * If true, the embed renders inline in the parent flow rather than
   * as a modal. The host is responsible for sizing the iframe.
   */
  inline?: boolean;
  /** Locale string (BCP 47). Currently unused, reserved for i18n. */
  locale?: string;
  /** Cross-device handoff configuration (QR → phone → relay → desktop). */
  handoff?: EmbedHandoffConfig;
}

/**
 * Cross-device handoff (QR code → phone scan → result posted back).
 * Detailed protocol lives in `src/embed/handoff.ts`.
 */
export type EmbedHandoffConfig = HandoffConfig;

/** Final size recommendation surfaced to the host. */
export interface EmbedSizeResult {
  uk: string;
  us: string;
  eu: string;
  mondopointMm: number;
  /** 0..1, how well the recommended shoe maps to the foot. */
  fitScore: number;
  /** 0..1, accepted measurement quality capped by catalogue evidence. */
  recommendationConfidence: number;
  /** Which system the host should prefer (echo of {@link EmbedConfig.sizeSystem}). */
  preferred: SizeSystem;
}

export interface EmbedScanSummary {
  scanId: string;
  lengthMm: number;
  widthMm: number;
  measurementConfidence: number;
  widthToLengthRatio: number;
  capturedAtEpochMs: number;
}

// ─── Parent → iframe ──────────────────────────────────────────────────────
export type HostToEmbedMessage =
  { type: "fitsense:configure"; config: EmbedConfig } | { type: "fitsense:close-ack" };

// ─── iframe → Parent ──────────────────────────────────────────────────────
export type EmbedToHostMessage =
  | { type: "fitsense:ready"; version: string }
  | { type: "fitsense:resize"; height: number }
  | { type: "fitsense:scan"; scan: EmbedScanSummary }
  | { type: "fitsense:size"; size: EmbedSizeResult; scan: EmbedScanSummary }
  | { type: "fitsense:apply"; size: EmbedSizeResult; scan: EmbedScanSummary }
  | { type: "fitsense:close" }
  | { type: "fitsense:error"; message: string };

// ─── Public SDK surface (window.FitSense) ────────────────────────────────
export interface OpenOptions extends EmbedConfig {
  /** Fires when the user accepts the recommended size. */
  onSize?: (size: EmbedSizeResult, scan: EmbedScanSummary) => void;
  /** Fires every time a scan completes (before user clicks "Use this size"). */
  onScan?: (scan: EmbedScanSummary) => void;
  /** Fires when the modal closes (any reason). */
  onClose?: () => void;
  /** Override iframe origin (default: same-origin to the SDK script). */
  origin?: string;
  /**
   * Element to mount the embed into. If omitted, opens as a modal overlay.
   * When provided, the iframe fills the container.
   */
  container?: HTMLElement | string;
}

export interface FitSenseGlobal {
  /** Set defaults applied to every {@link open} call on this page. */
  init: (defaults: Partial<OpenOptions>) => void;
  /** Open the fit-finder. Returns a handle with a `close()` method. */
  open: (options?: OpenOptions) => { close: () => void };
  /** Library version string. */
  version: string;
}

/** Build the iframe URL with embed config encoded as query params. */
export function buildEmbedUrl(base: string, cfg: EmbedConfig): string {
  const url = new URL(base);
  url.searchParams.set("embed", "1");
  if (cfg.productId) url.searchParams.set("productId", cfg.productId);
  if (cfg.brand) url.searchParams.set("brand", cfg.brand);
  if (cfg.category) url.searchParams.set("category", cfg.category);
  if (cfg.sizeSystem) url.searchParams.set("sizeSystem", cfg.sizeSystem);
  if (cfg.storeName) url.searchParams.set("storeName", cfg.storeName);
  if (cfg.locale) url.searchParams.set("locale", cfg.locale);
  if (cfg.apiKey) url.searchParams.set("apiKey", cfg.apiKey);
  if (cfg.theme) {
    url.searchParams.set("theme", encodeTheme(cfg.theme));
  }
  if (cfg.handoff?.sessionId) {
    url.searchParams.set("session", cfg.handoff.sessionId);
  }
  if (cfg.handoff?.publishToken) {
    url.searchParams.set("pt", cfg.handoff.publishToken);
  }
  if (cfg.handoff?.baseUrl) {
    url.searchParams.set("handoffBase", cfg.handoff.baseUrl);
  }
  if (cfg.handoff?.transport && cfg.handoff.transport !== "auto") {
    url.searchParams.set("handoffMode", cfg.handoff.transport);
  }
  return url.toString();
}

export function encodeTheme(theme: EmbedTheme): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(theme))));
}

export function decodeTheme(encoded: string): EmbedTheme {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded)))) as EmbedTheme;
  } catch {
    return {};
  }
}

/** Read an {@link EmbedConfig} from the current URL's query string. */
export function readEmbedConfigFromUrl(href: string): EmbedConfig {
  const url = new URL(href);
  const themeRaw = url.searchParams.get("theme");
  const session = url.searchParams.get("session") ?? undefined;
  const publishToken = url.searchParams.get("pt") ?? undefined;
  const handoffBase =
    url.searchParams.get("handoffBase") ?? resolveHandoffBaseUrl(undefined);
  const handoffMode = url.searchParams.get("handoffMode") as
    "http" | "broadcast" | null;
  const handoff: EmbedConfig["handoff"] =
    session || publishToken || handoffBase || handoffMode
      ? {
          sessionId: session,
          publishToken,
          baseUrl: handoffBase,
          transport: handoffMode ?? (handoffBase ? "auto" : undefined),
        }
      : undefined;
  return {
    productId: url.searchParams.get("productId") ?? undefined,
    brand: url.searchParams.get("brand") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    sizeSystem: (url.searchParams.get("sizeSystem") as SizeSystem | null) ?? undefined,
    storeName: url.searchParams.get("storeName") ?? undefined,
    locale: url.searchParams.get("locale") ?? undefined,
    apiKey: url.searchParams.get("apiKey") ?? undefined,
    theme: themeRaw ? decodeTheme(themeRaw) : undefined,
    handoff,
  };
}
