/**
 * FitSense AI · Partner embed SDK
 *
 * Ship this file as `embed.js`. Hosts include it with a single tag:
 *
 *   <script src="https://cdn.fitsense.ai/embed.js" defer></script>
 *
 * From that point on they can either:
 *
 *   1. Declarative — annotate any trigger element with `data-fitsense`
 *      plus configuration attributes (`data-product-id`, `data-brand`,
 *      `data-size-system`, `data-store-name`, `data-theme-*`). The SDK
 *      auto-binds click handlers, opens a modal iframe, and forwards the
 *      eventual size recommendation to a `data-on-size` global callback.
 *
 *   2. Imperative — `window.FitSense.open({ productId, brand, theme,
 *      onSize, onClose })` opens the modal programmatically and returns
 *      a handle with a `close()` method.
 *
 * The SDK never touches host CSS or DOM outside its own modal container,
 * so dropping it in is non-invasive.
 */

import { resolveEmbedHandoffConfig } from "../lib/api/handoffConfig";
import {
  buildEmbedUrl,
  type EmbedConfig,
  type EmbedScanSummary,
  type EmbedSizeResult,
  type EmbedTheme,
  type EmbedToHostMessage,
  type FitSenseGlobal,
  type OpenOptions,
  type SizeSystem,
} from "./types";

const VERSION = "1.0.0";

/** Resolve the iframe URL from the <script> tag itself by default. */
function resolveDefaultEmbedUrl(): string {
  const current = document.currentScript as HTMLScriptElement | null;
  const src = current?.src ?? guessOwnScriptSrc();
  if (!src) return "/?embed=1";
  try {
    const url = new URL(src);
    url.pathname = url.pathname.replace(/embed\.js.*$/, "");
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "/?embed=1";
  }
}

function guessOwnScriptSrc(): string | null {
  const scripts = Array.from(document.querySelectorAll("script[src]"));
  for (const s of scripts) {
    const src = (s as HTMLScriptElement).src;
    if (/fitsense[^/]*embed(?:\.[\w-]+)?\.js/.test(src)) return src;
    if (/\/embed(?:\.[\w-]+)?\.js/.test(src) && /fitsense/i.test(src))
      return src;
  }
  return null;
}

const defaultEmbedUrl = resolveDefaultEmbedUrl();

/** Page-wide defaults the host can pre-configure once with `init()`. */
const globalDefaults: Partial<OpenOptions> = {};

const apiHandoffDefaults = resolveEmbedHandoffConfig();
if (apiHandoffDefaults) {
  globalDefaults.handoff = apiHandoffDefaults;
}

function withDefaults(options: OpenOptions = {}): OpenOptions {
  return {
    ...globalDefaults,
    ...options,
    theme: { ...globalDefaults.theme, ...options.theme },
    handoff: resolveEmbedHandoffConfig({
      ...globalDefaults.handoff,
      ...options.handoff,
    }),
  };
}

/** Resolve `container` to an HTMLElement (or null for modal mode). */
function resolveContainer(
  container?: HTMLElement | string,
): HTMLElement | null {
  if (!container) return null;
  if (typeof container === "string") {
    return document.querySelector(container);
  }
  return container;
}

/** Internal: build the iframe URL + the expected origin for postMessage. */
function buildUrlAndOrigin(options: OpenOptions): {
  url: string;
  origin: string;
} {
  const base = (options as { url?: string }).url ?? defaultEmbedUrl;
  const cfg: EmbedConfig = {
    productId: options.productId,
    brand: options.brand,
    category: options.category,
    sizeSystem: options.sizeSystem,
    storeName: options.storeName,
    locale: options.locale,
    apiKey: options.apiKey,
    theme: options.theme,
    inline: !!options.container,
    handoff: resolveEmbedHandoffConfig(options.handoff),
  };
  const url = buildEmbedUrl(base, cfg);
  let origin = options.origin ?? "";
  if (!origin) {
    try {
      origin = new URL(url).origin;
    } catch {
      origin = "*";
    }
  }
  return { url, origin };
}

// ─── Modal renderer ──────────────────────────────────────────────────────

interface Instance {
  destroy: () => void;
}

function openInstance(options: OpenOptions): Instance {
  const opts = withDefaults(options);
  const { url, origin } = buildUrlAndOrigin(opts);
  const explicitContainer = resolveContainer(opts.container);

  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.title = "FitSense fit finder";
  iframe.setAttribute("allow", "camera; fullscreen");
  iframe.setAttribute("allowfullscreen", "true");
  iframe.style.cssText = explicitContainer
    ? "width:100%;height:100%;border:0;display:block;background:transparent;"
    : "width:100%;height:100%;border:0;display:block;background:transparent;";

  let modal: HTMLDivElement | null = null;
  let dialog: HTMLDivElement | null = null;
  let host: HTMLElement;

  if (explicitContainer) {
    host = explicitContainer;
    host.innerHTML = "";
    host.appendChild(iframe);
  } else {
    modal = document.createElement("div");
    modal.setAttribute("data-fitsense-modal", "");
    modal.style.cssText = [
      "position:fixed",
      "inset:0",
      "background:rgba(8,12,22,0.55)",
      "backdrop-filter:blur(6px)",
      "-webkit-backdrop-filter:blur(6px)",
      "display:flex",
      "align-items:flex-end",
      "justify-content:center",
      "z-index:2147483646",
      "opacity:0",
      "transition:opacity 0.18s ease",
    ].join(";");

    dialog = document.createElement("div");
    dialog.style.cssText = [
      "width:100%",
      "max-width:440px",
      "max-height:92vh",
      "background:transparent",
      "border-radius:20px 20px 0 0",
      "overflow:hidden",
      "box-shadow:0 -20px 60px -10px rgba(0,0,0,0.45)",
      "transform:translateY(16px)",
      "transition:transform 0.22s ease",
    ].join(";");

    const mediaQuery = window.matchMedia("(min-width: 720px)");
    const applyDesktopLayout = (mq: MediaQueryList | MediaQueryListEvent) => {
      if (!modal || !dialog) return;
      if (mq.matches) {
        modal.style.alignItems = "center";
        dialog.style.borderRadius = "20px";
        dialog.style.maxHeight = "min(720px, 92vh)";
        dialog.style.height = "min(720px, 92vh)";
      } else {
        modal.style.alignItems = "flex-end";
        dialog.style.borderRadius = "20px 20px 0 0";
        dialog.style.height = "82vh";
        dialog.style.maxHeight = "92vh";
      }
    };
    applyDesktopLayout(mediaQuery);
    mediaQuery.addEventListener?.("change", applyDesktopLayout);

    dialog.appendChild(iframe);
    modal.appendChild(dialog);
    document.body.appendChild(modal);

    // animate in
    requestAnimationFrame(() => {
      if (!modal || !dialog) return;
      modal.style.opacity = "1";
      dialog.style.transform = "translateY(0)";
    });

    host = modal;
  }

  let destroyed = false;
  let removeListener: () => void = () => undefined;

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    removeListener();
    if (modal && dialog) {
      modal.style.opacity = "0";
      dialog.style.transform = "translateY(16px)";
      setTimeout(() => {
        modal?.parentNode?.removeChild(modal);
      }, 220);
    } else if (explicitContainer) {
      try {
        explicitContainer.removeChild(iframe);
      } catch {
        // already gone
      }
    }
    opts.onClose?.();
  };

  const onBackdropClick = (e: MouseEvent) => {
    if (modal && e.target === modal) destroy();
  };
  modal?.addEventListener("click", onBackdropClick);

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && modal) destroy();
  };
  if (modal) document.addEventListener("keydown", onKeydown);

  // Bridge: receive events from iframe
  const handler = (event: MessageEvent) => {
    if (origin !== "*" && event.origin !== origin) return;
    const data = event.data as EmbedToHostMessage | undefined;
    if (!data || typeof data !== "object" || typeof data.type !== "string")
      return;
    if (!data.type.startsWith("fitsense:")) return;
    switch (data.type) {
      case "fitsense:ready":
        // Re-send config in case query-params were dropped by a proxy.
        iframe.contentWindow?.postMessage(
          {
            type: "fitsense:configure",
            config: {
              productId: opts.productId,
              brand: opts.brand,
              category: opts.category,
              sizeSystem: opts.sizeSystem,
              storeName: opts.storeName,
              locale: opts.locale,
              apiKey: opts.apiKey,
              theme: opts.theme,
              inline: !!opts.container,
              handoff: opts.handoff,
            } satisfies EmbedConfig,
          },
          origin,
        );
        break;
      case "fitsense:scan":
        opts.onScan?.(data.scan as EmbedScanSummary);
        break;
      case "fitsense:size":
        // The recommendation is available, but the user hasn't pressed
        // "Use this size" yet. Surface it for analytics, don't auto-apply.
        opts.onSize?.(
          data.size as EmbedSizeResult,
          data.scan as EmbedScanSummary,
        );
        break;
      case "fitsense:apply":
        opts.onSize?.(
          data.size as EmbedSizeResult,
          data.scan as EmbedScanSummary,
        );
        destroy();
        break;
      case "fitsense:close":
        destroy();
        break;
      case "fitsense:resize":
        if (explicitContainer && typeof data.height === "number") {
          explicitContainer.style.height = `${Math.max(360, data.height)}px`;
        }
        break;
      case "fitsense:error":
        console.error("[FitSense]", data.message);
        break;
    }
  };
  window.addEventListener("message", handler);
  removeListener = () => {
    window.removeEventListener("message", handler);
    modal?.removeEventListener("click", onBackdropClick);
    document.removeEventListener("keydown", onKeydown);
  };

  return { destroy };
}

// ─── Public API attached to window ───────────────────────────────────────

const FitSense: FitSenseGlobal = {
  version: VERSION,
  init(defaults) {
    Object.assign(globalDefaults, defaults);
    if (defaults.theme) {
      globalDefaults.theme = { ...globalDefaults.theme, ...defaults.theme };
    }
    if (defaults.handoff !== undefined) {
      globalDefaults.handoff = resolveEmbedHandoffConfig({
        ...globalDefaults.handoff,
        ...defaults.handoff,
      });
    }
  },
  open(options) {
    const instance = openInstance(options ?? {});
    return { close: instance.destroy };
  },
};

// Allow chaining: `FitSense.init({...}).open(...)` is not supported, but
// inheriting the queue pattern used by other widgets (Klarna, Stripe, GA)
// is — pre-load a queue at `window.FitSense = window.FitSense || []` and
// we'll replay it once the SDK boots.
const previous = (window as unknown as { FitSense?: unknown }).FitSense;
(window as unknown as { FitSense: FitSenseGlobal }).FitSense = FitSense;

if (Array.isArray(previous)) {
  for (const call of previous as Array<[keyof FitSenseGlobal, unknown]>) {
    const [method, args] = call;
    const fn = (FitSense as unknown as Record<string, unknown>)[method];
    if (typeof fn === "function") {
      try {
        (fn as (...a: unknown[]) => unknown).apply(
          FitSense,
          Array.isArray(args) ? args : [args],
        );
      } catch (err) {
        console.error("[FitSense] queued call failed", err);
      }
    }
  }
}

// ─── Auto-bind declarative triggers ──────────────────────────────────────

interface TriggerDataset {
  productId?: string;
  brand?: string;
  category?: string;
  sizeSystem?: SizeSystem;
  storeName?: string;
  locale?: string;
  apiKey?: string;
  themePrimary?: string;
  themeBg?: string;
  themeText?: string;
  themeRadius?: string;
  themeFont?: string;
  themeMode?: "light" | "dark";
  handoffBase?: string;
  handoffMode?: "http" | "broadcast" | "auto";
  onSize?: string;
  onClose?: string;
}

function readTriggerOptions(el: HTMLElement): OpenOptions {
  const d = el.dataset as unknown as TriggerDataset;
  const theme: EmbedTheme = {};
  if (d.themePrimary) theme.primary = d.themePrimary;
  if (d.themeBg) theme.bg = d.themeBg;
  if (d.themeText) theme.text = d.themeText;
  if (d.themeRadius) theme.radius = d.themeRadius;
  if (d.themeFont) theme.font = d.themeFont;
  if (d.themeMode) theme.mode = d.themeMode;
  const onSizeName = d.onSize;
  const onCloseName = d.onClose;
  const handoff = resolveEmbedHandoffConfig(
    d.handoffBase || d.handoffMode
      ? {
          baseUrl: d.handoffBase,
          transport: d.handoffMode,
        }
      : undefined,
  );
  return {
    productId: d.productId,
    brand: d.brand,
    category: d.category,
    sizeSystem: d.sizeSystem,
    storeName: d.storeName,
    locale: d.locale,
    apiKey: d.apiKey,
    theme,
    handoff,
    onSize:
      onSizeName && typeof window !== "undefined"
        ? (size, scan) => {
            const fn = (window as unknown as Record<string, unknown>)[
              onSizeName
            ];
            if (typeof fn === "function") {
              (fn as (a: EmbedSizeResult, b: EmbedScanSummary) => void)(
                size,
                scan,
              );
            }
          }
        : undefined,
    onClose:
      onCloseName && typeof window !== "undefined"
        ? () => {
            const fn = (window as unknown as Record<string, unknown>)[
              onCloseName
            ];
            if (typeof fn === "function") {
              (fn as () => void)();
            }
          }
        : undefined,
  };
}

const ATTR = "data-fitsense";
const BOUND = "data-fitsense-bound";

function bindTrigger(el: HTMLElement): void {
  if (el.hasAttribute(BOUND)) return;
  el.setAttribute(BOUND, "true");
  el.addEventListener("click", (event) => {
    event.preventDefault();
    FitSense.open(readTriggerOptions(el));
  });
}

function scanDocument(): void {
  document.querySelectorAll<HTMLElement>(`[${ATTR}]`).forEach(bindTrigger);
}

function observe(): void {
  if (typeof MutationObserver === "undefined") return;
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.(`[${ATTR}]`)) bindTrigger(node);
        node.querySelectorAll?.<HTMLElement>(`[${ATTR}]`).forEach(bindTrigger);
      });
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      scanDocument();
      observe();
    });
  } else {
    scanDocument();
    observe();
  }
}
