import "dotenv/config";

function parseOrigins(raw: string | undefined): string[] | true {
  if (!raw || raw === "*") return true;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseNumber(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseChoice<const T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
  fallback: T,
  label: string,
): T {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if ((allowed as readonly string[]).includes(trimmed)) return trimmed as T;
  throw new Error(`${label} must be one of: ${allowed.join(", ")}`);
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return raw === "true";
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";
const corsOrigin = parseOrigins(process.env.CORS_ORIGIN);
const databaseUrl = process.env.DATABASE_URL?.trim();
const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const upstashRedisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
const syncStore = parseChoice(
  process.env.SYNC_STORE?.trim(),
  ["postgres"],
  "postgres",
  "SYNC_STORE",
);
const handoffStore = parseChoice(
  process.env.HANDOFF_STORE?.trim(),
  ["memory", "upstash", "postgres"],
  databaseUrl
    ? "postgres"
    : upstashRedisRestUrl && upstashRedisRestToken
      ? "upstash"
      : "memory",
  "HANDOFF_STORE",
);
const databaseSsl = parseBoolean(
  process.env.DATABASE_SSL,
  Boolean(databaseUrl?.includes("sslmode=require")) || isProduction,
);

const authSecret = process.env.AUTH_SECRET?.trim();
/** Production must set HANDOFF_SECRET explicitly and distinctly from AUTH_SECRET. */
const handoffSecret =
  process.env.HANDOFF_SECRET?.trim() || (!isProduction ? authSecret : undefined);

export const config = {
  port: parseNumber(process.env.PORT, 8787),
  nodeEnv,
  isProduction,
  trustProxy: process.env.TRUST_PROXY === "true" || isProduction,
  corsOrigin,
  jsonLimit: process.env.JSON_LIMIT ?? "512kb",
  handoffTtlMs: parseNumber(process.env.HANDOFF_TTL_MS, 5 * 60 * 1000),
  handoffStore,
  allowMemoryHandoff: process.env.ALLOW_MEMORY_HANDOFF_IN_PRODUCTION === "true",
  upstashRedisRestUrl,
  upstashRedisRestToken,
  syncStore,
  database: {
    url: databaseUrl,
    ssl: databaseSsl,
    sslRejectUnauthorized: parseBoolean(
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
      true,
    ),
  },
  rateLimit: {
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    globalMax: parseNumber(process.env.RATE_LIMIT_GLOBAL_MAX, 300),
    handoffReadMax: parseNumber(process.env.RATE_LIMIT_HANDOFF_READ_MAX, 60),
    handoffWriteMax: parseNumber(process.env.RATE_LIMIT_HANDOFF_WRITE_MAX, 20),
    syncMax: parseNumber(process.env.RATE_LIMIT_SYNC_MAX, 120),
    authMax: parseNumber(process.env.RATE_LIMIT_AUTH_MAX, 30),
  },
  skipAuth: process.env.SKIP_AUTH === "true",
  authSecret,
  handoffSecret,
  authKid: process.env.AUTH_KID?.trim() || "auth-v1",
  handoffKid: process.env.HANDOFF_KID?.trim() || "handoff-v1",
  accessTokenTtlMs: parseNumber(process.env.ACCESS_TOKEN_TTL_MS, 15 * 60 * 1000),
  refreshTokenTtlMs: parseNumber(
    process.env.REFRESH_TOKEN_TTL_MS,
    30 * 24 * 60 * 60 * 1000,
  ),
  challengeTtlMs: parseNumber(process.env.AUTH_CHALLENGE_TTL_MS, 5 * 60 * 1000),
  fitRecoveryTtlMs: parseNumber(
    process.env.FIT_RECOVERY_TTL_MS,
    90 * 24 * 60 * 60 * 1000,
  ),
  retention: {
    scanDays: parseNumber(process.env.RETENTION_SCAN_DAYS, 730),
    eventDays: parseNumber(process.env.RETENTION_EVENT_DAYS, 730),
    profileDays: parseNumber(process.env.RETENTION_PROFILE_DAYS, 730),
  },
} as const;

export function assertProductionConfig(): void {
  if (!config.isProduction) return;
  if (config.corsOrigin === true) {
    throw new Error("CORS_ORIGIN must be restricted in production.");
  }
  if (config.skipAuth) {
    throw new Error("SKIP_AUTH must never be enabled in production.");
  }
  if (config.handoffStore === "memory" && !config.allowMemoryHandoff) {
    throw new Error(
      "Production handoff requires HANDOFF_STORE=upstash, HANDOFF_STORE=postgres, or ALLOW_MEMORY_HANDOFF_IN_PRODUCTION=true.",
    );
  }
  if (config.handoffStore === "postgres" && !config.database.url) {
    throw new Error("HANDOFF_STORE=postgres requires DATABASE_URL.");
  }
  if (!config.database.url) {
    throw new Error("DATABASE_URL is required in production.");
  }
  if (!config.skipAuth && !config.authSecret) {
    throw new Error(
      "AUTH_SECRET is required in production when SKIP_AUTH is not enabled.",
    );
  }
  const handoffExplicit = process.env.HANDOFF_SECRET?.trim();
  if (!handoffExplicit) {
    throw new Error("HANDOFF_SECRET is required in production.");
  }
  if (config.authSecret && handoffExplicit === config.authSecret) {
    throw new Error("HANDOFF_SECRET must be distinct from AUTH_SECRET in production.");
  }
}

assertProductionConfig();
