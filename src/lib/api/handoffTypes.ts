/** Transport-neutral options shared by the API client and partner embed. */
export interface HandoffConfig {
  baseUrl?: string;
  transport?: "http" | "broadcast" | "auto";
  pollMs?: number;
  sessionId?: string;
}
