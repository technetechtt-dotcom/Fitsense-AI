import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.js";
import { handoffRouter } from "./routes/handoff.js";
import { syncRouter } from "./routes/sync.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin,
      methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Debug-Uid",
      ],
    }),
  );
  app.use(express.json({ limit: "2mb" }));

  app.use(healthRouter);
  app.use("/v1", handoffRouter);
  app.use("/v1", syncRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  app.use(errorHandler);

  return app;
}
