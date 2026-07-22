/**
 * Low-cost phone / weak connectivity preferences.
 * Reduces catalogue imagery and prefers smaller capture probes without
 * disabling geometric measurement quality gates.
 */

const KEY = "fitsense:lowDataMode";

export function isLowDataMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(KEY) === "1") return true;
  } catch {
    // ignore
  }
  // Network Information API (Chrome Android)
  const conn = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") return true;
  return false;
}

export function setLowDataMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, enabled ? "1" : "0");
}

/** Strip heavy fields from catalogue products for low-data UIs. */
export function slimProductMedia<T extends { imageUrl?: string }>(product: T): T {
  if (!isLowDataMode()) return product;
  const next = { ...product };
  delete next.imageUrl;
  return next;
}
