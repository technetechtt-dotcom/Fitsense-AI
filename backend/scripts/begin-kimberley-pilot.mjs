#!/usr/bin/env node
/**
 * Bootstrap a Kimberley controlled pilot org on a live API (staging).
 *
 * Does NOT invent millimetres or fake retailer signatures.
 * Usage:
 *   STAGING_API_BASE_URL=https://fitsense-api-staging.onrender.com \
 *     node scripts/begin-kimberley-pilot.mjs
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const base = (process.env.STAGING_API_BASE_URL ?? "").replace(/\/+$/, "");
if (!base) {
  console.error("Set STAGING_API_BASE_URL");
  process.exit(1);
}
if (/fitsense-api-1rne\.onrender\.com/i.test(base)) {
  console.error("Refusing to start a pilot against production hostname.");
  process.exit(2);
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function json(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function register() {
  const register = await fetch(`${base}/v1/auth/devices/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  const device = await json(register);
  if (register.status !== 201) throw new Error(`register ${register.status}`);
  const challenge = await fetch(`${base}/v1/auth/challenge`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId: device.deviceId }),
  });
  const ch = await json(challenge);
  const proof = sha256Hex(`${sha256Hex(device.deviceSecret)}:${ch.nonce}`);
  const tokenRes = await fetch(`${base}/v1/auth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      deviceId: device.deviceId,
      challengeId: ch.challengeId,
      nonce: ch.nonce,
      proof,
    }),
  });
  const tokens = await json(tokenRes);
  if (tokenRes.status !== 200) throw new Error(`token ${tokenRes.status}`);
  return { accessToken: tokens.accessToken, deviceId: device.deviceId };
}

async function main() {
  const auth = await register();
  const headers = {
    authorization: `Bearer ${auth.accessToken}`,
    "content-type": "application/json",
  };
  const orgRes = await fetch(`${base}/v1/merchants/orgs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Kimberley Pilot (controlled)",
      region: "Northern Cape",
    }),
  });
  const org = await json(orgRes);
  if (![200, 201].includes(orgRes.status)) {
    throw new Error(`org ${orgRes.status} ${JSON.stringify(org)}`);
  }
  const orgId = org.orgId;
  const locRes = await fetch(`${base}/v1/merchants/orgs/${orgId}/locations`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      code: "KIM-FLAGSHIP",
      name: "Kimberley flagship (pending retailer)",
      kind: "store",
      region: "Northern Cape",
    }),
  });
  const loc = await json(locRes);
  await fetch(`${base}/v1/merchants/orgs/${orgId}/onboarding/step`, {
    method: "POST",
    headers,
    body: JSON.stringify({ step: "pilot_org_created" }),
  });
  await fetch(`${base}/v1/merchants/orgs/${orgId}/pilot-contracts`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      title: "Kimberley assisted vs control — 6 weeks",
      successCriteria: [
        "Scan completion ≥ 80% of consented sessions",
        "Length median error ≤ 2 mm vs Brannock on study subset",
        "Size-related returns relative reduction ≥ 15% vs control after 6 weeks",
        "POPIA consent + erase path trained for staff",
      ],
      pricingNotes: "Pilot plan — pricing not billed until retailer countersigns",
      status: "draft",
    }),
  });
  const record = {
    createdAt: new Date().toISOString(),
    baseUrl: base,
    orgId,
    locationId: loc?.locationId ?? null,
    status: "org_ready_awaiting_retailer_and_brannock_study",
    next: [
      "Countersign operator agreement with one Kimberley retailer",
      "Ingest real catalogue + inventory",
      "Run 30-person Brannock study before treating sizing as certified",
      "Log outcomes with cohort=assisted|control",
    ],
  };
  const out = resolve("docs/records/kimberley-pilot-latest.json");
  mkdirSync(resolve("docs/records"), { recursive: true });
  writeFileSync(out, `${JSON.stringify(record, null, 2)}\n`);
  console.log(JSON.stringify(record, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
