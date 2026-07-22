import { Router } from "express";
import { z } from "zod";
import { rateLimit } from "../middleware/rateLimit.js";
import { config } from "../config.js";

/**
 * Minimal operational telemetry (client crashes / health pings).
 * No PII — reject payloads that look like emails or tokens.
 */
export const telemetryRouter = Router();

telemetryRouter.use(
  rateLimit({
    name: "telemetry",
    max: 60,
    key: (req) => `ip:${req.ip}`,
  }),
);

const eventSchema = z.object({
  type: z.enum(["client_error", "crash", "health_ping"]),
  message: z.string().trim().max(500),
  platform: z.enum(["web", "android", "ios", "unknown"]).default("unknown"),
  release: z.string().trim().max(64).optional(),
});

telemetryRouter.post("/telemetry/events", (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_telemetry" });
    return;
  }
  const msg = parsed.data.message.toLowerCase();
  if (msg.includes("@") || msg.includes("bearer ") || msg.includes("token")) {
    res.status(400).json({ error: "pii_rejected" });
    return;
  }
  console.info(
    JSON.stringify({
      level: "telemetry",
      env: config.nodeEnv,
      ...parsed.data,
      at: new Date().toISOString(),
    }),
  );
  res.status(204).end();
});
