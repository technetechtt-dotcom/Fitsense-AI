/**
 * Locale → regional sizing defaults and UI copy for SA pilot languages.
 * Embed `locale` (BCP 47) selects a pack; sizing convention drives default
 * SizeSystem when the host does not set `sizeSystem` explicitly.
 */

import type { SizeSystem } from "../../types";

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
    confidenceHigh: string;
    confidenceMedium: string;
    confidenceLow: string;
    confidenceLabel: string;
    unsupportedDevice: string;
    localAvailability: string;
    reserveHold: string;
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
      confidenceHigh: "High confidence — suitable for sizing.",
      confidenceMedium: "Moderate confidence — confirm fit in store if unsure.",
      confidenceLow: "Low confidence — retake before relying on this size.",
      confidenceLabel: "Recommendation confidence",
      unsupportedDevice:
        "This device cannot run AR measurement. Use reference-object scan, or try a supported phone.",
      localAvailability: "Available nearby",
      reserveHold: "Reserve for click & collect",
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
      confidenceHigh: "Hoë vertroue — geskik vir groottebepaling.",
      confidenceMedium: "Matige vertroue — bevestig pas in die winkel indien onseker.",
      confidenceLow: "Lae vertroue — neem weer voordat jy hierdie grootte gebruik.",
      confidenceLabel: "Aanbevelingvertroue",
      unsupportedDevice:
        "Hierdie toestel kan nie AR-meting doen nie. Gebruik verwysingsobjek-skandering, of probeer 'n ondersteunde foon.",
      localAvailability: "Beskikbaar naby jou",
      reserveHold: "Bespreek vir klik-en-versamel",
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
      confidenceHigh: "Ukuzithemba okuphezulu.",
      confidenceMedium: "Ukuzithemba okuphakathi.",
      confidenceLow: "Ukuzithemba okuphantsi — phinda uthathe.",
      confidenceLabel: "Ukuzithemba kwengcebiso",
      unsupportedDevice: "Esi sixhobo asikwazi ukulinganisa nge-AR.",
      localAvailability: "Iyafumaneka kufutshane",
      reserveHold: "Gcina ukuze uthathe evenkileni",
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
      confidenceHigh: "Ukuzethemba okuphezulu.",
      confidenceMedium: "Ukuzethemba okuphakathi.",
      confidenceLow: "Ukuzethemba okuphansi — thatha futhi.",
      confidenceLabel: "Ukuzethemba kwesincomo",
      unsupportedDevice: "Leli divayisi alikwazi ukulinganisa nge-AR.",
      localAvailability: "Iyatholakala eduze",
      reserveHold: "Beka eceleni ukuze uthathe esitolo",
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
      confidenceHigh: "High confidence — suitable for sizing.",
      confidenceMedium: "Moderate confidence — confirm fit in store if unsure.",
      confidenceLow: "Low confidence — retake before relying on this size.",
      confidenceLabel: "Recommendation confidence",
      unsupportedDevice:
        "This device cannot run AR measurement. Use reference-object scan, or try a supported phone.",
      localAvailability: "Available nearby",
      reserveHold: "Reserve for click & collect",
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
