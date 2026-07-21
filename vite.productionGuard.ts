import { loadEnv } from "vite";

/**
 * A production bundle must never contain an enabled simulated scan path.
 * Runtime checks remain defense-in-depth; this guard fails the release itself.
 */
export function assertProductionFlags(mode: string): void {
  const env = loadEnv(mode, process.cwd(), "");
  validateProductionFlags(mode, env.VITE_ENABLE_DEMO_SCAN);
}

export function validateProductionFlags(
  mode: string,
  demoScanFlag: string | undefined,
): void {
  if (mode === "production" && demoScanFlag === "true") {
    throw new Error(
      "Production build blocked: VITE_ENABLE_DEMO_SCAN=true. Simulated measurements are development-only.",
    );
  }
}
