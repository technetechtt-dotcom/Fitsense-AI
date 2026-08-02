#!/usr/bin/env node
/**
 * Validate a retailer catalogue feed JSON file against the FitSense contract.
 * Usage: node scripts/validate-catalogue-feed.mjs [path-to-feed.json]
 * Default: docs/samples/kimberley-catalogue-feed.json
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const feedPath = resolve(
  process.argv[2] ?? "docs/samples/kimberley-catalogue-feed.json",
);
const schemaPath = resolve("docs/schemas/retailer-catalogue-feed.schema.json");

const feed = JSON.parse(readFileSync(feedPath, "utf8"));
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

const errors = [];

function fail(msg) {
  errors.push(msg);
}

function isObj(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

if (!isObj(feed)) fail("feed must be an object");
if (!Array.isArray(feed.products) || feed.products.length < 1) {
  fail("products must be a non-empty array");
}
if (Array.isArray(feed.products) && feed.products.length > 200) {
  fail("products exceeds 200 items");
}

const idRe = /^[A-Za-z0-9_.:-]{1,128}$/;
const productIds = new Set();

for (const [i, p] of (feed.products ?? []).entries()) {
  if (!isObj(p)) {
    fail(`products[${i}] must be an object`);
    continue;
  }
  for (const key of ["productId", "brand", "model", "category", "fitType"]) {
    if (typeof p[key] !== "string" || !p[key].trim()) {
      fail(`products[${i}].${key} required string`);
    }
  }
  if (typeof p.productId === "string" && !idRe.test(p.productId)) {
    fail(`products[${i}].productId invalid id`);
  }
  if (typeof p.productId === "string") productIds.add(p.productId);
  if (p.sizeRangeEu != null) {
    if (!isObj(p.sizeRangeEu)) fail(`products[${i}].sizeRangeEu must be object`);
    else {
      if (typeof p.sizeRangeEu.min !== "number") fail(`products[${i}].sizeRangeEu.min`);
      if (typeof p.sizeRangeEu.max !== "number") fail(`products[${i}].sizeRangeEu.max`);
    }
  }
  if (p.dataQuality != null && !["verified", "unverified"].includes(p.dataQuality)) {
    fail(`products[${i}].dataQuality must be verified|unverified`);
  }
}

if (feed.inventory != null) {
  if (!Array.isArray(feed.inventory)) fail("inventory must be an array");
  else if (feed.inventory.length > 500) fail("inventory exceeds 500 items");
  for (const [i, row] of feed.inventory.entries()) {
    if (!isObj(row)) {
      fail(`inventory[${i}] must be an object`);
      continue;
    }
    if (typeof row.productId !== "string" || !idRe.test(row.productId)) {
      fail(`inventory[${i}].productId invalid`);
    } else if (productIds.size && !productIds.has(row.productId)) {
      fail(`inventory[${i}].productId ${row.productId} not in products`);
    }
    if (!["uk", "us", "eu", "mondopoint"].includes(row.sizeSystem)) {
      fail(`inventory[${i}].sizeSystem invalid`);
    }
    if (typeof row.sizeLabel !== "string" || !row.sizeLabel.trim()) {
      fail(`inventory[${i}].sizeLabel required`);
    }
    if (!Number.isInteger(row.quantity) || row.quantity < 0) {
      fail(`inventory[${i}].quantity must be non-negative integer`);
    }
  }
}

// Schema file presence check (structural contract documented).
if (!schema?.properties?.products) {
  fail("schema file missing products definition");
}

if (errors.length) {
  console.error(`FAIL ${feedPath}`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `OK ${feedPath} (${feed.products.length} products` +
    `${Array.isArray(feed.inventory) ? `, ${feed.inventory.length} inventory` : ""})`,
);
