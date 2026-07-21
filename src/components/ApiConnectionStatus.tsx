import { useEffect, useState } from "react";
import { getApiBaseUrl, isApiConfigured } from "../lib/api/config";
import { checkApiHealth, type ApiHealth } from "../lib/api/status";

/** Shows FitSense API reachability when VITE_API_BASE_URL is set. */
export function ApiConnectionStatus() {
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [checking, setChecking] = useState(false);

  const base = getApiBaseUrl();
  const configured = isApiConfigured();

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    setChecking(true);
    void checkApiHealth().then((h) => {
      if (!cancelled) {
        setHealth(h);
        setChecking(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [configured]);

  if (!configured) return null;

  const label = base === "" ? "same origin (dev proxy)" : (base ?? "API");
  const status = checking
    ? "Checking…"
    : health?.ok
      ? "Connected"
      : "Unreachable — start the API (`npm run dev:api`)";
  const syncNote =
    health?.ok && health.firestore === false
      ? " Handoff works; cloud sync needs Firebase Admin on the server."
      : "";

  return (
    <p className="text-xs text-ink-muted leading-relaxed">
      FitSense API ({label}):{" "}
      <span className={health?.ok ? "text-neon" : "text-warning"}>{status}</span>
      {syncNote}
    </p>
  );
}
