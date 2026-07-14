import type { EmbedHandoffConfig } from "../../embed/types";
import { resolveHandoffBaseUrl } from "./config";

/** Merge embed handoff options with app-wide API defaults. */
export function resolveEmbedHandoffConfig(
  cfg?: EmbedHandoffConfig,
): EmbedHandoffConfig | undefined {
  const baseUrl = resolveHandoffBaseUrl(cfg?.baseUrl);
  if (!cfg && baseUrl === undefined) return undefined;
  const merged: EmbedHandoffConfig = { ...(cfg ?? {}) };
  if (baseUrl !== undefined) {
    merged.baseUrl = baseUrl;
    merged.transport = merged.transport ?? "auto";
  }
  if (!merged.sessionId && !merged.baseUrl && !merged.transport) {
    return undefined;
  }
  return merged;
}
