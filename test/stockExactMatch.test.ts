import { describe, expect, it } from "vitest";
import {
  catalogueProductToProduct,
  clearMerchantCatalogue,
  inStockExact,
  setMerchantCatalogue,
  setMerchantInventory,
} from "../src/lib/catalogueRuntime";

describe("exact size+width stock matching", () => {
  it("rejects products without valid sizeRangeEu", () => {
    expect(
      catalogueProductToProduct({
        productId: "x",
        brand: "Bata",
        model: "School",
        category: "school",
        fitType: "standard",
      }),
    ).toBeNull();
    expect(
      catalogueProductToProduct({
        productId: "x",
        brand: "Bata",
        model: "School",
        category: "school",
        fitType: "standard",
        sizeRangeEu: { min: 40, max: 30, step: 1 },
      }),
    ).toBeNull();
  });

  it("matches inventory by recommended EU mapped UK + width", () => {
    clearMerchantCatalogue();
    setMerchantCatalogue([
      {
        productId: "bata-1",
        brand: "Bata",
        model: "Power",
        category: "school",
        fitType: "wide",
        sizeRangeEu: { min: 36, max: 46, step: 1 },
        priceUsd: 40,
        description: "test",
        colorways: [],
        dataQuality: "verified",
      },
    ]);
    setMerchantInventory([
      {
        productId: "bata-1",
        sizeSystem: "uk",
        sizeLabel: "8",
        widthLabel: "wide",
        quantity: 3,
      },
      {
        productId: "bata-1",
        sizeSystem: "uk",
        sizeLabel: "8",
        widthLabel: "standard",
        quantity: 0,
      },
    ]);
    // EU 42 maps to UK 8 in sizing table
    expect(inStockExact("bata-1", 42, "wide")).toBe(true);
    expect(inStockExact("bata-1", 42, "standard")).toBe(false);
    expect(inStockExact("bata-1", 42, "narrow")).toBe(false);
    clearMerchantCatalogue();
  });

  it("returns null when no inventory loaded", () => {
    clearMerchantCatalogue();
    expect(inStockExact("missing", 42, "standard")).toBeNull();
  });
});
