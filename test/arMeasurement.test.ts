import { describe, expect, it } from "vitest";
import { measurementFromArPoints } from "../src/lib/arSession";

describe("WebXR point measurement", () => {
  it("measures length and ball width from four world-space points", () => {
    const measurement = measurementFromArPoints(
      [0, 0, 0],
      [0, 0, 0.25],
      [-0.05, 0, 0.15],
      [0.05, 0, 0.15],
    );

    expect(measurement).not.toBeNull();
    expect(measurement?.lengthMm).toBeCloseTo(250, 5);
    expect(measurement?.widthMm).toBeCloseTo(100, 5);
    expect(measurement?.dimensionConfidence?.width).toBeGreaterThan(0);
  });

  it("rejects implausible or non-coplanar width points", () => {
    expect(
      measurementFromArPoints(
        [0, 0, 0],
        [0, 0, 0.25],
        [-0.01, 0, 0.15],
        [0.01, 0.03, 0.15],
      ),
    ).toBeNull();
  });
});
