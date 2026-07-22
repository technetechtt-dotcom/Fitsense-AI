/**
 * Locale → regional sizing defaults and UI copy for SA pilot languages.
 * Embed `locale` (BCP 47) selects a pack; sizing convention drives default
 * SizeSystem when the host does not set `sizeSystem` explicitly.
 */

import type { SizeSystem } from "../../embed/types";

export type LocaleId = "en-ZA" | "af-ZA" | "xh-ZA" | "zu-ZA" | "en";

export interface LocalePack {
  id: LocaleId;
  label: string;
  /** Default size system for this locale when unset by the host. */
  defaultSizeSystem: SizeSystem;
  /** Prefer smaller images / skip catalogue art when Save-Data or low-end. */
  preferLowData: boolean;
  strings: {
    scanCta: string;
    useThisSize: string;
    retake: string;
    weakNetwork: string;
    offlineQueued: string;
  };
}

const PACKS: Record<LocaleId, LocalePack> = {
  "en-ZA": {
    id: "en-ZA",
    label: "English (South Africa)",
    defaultSizeSystem: "uk",
    preferLowData: false,
    strings: {
      scanCta: "Scan your feet",
      useThisSize: "Use this size",
      retake: "Retake",
      weakNetwork: "Slow connection — working offline where possible.",
      offlineQueued: "Saved on device. Will sync when online.",
    },
  },
  "af-ZA": {
    id: "af-ZA",
    label: "Afrikaans",
    defaultSizeSystem: "uk",
    preferLowData: false,
    strings: {
      scanCta: "Skandeer jou voete",
      useThisSize: "Gebruik hierdie grootte",
      retake: "Neem weer",
      weakNetwork: "Stadige verbinding — werk vanlyn waar moontlik.",
      offlineQueued: "Op toestel gestoor. Sal sinchroniseer wanneer aanlyn.",
    },
  },
  "xh-ZA": {
    id: "xh-ZA",
    label: "isiXhosa",
    defaultSizeSystem: "uk",
    preferLowData: true,
    strings: {
      scanCta: "Skina iinyawo zakho",
      useThisSize: "Sebenzisa olu bukhulu",
      retake: "Phinda uthathe",
      weakNetwork: "Uqhagamshelo olucothayo — sisebenza ngaphandle kwe-intanethi.",
      offlineQueued: "Kugcinwe esixhobenii. Kuzahambelana xa ukwi-intanethi.",
    },
  },
  "zu-ZA": {
    id: "zu-ZA",
    label: "isiZulu",
    defaultSizeSystem: "uk",
    preferLowData: true,
    strings: {
      scanCta: "Skena izinyawo zakho",
      useThisSize: "Sebenzisa lesi sisindo",
      retake: "Thatha futhi",
      weakNetwork: "Uxhumano olucothayo — sisebenza ngaphandle kwe-inthanethi.",
      offlineQueued: "Kugcinwe kudivaysi. Kuzovumelanisa uma ku-inthanethi.",
    },
  },
  en: {
    id: "en",
    label: "English",
    defaultSizeSystem: "uk",
    preferLowData: false,
    strings: {
      scanCta: "Scan your feet",
      useThisSize: "Use this size",
      retake: "Retake",
      weakNetwork: "Slow connection — working offline where possible.",
      offlineQueued: "Saved on device. Will sync when online.",
    },
  },
};

export function resolveLocale(raw?: string | null): LocalePack {
  if (!raw) return PACKS["en-ZA"];
  const normalized = raw.trim().replace("_", "-");
  if (normalized in PACKS) return PACKS[normalized as LocaleId];
  const base = normalized.split("-")[0]?.toLowerCase();
  if (base === "af") return PACKS["af-ZA"];
  if (base === "xh") return PACKS["xh-ZA"];
  if (base === "zu") return PACKS["zu-ZA"];
  if (base === "en") return PACKS["en-ZA"];
  return PACKS.en;
}

/** Map locale → default size system (UK for Southern Africa). */
export function sizeSystemForLocale(
  locale?: string | null,
  explicit?: SizeSystem | null,
): SizeSystem {
  if (explicit) return explicit;
  return resolveLocale(locale).defaultSizeSystem;
}
