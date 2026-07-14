import { createApp } from "./app.js";
import { config } from "./config.js";
import { initFirestore } from "./services/firestore.js";

initFirestore();

const app = createApp();

app.listen(config.port, () => {
  console.log(
    `[fitsense-api] listening on http://localhost:${config.port} (${config.nodeEnv})`,
  );
  console.log(`[fitsense-api] health → GET /health`);
  console.log(`[fitsense-api] handoff → /v1/handoff/:sessionId`);
  console.log(`[fitsense-api] sync → /v1/sync (Firebase Admin required)`);
});
