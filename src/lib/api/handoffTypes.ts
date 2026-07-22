/** Transport-neutral options shared by the API client and partner embed. */
export interface HandoffConfig {
  baseUrl?: string;
  transport?: "http" | "broadcast" | "auto";
  pollMs?: number;
  sessionId?: string;
  /** Publish Bearer embedded in the phone QR URL (never send consume token in QR). */
  publishToken?: string;
}
