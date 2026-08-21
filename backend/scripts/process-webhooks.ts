import { processWebhookDeliveries } from "../src/services/webhooks.js";

const result = await processWebhookDeliveries(100);
console.log(JSON.stringify(result));
