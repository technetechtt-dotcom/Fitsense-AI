#!/usr/bin/env node
import { expireHeldReservations } from "../src/services/customerAccounts.js";
import { isPostgresConfigured } from "../src/services/postgres.js";

async function main() {
  if (!isPostgresConfigured()) throw new Error("DATABASE_URL required");
  const result = await expireHeldReservations(500);
  console.log(JSON.stringify(result));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
