#!/usr/bin/env node
import "dotenv/config";
import { runRetentionSweep } from "../src/jobs/retention.js";

runRetentionSweep()
  .then((result) => {
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
