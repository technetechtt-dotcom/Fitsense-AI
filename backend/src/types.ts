/** Matches `HandoffPayload` in the web embed (`src/embed/handoff.ts`). */
export interface HandoffPayload {
  size: {
    uk: string;
    us: string;
    eu: string;
    mondopointMm: number;
    fitScore?: number;
    recommendationConfidence?: number;
    preferred?: "uk" | "us" | "eu" | "mondopoint";
  };
  scan: {
    scanId: string;
    lengthMm: number;
    widthMm: number;
    measurementConfidence?: number;
    widthToLengthRatio?: number;
    capturedAtEpochMs: number;
  };
  completedAtEpochMs: number;
  v: 1;
}

export interface ApiErrorBody {
  error: string;
  message?: string;
}
