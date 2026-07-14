import type { Product } from "../types";

/** Merchant URL for a catalog product, with search fallback. */
export function productStoreUrl(product: Product): string {
  if (product.storeUrl) return product.storeUrl;
  const q = encodeURIComponent(`${product.brand} ${product.model} buy`);
  return `https://www.google.com/search?q=${q}`;
}
