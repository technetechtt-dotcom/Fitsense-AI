import { describe, expect, it } from "vitest";
import { validateProductionFlags } from "../vite.productionGuard";

describe("production scan guard", () => {
  it("rejects simulation in production", () => {
    expect(() => validateProductionFlags("production", "true")).toThrow(
      /Production build blocked/,
    );
  });

  it("allows a production build only when simulation is disabled", () => {
    expect(() => validateProductionFlags("production", "false")).not.toThrow();
    expect(() => validateProductionFlags("production", undefined)).not.toThrow();
  });

  it("allows explicit simulation only outside production", () => {
    expect(() => validateProductionFlags("development", "true")).not.toThrow();
    expect(() => validateProductionFlags("test", "true")).not.toThrow();
  });
});
