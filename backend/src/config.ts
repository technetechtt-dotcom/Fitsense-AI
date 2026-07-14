import "dotenv/config";

function parseOrigins(raw: string | undefined): string[] | true {
  if (!raw || raw === "*") return true;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT) || 8787,
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: parseOrigins(process.env.CORS_ORIGIN),
  handoffTtlMs: Number(process.env.HANDOFF_TTL_MS) || 5 * 60 * 1000,
  skipAuth: process.env.SKIP_AUTH === "true",
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  },
} as const;
