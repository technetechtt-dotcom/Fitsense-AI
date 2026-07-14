/**
 * Static foot-length → shoe-size table.
 *
 * Mirrors android/.../recommendation/SizeMappingTable.kt.
 * Values are based on industry-standard adult unisex sneaker charts.
 */

export interface SizeTriplet {
  uk: string;
  us: string;
  eu: string;
  mondopointMm: number;
}

interface Row {
  /** Upper bound (mm). Rows are sorted ascending. */
  max: number;
  uk: string;
  us: string;
  eu: string;
}

const ROWS: Row[] = [
  { max: 220, uk: "2", us: "3", eu: "35" },
  { max: 225, uk: "2.5", us: "3.5", eu: "35.5" },
  { max: 230, uk: "3", us: "4", eu: "36" },
  { max: 235, uk: "3.5", us: "4.5", eu: "36.5" },
  { max: 240, uk: "4", us: "5", eu: "37" },
  { max: 245, uk: "4.5", us: "5.5", eu: "37.5" },
  { max: 250, uk: "5", us: "6", eu: "38" },
  { max: 255, uk: "5.5", us: "6.5", eu: "38.5" },
  { max: 260, uk: "6", us: "7", eu: "39" },
  { max: 265, uk: "6.5", us: "7.5", eu: "40" },
  { max: 270, uk: "7", us: "8", eu: "40.5" },
  { max: 275, uk: "7.5", us: "8.5", eu: "41" },
  { max: 280, uk: "8", us: "9", eu: "42" },
  { max: 285, uk: "8.5", us: "9.5", eu: "42.5" },
  { max: 290, uk: "9", us: "10", eu: "43" },
  { max: 295, uk: "9.5", us: "10.5", eu: "44" },
  { max: 300, uk: "10", us: "11", eu: "44.5" },
  { max: 305, uk: "10.5", us: "11.5", eu: "45" },
  { max: 310, uk: "11", us: "12", eu: "45.5" },
  { max: 315, uk: "11.5", us: "12.5", eu: "46" },
  { max: 320, uk: "12", us: "13", eu: "47" },
  { max: 325, uk: "12.5", us: "13.5", eu: "47.5" },
  { max: 330, uk: "13", us: "14", eu: "48" },
];

/** Heel-space comfort margin appended to raw foot length before lookup. */
export const SIZE_HEEL_MARGIN_MM = 8.0;

export function sizeForLengthMm(lengthMm: number): SizeTriplet {
  const mondopoint = Math.round(Math.min(380, Math.max(180, lengthMm)));
  const row = ROWS.find((r) => mondopoint <= r.max) ?? ROWS[ROWS.length - 1];
  return { uk: row.uk, us: row.us, eu: row.eu, mondopointMm: mondopoint };
}

export function euAsNumber(eu: string): number {
  const n = parseFloat(eu.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Reverse-lookup: given an arbitrary EU number (possibly half-sized or
 * fractional after applying a brand delta) return the nearest published
 * row's UK/US/EU/Mondopoint triplet.
 *
 * Used by the Brand Fit Cheat Sheet to show "Nike UK 8, Adidas UK 8.5,
 * Puma UK 9" — same foot, different per-brand size.
 */
export function sizeForEu(eu: number): SizeTriplet {
  if (!Number.isFinite(eu)) return ROWS[0] as unknown as SizeTriplet;
  let best = ROWS[0];
  let bestDelta = Infinity;
  for (const row of ROWS) {
    const delta = Math.abs(euAsNumber(row.eu) - eu);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = row;
    }
  }
  // We don't have the original mondopoint here — synthesise a close
  // approximation from the EU row's upper bound (mondopoint ≈ row.max − 2.5).
  return {
    uk: best.uk,
    us: best.us,
    eu: best.eu,
    mondopointMm: Math.max(0, best.max - 2.5),
  };
}
