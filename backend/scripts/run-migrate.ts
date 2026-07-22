import { runMigrations } from "../src/services/migrate.js";

const status = await runMigrations();
console.log(JSON.stringify(status, null, 2));
if (status.pending.length > 0) process.exit(1);
