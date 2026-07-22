import { createApp } from "./app.js";
import { config } from "./config.js";
import { runMigrations } from "./services/migrate.js";
import { getSyncStore, initSyncStore } from "./services/syncStore.js";

const migrationStatus = await runMigrations();
if (migrationStatus.pending.length > 0) {
  console.error(
    "[fitsense-api] refusing to start — pending migrations:",
    migrationStatus.pending.join(", "),
  );
  process.exit(1);
}

await initSyncStore();

const app = createApp();
const syncStore = getSyncStore();

app.listen(config.port, () => {
  console.log(
    `[fitsense-api] listening on http://localhost:${config.port} (${config.nodeEnv})`,
  );
  console.log("[fitsense-api] health -> GET /health");
  console.log(
    `[fitsense-api] handoff -> /v1/handoff/:sessionId (${config.handoffStore})`,
  );
  console.log(`[fitsense-api] sync -> /v1/sync (${syncStore.name})`);
  console.log(
    `[fitsense-api] migrations -> ${migrationStatus.latest ?? "none"} (${migrationStatus.applied.length} applied)`,
  );
});
