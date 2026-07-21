import { resolveHandoffBaseUrl } from "./config";
import type { HandoffConfig } from "./handoffTypes";

/** Merge embed handoff options with app-wide API defaults. */
export function resolveEmbedHandoffConfig(
  cfg?: HandoffConfig,
): HandoffConfig | undefined {
  const baseUrl = resolveHandoffBaseUrl(cfg?.baseUrl);
  if (!cfg && baseUrl === undefined) return undefined;
  const merged: HandoffConfig = { ...(cfg ?? {}) };
  if (baseUrl !== undefined) {
    merged.baseUrl = baseUrl;
    merged.transport = merged.transport ?? "auto";
  }
  if (!merged.sessionId && !merged.baseUrl && !merged.transport) {
    return undefined;
  }
  return merged;
}
