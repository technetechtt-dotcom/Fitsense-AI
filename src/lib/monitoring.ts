/**
 * Lightweight web operational monitoring — posts anonymised client errors
 * to the FitSense API when configured. Never send tokens or emails.
 */
import { getApiBaseUrl, isApiConfigured } from "./api/config";

export function installWebMonitoring(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (event) => {
    void reportClientError(event.message || "window.error", "web");
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason =
      event.reason instanceof Error
        ? event.reason.message
        : String(event.reason ?? "unhandledrejection");
    void reportClientError(reason, "web");
  });
}

export async function reportClientError(
  message: string,
  platform: "web" | "android" | "ios" | "unknown" = "web",
): Promise<void> {
  if (!isApiConfigured()) return;
  const base = getApiBaseUrl();
  if (base === null) return;
  const scrubbed = message.replace(/bearer\s+\S+/gi, "[redacted]").slice(0, 500);
  if (scrubbed.includes("@")) return;
  try {
    await fetch(`${base}/v1/telemetry/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        type: "client_error",
        message: scrubbed,
        platform,
        release: import.meta.env.VITE_APP_RELEASE ?? undefined,
      }),
      keepalive: true,
    });
  } catch {
    // never break the app for telemetry
  }
}
