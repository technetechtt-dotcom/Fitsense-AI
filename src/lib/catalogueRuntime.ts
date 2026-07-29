import { SHOE_CATALOG } from "../data/catalog";
import type { FitType, Product, ShoeCategory } from "../types";
import {
  getMerchantOrgId,
  listCatalogue,
  listInventory,
  type CatalogueProduct,
  type InventoryItem,
} from "./api/merchantApi";
import { getApiBaseUrl } from "./api/config";

/**
 * Active recommendation catalogue: merchant org products when loaded,
 * otherwise the built-in demo shelf. Never invents millimetres — only SKUs.
 */

const FIT_TYPES = new Set<FitType>(["narrow", "standard", "wide", "extra_wide"]);
const CATEGORIES = new Set<ShoeCategory>([
  "sneaker",
  "running",
  "casual",
  "formal",
  "boot",
  "sandal",
  "school",
  "safety",
]);

let merchantProducts: Product[] | null = null;
let merchantInventory: InventoryItem[] = [];
let sourceLabel: "builtin" | "merchant" = "builtin";

export function getActiveCatalogue(): Product[] {
  if (merchantProducts && merchantProducts.length > 0) return merchantProducts;
  return SHOE_CATALOG;
}

export function getActiveInventory(): InventoryItem[] {
  return merchantInventory;
}

export function getCatalogueSource(): "builtin" | "merchant" {
  return merchantProducts && merchantProducts.length > 0 ? "merchant" : sourceLabel;
}

export function clearMerchantCatalogue(): void {
  merchantProducts = null;
  merchantInventory = [];
  sourceLabel = "builtin";
}

export function setMerchantCatalogue(products: Product[]): void {
  merchantProducts = products.length > 0 ? products : null;
  sourceLabel = products.length > 0 ? "merchant" : "builtin";
}

export function setMerchantInventory(items: InventoryItem[]): void {
  merchantInventory = items;
}

/** UK size labels in stock for a product (quantity > 0). */
export function inStockUkLabels(productId: string): string[] {
  const labels = new Set<string>();
  for (const row of merchantInventory) {
    if (row.productId !== productId) continue;
    if (row.sizeSystem !== "uk") continue;
    if (row.quantity <= 0) continue;
    labels.add(row.sizeLabel);
  }
  return Array.from(labels).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
}

export function productHasAnyStock(productId: string): boolean | null {
  if (merchantInventory.length === 0) return null;
  const rows = merchantInventory.filter((r) => r.productId === productId);
  if (rows.length === 0) return false;
  return rows.some((r) => r.quantity > 0);
}

export function catalogueProductToProduct(raw: CatalogueProduct): Product | null {
  const productId = String(raw.productId ?? "").trim();
  const brand = String(raw.brand ?? "").trim();
  const model = String(raw.model ?? "").trim();
  if (!productId || !brand || !model) return null;

  const fitRaw = String(raw.fitType ?? "standard");
  const fitType: FitType = FIT_TYPES.has(fitRaw as FitType)
    ? (fitRaw as FitType)
    : "standard";

  const catRaw = String(raw.category ?? "casual");
  const category: ShoeCategory = CATEGORIES.has(catRaw as ShoeCategory)
    ? (catRaw as ShoeCategory)
    : "casual";

  const range = raw.sizeRangeEu;
  const sizeRangeEu = {
    min: typeof range?.min === "number" ? range.min : 30,
    max: typeof range?.max === "number" ? range.max : 46,
    step: typeof range?.step === "number" && range.step > 0 ? range.step : 1,
  };

  const dq = raw.dataQuality;
  const dataQuality =
    dq === "verified" || dq === "unverified" ? dq : ("unverified" as const);

  return {
    productId,
    brand,
    model,
    category,
    fitType,
    sizeRangeEu,
    priceUsd: typeof raw.priceUsd === "number" ? raw.priceUsd : 0,
    description: String(raw.description ?? `${brand} ${model}`),
    colorways: Array.isArray(raw.colorways) ? raw.colorways.map(String) : [],
    storeUrl: typeof raw.storeUrl === "string" ? raw.storeUrl : undefined,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : undefined,
    dataQuality,
  };
}

/** Load merchant catalogue + inventory into the recommendation layer. */
export async function loadMerchantCatalogue(
  orgId = getMerchantOrgId(),
): Promise<number> {
  if (!orgId || getApiBaseUrl() === null) {
    clearMerchantCatalogue();
    return 0;
  }
  const [raw, inv] = await Promise.all([
    listCatalogue(orgId),
    listInventory(orgId).catch(() => [] as InventoryItem[]),
  ]);
  const products = raw
    .map(catalogueProductToProduct)
    .filter((p): p is Product => p !== null);
  setMerchantCatalogue(products);
  setMerchantInventory(inv);
  return products.length;
}
