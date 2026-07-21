import { useEffect } from "react";
import type { EmbedTheme } from "./types";

/**
 * Applies an [EmbedTheme] by writing it onto the document root as
 * CSS custom properties. Keeping this purely declarative means the
 * iframe re-themes instantly when the host sends a new theme via
 * postMessage — no React re-render needed for the actual styling.
 */
export function useApplyEmbedTheme(theme: EmbedTheme | undefined): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-fs-embed", "true");
    if (theme?.mode === "dark") {
      root.setAttribute("data-fs-mode", "dark");
    } else {
      root.removeAttribute("data-fs-mode");
    }
    const map: Array<[keyof EmbedTheme, string]> = [
      ["primary", "--fs-primary"],
      ["bg", "--fs-bg"],
      ["text", "--fs-text"],
      ["textMuted", "--fs-text-muted"],
      ["surface", "--fs-surface"],
      ["border", "--fs-border"],
      ["radius", "--fs-radius"],
      ["font", "--fs-font"],
    ];
    for (const [key, cssVar] of map) {
      const value = theme?.[key];
      if (typeof value === "string" && value.length > 0) {
        root.style.setProperty(cssVar, value);
      } else {
        root.style.removeProperty(cssVar);
      }
    }
    // Heuristic contrast for the primary CTA label.
    const contrast = pickContrast(theme?.primary);
    if (contrast) {
      root.style.setProperty("--fs-primary-contrast", contrast);
    } else {
      root.style.removeProperty("--fs-primary-contrast");
    }
  }, [theme]);
}

/** Best-effort black/white contrast for an arbitrary CSS colour. */
function pickContrast(color?: string): string | null {
  if (!color) return null;
  const rgb = parseColor(color);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  const luminance =
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
  return luminance > 0.42 ? "#0a0f1c" : "#ffffff";
}

function parseColor(color: string): [number, number, number] | null {
  const hex = color.trim();
  if (/^#([0-9a-f]{3})$/i.test(hex)) {
    const r = parseInt(hex[1] + hex[1], 16);
    const g = parseInt(hex[2] + hex[2], 16);
    const b = parseInt(hex[3] + hex[3], 16);
    return [r, g, b];
  }
  if (/^#([0-9a-f]{6})$/i.test(hex)) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }
  const m = hex.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const parts = m[1].split(",").map((n) => parseFloat(n.trim()));
    if (parts.length >= 3 && parts.every((n) => Number.isFinite(n))) {
      return [parts[0], parts[1], parts[2]];
    }
  }
  return null;
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
