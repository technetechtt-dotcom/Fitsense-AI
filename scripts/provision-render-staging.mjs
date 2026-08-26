/**
 * Provision / verify FitSense staging services on Render from render.yaml.
 *
 * Requires RENDER_API_KEY. Does not invent secrets into git — reads them from env.
 *
 * Usage:
 *   RENDER_API_KEY=... \
 *   STAGING_DATABASE_URL=... \
 *   STAGING_AUTH_SECRET=... \
 *   STAGING_HANDOFF_SECRET=... \
 *   STAGING_WEBHOOK_SEAL_SECRET=... \
 *   node scripts/provision-render-staging.mjs
 */
const apiKey = process.env.RENDER_API_KEY?.trim();
const ownerId = process.env.RENDER_OWNER_ID?.trim(); // optional filter

if (!apiKey) {
  console.error(
    "RENDER_API_KEY is required. Create one in Render → Account → API Keys, then:\n" +
      "  gh secret set RENDER_API_KEY\n" +
      "Sync Blueprint in the Render dashboard if this script cannot create services.",
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

async function listServices() {
  const res = await fetch("https://api.render.com/v1/services?limit=50", {
    headers,
  });
  if (!res.ok) {
    throw new Error(`list services ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return (Array.isArray(data) ? data : data.items ?? []).map((row) => row.service ?? row);
}

function findByName(services, name) {
  return services.find((s) => s?.name === name);
}

async function main() {
  const services = await listServices();
  const needed = [
    "fitsense-api-staging",
    "fitsense-web-staging",
    "fitsense-retention-staging",
    "fitsense-webhooks-staging",
  ];
  const report = { found: {}, missing: [], ownerId: ownerId ?? null };
  for (const name of needed) {
    const svc = findByName(services, name);
    if (svc) {
      report.found[name] = { id: svc.id, type: svc.type, url: svc.serviceDetails?.url ?? svc.url };
    } else {
      report.missing.push(name);
    }
  }

  console.log(JSON.stringify(report, null, 2));

  if (report.missing.length) {
    console.error(
      "\nMissing services. In Render Dashboard → Blueprints → sync this repo's render.yaml,\n" +
        "then set DATABASE_URL / AUTH_SECRET / HANDOFF_SECRET / WEBHOOK_SEAL_SECRET / CORS_ORIGIN / WEBAUTHN_* on fitsense-api-staging.\n" +
        "Neon staging project: snowy-truth-81855391 (never production weathered-mud-13816950).",
    );
    process.exit(2);
  }

  const api = report.found["fitsense-api-staging"];
  if (api?.id) {
    console.log(
      `\nSet GitHub secrets:\n  gh secret set RENDER_STAGING_API_SERVICE_ID --body "${api.id}"`,
    );
  }
  const web = report.found["fitsense-web-staging"];
  if (web?.id) {
    console.log(
      `  gh secret set RENDER_STAGING_WEB_SERVICE_ID --body "${web.id}"`,
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
