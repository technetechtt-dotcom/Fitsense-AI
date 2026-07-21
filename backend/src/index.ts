import { createApp } from "./app.js";
import { config } from "./config.js";
import { getSyncStore, initSyncStore } from "./services/syncStore.js";

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
});
