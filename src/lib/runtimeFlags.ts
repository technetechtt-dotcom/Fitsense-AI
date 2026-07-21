export function isDemoScanEnabled(): boolean {
  const raw = import.meta.env.VITE_ENABLE_DEMO_SCAN;
  if (raw === undefined || raw === "") return import.meta.env.DEV;
  return raw === "true";
}
