import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  KeyRound,
  Layers,
  Package,
  Ruler,
  RefreshCw,
  ShoppingBag,
  Upload,
} from "lucide-react";
import { PageLayout, StickyPageHeader } from "../../components/PageLayout";
import { TopBar } from "../../components/TopBar";
import { PrimaryButton } from "../../components/PrimaryButton";
import { isApiConfigured } from "../../lib/api/config";
import { loadMerchantCatalogue } from "../../lib/catalogueRuntime";
import {
  createMerchantOrg,
  createOrgApiKey,
  fetchPilotMetrics,
  getMerchantOrgId,
  ingestCatalogue,
  listCatalogue,
  listInventory,
  listMerchantOrgs,
  listOrgApiKeys,
  listOrgBrandFits,
  recordMerchantOutcome,
  revokeOrgApiKey,
  setMerchantOrgId,
  upsertInventory,
  upsertOrgBrandFit,
  type ApiKeyRow,
  type BrandFitProfileInput,
  type CatalogueProduct,
  type InventoryItem,
  type MerchantOrg,
  type PilotMetrics,
} from "../../lib/api/merchantApi";

type Tab = "org" | "catalogue" | "inventory" | "brandfit" | "outcomes" | "keys";

function pct(rate: number | null): string {
  if (rate === null || Number.isNaN(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

export function MerchantPortal() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("org");
  const [orgs, setOrgs] = useState<MerchantOrg[]>([]);
  const [orgId, setOrgId] = useState<string | null>(getMerchantOrgId());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgRegion, setNewOrgRegion] = useState("ZA-NC");
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [metrics, setMetrics] = useState<PilotMetrics | null>(null);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [freshKey, setFreshKey] = useState<string | null>(null);

  const [outcomeKind, setOutcomeKind] = useState<"purchase" | "return" | "exchange">(
    "purchase",
  );
  const [outcomeProductId, setOutcomeProductId] = useState("");
  const [outcomeOrderId, setOutcomeOrderId] = useState("");
  const [outcomeSize, setOutcomeSize] = useState("");
  const [outcomeReason, setOutcomeReason] = useState("");

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [brandFits, setBrandFits] = useState<
    Array<BrandFitProfileInput & Record<string, unknown>>
  >([]);
  const [bfBrand, setBfBrand] = useState("Bata Power");
  const [bfModel, setBfModel] = useState("School Runner");
  const [bfDelta, setBfDelta] = useState("0");
  const [bfToe, setBfToe] = useState<BrandFitProfileInput["toeBoxWidth"]>("regular");
  const [bfMidsole, setBfMidsole] =
    useState<BrandFitProfileInput["midsoleFeel"]>("firm");
  const [bfNote, setBfNote] = useState("Pilot model — true to size");

  const apiReady = isApiConfigured();

  async function refreshOrgs() {
    if (!apiReady) return;
    const list = await listMerchantOrgs();
    setOrgs(list);
    if (!orgId && list[0]) {
      setOrgId(list[0].orgId);
      setMerchantOrgId(list[0].orgId);
    }
  }

  async function refreshCatalogueAndMetrics() {
    if (!apiReady || !orgId) return;
    const [cat, met, inv, fits] = await Promise.all([
      listCatalogue(orgId),
      fetchPilotMetrics(orgId),
      listInventory(orgId),
      listOrgBrandFits(orgId),
    ]);
    setProducts(cat);
    setMetrics(met);
    setInventory(inv);
    setBrandFits(fits);
    if (!outcomeProductId && cat[0]) setOutcomeProductId(cat[0].productId);
    await loadMerchantCatalogue(orgId).catch(() => 0);
  }

  async function refreshKeys() {
    if (!apiReady || !orgId) return;
    setKeys(await listOrgApiKeys(orgId));
  }

  useEffect(() => {
    if (!apiReady) return;
    void refreshOrgs().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load orgs"),
    );
  }, [apiReady]);

  useEffect(() => {
    if (!orgId || !apiReady) return;
    void Promise.all([refreshCatalogueAndMetrics(), refreshKeys()]).catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load org data"),
    );
  }, [orgId, apiReady]);

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageLayout withTopBar gap="gap-4">
      <StickyPageHeader>
        <TopBar title="Merchant portal" onBack={() => nav(-1)} />
      </StickyPageHeader>

      {!apiReady ? (
        <p className="text-sm text-ink-muted">
          Configure <code className="text-neon">VITE_API_BASE_URL</code> to use the
          merchant portal. Device auth (cloud sign-in) is required for org ownership.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-400 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2">
          {error}
        </p>
      ) : null}
      {status ? <p className="text-sm text-neon">{status}</p> : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["org", "Organisation", Building2],
            ["catalogue", "Catalogue", Package],
            ["inventory", "Inventory", Layers],
            ["brandfit", "Brand fit", Ruler],
            ["outcomes", "Outcomes", ShoppingBag],
            ["keys", "API keys", KeyRound],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border flex items-center gap-1.5 ${
              tab === id
                ? "bg-neon/15 border-neon/40 text-neon"
                : "border-white/10 text-ink-muted hover:border-white/20"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "org" ? (
        <section className="space-y-4">
          <div className="rounded-2xl bg-card-grad border border-white/5 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Active org</h2>
            {orgs.length === 0 ? (
              <p className="text-xs text-ink-muted">No orgs yet — create one below.</p>
            ) : (
              <select
                className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
                value={orgId ?? ""}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setOrgId(id);
                  setMerchantOrgId(id);
                }}
              >
                {orgs.map((o) => (
                  <option key={o.orgId} value={o.orgId}>
                    {o.name}
                    {o.region ? ` · ${o.region}` : ""} ({o.role ?? "member"})
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              disabled={busy || !apiReady}
              onClick={() =>
                void withBusy(async () => {
                  await refreshOrgs();
                  setStatus("Orgs refreshed");
                })
              }
              className="text-xs text-neon flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="rounded-2xl bg-card-grad border border-white/5 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Create organisation</h2>
            <input
              className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
              placeholder="Name (e.g. Kimberley Pilot Store)"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
            />
            <input
              className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
              placeholder="Region"
              value={newOrgRegion}
              onChange={(e) => setNewOrgRegion(e.target.value)}
            />
            <PrimaryButton
              disabled={busy || !apiReady || newOrgName.trim().length < 2}
              onClick={() =>
                void withBusy(async () => {
                  const org = await createMerchantOrg({
                    name: newOrgName.trim(),
                    region: newOrgRegion.trim() || undefined,
                  });
                  setOrgId(org.orgId);
                  setNewOrgName("");
                  await refreshOrgs();
                  setStatus(`Created ${org.name}`);
                })
              }
            >
              Create org
            </PrimaryButton>
          </div>

          {metrics ? (
            <div className="rounded-2xl bg-card-grad border border-white/5 p-4 space-y-2">
              <h2 className="text-sm font-semibold">Pilot metrics (90d)</h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Metric label="Purchases" value={String(metrics.purchases)} />
                <Metric label="Returns" value={String(metrics.returns)} />
                <Metric label="Exchanges" value={String(metrics.exchanges)} />
                <Metric label="Return rate" value={pct(metrics.returnRate)} />
                <Metric label="Exchange rate" value={pct(metrics.exchangeRate)} />
                <Metric label="Size-related" value={pct(metrics.sizeRelatedRate)} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "catalogue" ? (
        <section className="space-y-4">
          <div className="rounded-2xl bg-card-grad border border-white/5 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Ingest sample Kimberley feed</h2>
            <p className="text-xs text-ink-muted">
              Loads{" "}
              <code className="text-neon">
                docs/samples/kimberley-catalogue-feed.json
              </code>{" "}
              (Bata Power school SKUs) into the active org.
            </p>
            <PrimaryButton
              disabled={busy || !orgId || !apiReady}
              leadingIcon={<Upload className="w-4 h-4" />}
              onClick={() =>
                void withBusy(async () => {
                  if (!orgId) return;
                  let productsPayload = SAMPLE_PRODUCTS;
                  let inventoryPayload = SAMPLE_INVENTORY;
                  try {
                    const res = await fetch("/samples/kimberley-catalogue-feed.json");
                    if (res.ok) {
                      const body = (await res.json()) as {
                        products?: CatalogueProduct[];
                        inventory?: typeof SAMPLE_INVENTORY;
                      };
                      if (body.products?.length) productsPayload = body.products;
                      if (body.inventory?.length) inventoryPayload = body.inventory;
                    }
                  } catch {
                    /* use inline sample */
                  }
                  const result = await ingestCatalogue(orgId, productsPayload);
                  const inv = await upsertInventory(orgId, inventoryPayload);
                  await loadMerchantCatalogue(orgId);
                  setStatus(
                    `Upserted ${result.upserted} products, ${inv.upserted} inventory rows`,
                  );
                  await refreshCatalogueAndMetrics();
                })
              }
            >
              Ingest sample catalogue + inventory
            </PrimaryButton>
          </div>

          <div className="rounded-2xl bg-card-grad border border-white/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Catalogue ({products.length})</h2>
              <button
                type="button"
                className="text-xs text-neon"
                disabled={!orgId || busy}
                onClick={() =>
                  void withBusy(async () => {
                    await refreshCatalogueAndMetrics();
                    setStatus("Catalogue refreshed");
                  })
                }
              >
                Refresh
              </button>
            </div>
            {products.length === 0 ? (
              <p className="text-xs text-ink-muted">No products yet.</p>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {products.map((p) => (
                  <li
                    key={p.productId}
                    className="rounded-xl bg-surface-2 border border-white/5 px-3 py-2 text-xs"
                  >
                    <div className="font-semibold text-ink">
                      {p.brand} · {p.model}
                    </div>
                    <div className="text-ink-muted">
                      {p.productId}
                      {p.category ? ` · ${p.category}` : ""}
                      {p.dataQuality ? ` · ${p.dataQuality}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {tab === "inventory" ? (
        <section className="space-y-4">
          <div className="rounded-2xl bg-card-grad border border-white/5 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Stock by size</h2>
            <p className="text-xs text-ink-muted">
              UK sizes for Kimberley pilot SKUs. Ingest sample feed to seed rows, or
              push via <code className="text-neon">PUT .../inventory</code>.
            </p>
            <PrimaryButton
              disabled={busy || !orgId || !apiReady}
              onClick={() =>
                void withBusy(async () => {
                  if (!orgId) return;
                  const result = await upsertInventory(orgId, SAMPLE_INVENTORY);
                  setStatus(`Upserted ${result.upserted} inventory rows`);
                  setInventory(await listInventory(orgId));
                })
              }
            >
              Seed sample inventory
            </PrimaryButton>
            {inventory.length === 0 ? (
              <p className="text-xs text-ink-muted">No inventory rows yet.</p>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {inventory.map((row) => (
                  <li
                    key={`${row.productId}-${row.sizeSystem}-${row.sizeLabel}`}
                    className="rounded-xl bg-surface-2 border border-white/5 px-3 py-2 text-xs flex justify-between gap-2"
                  >
                    <span>
                      {row.productId} · {row.sizeSystem.toUpperCase()} {row.sizeLabel}
                    </span>
                    <span className="font-semibold text-neon">qty {row.quantity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {tab === "brandfit" ? (
        <section className="space-y-4">
          <div className="rounded-2xl bg-card-grad border border-white/5 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Brand / model fit profile</h2>
            <p className="text-xs text-ink-muted">
              EU size delta and last notes used by the recommendation layer.
            </p>
            <input
              className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
              placeholder="Brand"
              value={bfBrand}
              onChange={(e) => setBfBrand(e.target.value)}
            />
            <input
              className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
              placeholder="Model"
              value={bfModel}
              onChange={(e) => setBfModel(e.target.value)}
            />
            <input
              className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
              placeholder="EU size delta (−2…2)"
              value={bfDelta}
              onChange={(e) => setBfDelta(e.target.value)}
            />
            <select
              className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
              value={bfToe}
              onChange={(e) =>
                setBfToe(e.target.value as BrandFitProfileInput["toeBoxWidth"])
              }
            >
              <option value="narrow">Toe box: narrow</option>
              <option value="regular">Toe box: regular</option>
              <option value="wide">Toe box: wide</option>
              <option value="extra_wide">Toe box: extra wide</option>
            </select>
            <select
              className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
              value={bfMidsole}
              onChange={(e) =>
                setBfMidsole(e.target.value as BrandFitProfileInput["midsoleFeel"])
              }
            >
              <option value="firm">Midsole: firm</option>
              <option value="balanced">Midsole: balanced</option>
              <option value="soft">Midsole: soft</option>
              <option value="unknown">Midsole: unknown</option>
            </select>
            <input
              className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
              placeholder="Note"
              value={bfNote}
              onChange={(e) => setBfNote(e.target.value)}
            />
            <PrimaryButton
              disabled={busy || !orgId || !apiReady || !bfBrand.trim()}
              onClick={() =>
                void withBusy(async () => {
                  if (!orgId) return;
                  const delta = Number(bfDelta);
                  await upsertOrgBrandFit(orgId, {
                    brand: bfBrand.trim(),
                    model: bfModel.trim() || undefined,
                    euSizeDelta: Number.isFinite(delta) ? delta : 0,
                    toeBoxWidth: bfToe,
                    midsoleFeel: bfMidsole,
                    note: bfNote.trim() || undefined,
                  });
                  setBrandFits(await listOrgBrandFits(orgId));
                  setStatus("Brand-fit profile saved");
                })
              }
            >
              Save brand-fit
            </PrimaryButton>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {brandFits.map((p, i) => (
                <li
                  key={`${p.brand}-${p.model ?? ""}-${i}`}
                  className="rounded-xl bg-surface-2 border border-white/5 px-3 py-2 text-xs"
                >
                  <div className="font-semibold">
                    {p.brand}
                    {p.model ? ` · ${p.model}` : ""}
                  </div>
                  <div className="text-ink-muted">
                    ΔEU {p.euSizeDelta} · {p.toeBoxWidth} · {p.midsoleFeel}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {tab === "outcomes" ? (
        <section className="space-y-4">
          <div className="rounded-2xl bg-card-grad border border-white/5 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Record outcome</h2>
            <p className="text-xs text-ink-muted">
              Link purchases / returns / exchanges to an optional retail{" "}
              <code className="text-neon">orderId</code> for pilot attribution.
            </p>
            <select
              className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
              value={outcomeKind}
              onChange={(e) =>
                setOutcomeKind(e.target.value as "purchase" | "return" | "exchange")
              }
            >
              <option value="purchase">Purchase</option>
              <option value="return">Return</option>
              <option value="exchange">Exchange</option>
            </select>
            <input
              className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
              placeholder="Product ID"
              value={outcomeProductId}
              onChange={(e) => setOutcomeProductId(e.target.value)}
              list="merchant-product-ids"
            />
            <datalist id="merchant-product-ids">
              {products.map((p) => (
                <option key={p.productId} value={p.productId} />
              ))}
            </datalist>
            <input
              className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
              placeholder="Order ID (optional)"
              value={outcomeOrderId}
              onChange={(e) => setOutcomeOrderId(e.target.value)}
            />
            <input
              className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
              placeholder="Size label (e.g. 5)"
              value={outcomeSize}
              onChange={(e) => setOutcomeSize(e.target.value)}
            />
            {outcomeKind !== "purchase" ? (
              <input
                className="w-full rounded-xl bg-surface-2 border border-white/10 px-3 py-2 text-sm"
                placeholder="Reason (e.g. too_small)"
                value={outcomeReason}
                onChange={(e) => setOutcomeReason(e.target.value)}
              />
            ) : null}
            <PrimaryButton
              disabled={busy || !orgId || !apiReady || !outcomeProductId.trim()}
              onClick={() =>
                void withBusy(async () => {
                  if (!orgId) return;
                  const product = products.find(
                    (p) => p.productId === outcomeProductId.trim(),
                  );
                  const result = await recordMerchantOutcome(orgId, {
                    kind: outcomeKind,
                    productId: outcomeProductId.trim(),
                    brand: product?.brand,
                    sizeLabel: outcomeSize.trim() || undefined,
                    sizeSystem: "uk",
                    reason: outcomeReason.trim() || undefined,
                    orderId: outcomeOrderId.trim() || undefined,
                  });
                  setStatus(`Recorded ${outcomeKind} (${result.outcomeId})`);
                  setMetrics(await fetchPilotMetrics(orgId));
                })
              }
            >
              Record {outcomeKind}
            </PrimaryButton>
          </div>
        </section>
      ) : null}

      {tab === "keys" ? (
        <section className="space-y-4">
          <div className="rounded-2xl bg-card-grad border border-white/5 p-4 space-y-3">
            <h2 className="text-sm font-semibold">API keys</h2>
            <p className="text-xs text-ink-muted">
              Keys are shown once at creation. Use{" "}
              <code className="text-neon">X-Api-Key</code> for POS / partner ingest.
            </p>
            <PrimaryButton
              disabled={busy || !orgId || !apiReady}
              onClick={() =>
                void withBusy(async () => {
                  if (!orgId) return;
                  const created = await createOrgApiKey(
                    orgId,
                    `portal-${new Date().toISOString().slice(0, 10)}`,
                  );
                  setFreshKey(created.apiKey);
                  await refreshKeys();
                  setStatus(`Created key ${created.keyId}`);
                })
              }
            >
              Create API key
            </PrimaryButton>
            {freshKey ? (
              <div className="rounded-xl bg-surface-2 border border-neon/30 p-3 text-xs break-all">
                <div className="text-neon font-semibold mb-1">
                  Copy now — shown once
                </div>
                {freshKey}
              </div>
            ) : null}
            <ul className="space-y-2">
              {keys.map((k) => (
                <li
                  key={k.keyId}
                  className="rounded-xl bg-surface-2 border border-white/5 px-3 py-2 text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold">{k.label}</div>
                    <div className="text-ink-muted">
                      {k.keyId}
                      {k.revoked ? " · revoked" : ""}
                    </div>
                  </div>
                  {!k.revoked ? (
                    <button
                      type="button"
                      className="text-red-400 shrink-0"
                      disabled={busy || !orgId}
                      onClick={() =>
                        void withBusy(async () => {
                          if (!orgId) return;
                          await revokeOrgApiKey(orgId, k.keyId);
                          await refreshKeys();
                          setStatus(`Revoked ${k.keyId}`);
                        })
                      }
                    >
                      Revoke
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </PageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 border border-white/5 px-3 py-2">
      <div className="text-ink-muted">{label}</div>
      <div className="text-sm font-semibold text-ink mt-0.5">{value}</div>
    </div>
  );
}

/** Inline fallback if public sample fetch fails (tests / offline). */
const SAMPLE_PRODUCTS: CatalogueProduct[] = [
  {
    productId: "bata-power-school-01",
    brand: "Bata Power",
    model: "School Runner",
    category: "school",
    fitType: "standard",
    sizeRangeEu: { min: 30, max: 42, step: 1 },
    priceUsd: 35,
    description: "NC school footwear pilot SKU",
    colorways: ["Black"],
    dataQuality: "verified",
  },
  {
    productId: "bata-power-school-02",
    brand: "Bata Power",
    model: "Court Classic",
    category: "school",
    fitType: "wide",
    sizeRangeEu: { min: 32, max: 44, step: 1 },
    priceUsd: 42,
    description: "Wide-fit Kimberley pilot SKU",
    colorways: ["White", "Navy"],
    dataQuality: "verified",
  },
];

const SAMPLE_INVENTORY: Array<{
  productId: string;
  sizeSystem: "uk" | "us" | "eu" | "mondopoint";
  sizeLabel: string;
  quantity: number;
}> = [
  {
    productId: "bata-power-school-01",
    sizeSystem: "uk",
    sizeLabel: "4",
    quantity: 8,
  },
  {
    productId: "bata-power-school-01",
    sizeSystem: "uk",
    sizeLabel: "5",
    quantity: 12,
  },
  {
    productId: "bata-power-school-01",
    sizeSystem: "uk",
    sizeLabel: "6",
    quantity: 10,
  },
  {
    productId: "bata-power-school-02",
    sizeSystem: "uk",
    sizeLabel: "5",
    quantity: 6,
  },
  {
    productId: "bata-power-school-02",
    sizeSystem: "uk",
    sizeLabel: "6",
    quantity: 9,
  },
];
