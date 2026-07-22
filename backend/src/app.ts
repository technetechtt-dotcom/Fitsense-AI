import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { requestContext } from "./middleware/requestContext.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { handoffRouter } from "./routes/handoff.js";
import { syncRouter } from "./routes/sync.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);

  app.use(requestContext);
  app.use(securityHeaders);
  app.use(rateLimit({ name: "global", max: config.rateLimit.globalMax }));
  app.use(
    cors({
      origin: config.corsOrigin,
      methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Debug-Uid"],
    }),
  );
  app.use(express.json({ limit: config.jsonLimit }));

  app.use(healthRouter);
  app.use("/v1", authRouter);
  app.use("/v1", handoffRouter);
  app.use("/v1", syncRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  app.use(errorHandler);

  return app;
}
