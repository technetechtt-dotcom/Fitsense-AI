import { Router } from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const devicesRouter = Router();

type DeviceCatalog = {
  version?: string;
  updatedAt?: string;
  minAndroidApi?: number;
  devices: Array<{
    manufacturer: string;
    modelContains: string[];
    status: string;
    region?: string;
    notes?: string;
    arRequired?: boolean;
    assistedOnly?: boolean;
  }>;
};

let cached: { at: number; body: DeviceCatalog } | null = null;

function loadCatalog(): DeviceCatalog {
  const now = Date.now();
  if (cached && now - cached.at < 60_000) return cached.body;
  const here = dirname(fileURLToPath(import.meta.url));
  // Prefer repo docs path relative to cwd (Render rootDir=backend).
  const candidates = [
    join(process.cwd(), "..", "docs", "supported-devices.json"),
    join(process.cwd(), "docs", "supported-devices.json"),
    join(here, "..", "..", "..", "docs", "supported-devices.json"),
  ];
  let raw: string | null = null;
  for (const path of candidates) {
    try {
      raw = readFileSync(path, "utf8");
      break;
    } catch {
      // try next
    }
  }
  if (!raw) {
    return { devices: [], minAndroidApi: 26, version: "missing" };
  }
  const body = JSON.parse(raw) as DeviceCatalog;
  cached = { at: now, body };
  return body;
}

/**
 * Remote device cohort config for clients. Does not invent certification —
 * sample/uncertified devices remain launch-limited until Brannock study.
 */
devicesRouter.get("/devices/supported", (_req, res) => {
  const catalog = loadCatalog();
  res.setHeader("Cache-Control", "public, max-age=60");
  res.json({
    ...catalog,
    certified: false,
    note: "Cohorts marked certified only after n≥5 real Brannock study measurements. Current sample remains uncertified.",
  });
});
