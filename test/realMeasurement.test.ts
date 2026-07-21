import { describe, expect, it } from "vitest";
import { computeRealMeasurement, type TapPoints } from "../src/lib/realMeasurement";

const imageSize = { imageWidthPx: 800, imageHeightPx: 800 };

describe("reference measurement", () => {
  it("measures portrait A4 geometry without adding a population offset", () => {
    const taps: TapPoints = {
      refCorners: [
        { x: 20, y: 20 },
        { x: 230, y: 20 },
        { x: 230, y: 317 },
        { x: 20, y: 317 },
      ],
      heel: { x: 300, y: 320 },
      toe: { x: 300, y: 70 },
      widthMedial: { x: 250, y: 180 },
      widthLateral: { x: 350, y: 180 },
      foot: "left",
      ...imageSize,
    };

    const result = computeRealMeasurement(taps, "a4_paper");

    expect(result.sanity.ok).toBe(true);
    expect(result.measurement.lengthMm).toBeCloseTo(250, 5);
    expect(result.measurement.widthMm).toBeCloseTo(100, 5);
    expect(result.measurement.foot).toBe("left");
  });

  it("handles a landscape A4 reference without swapping its real scale", () => {
    const taps: TapPoints = {
      refCorners: [
        { x: 20, y: 20 },
        { x: 317, y: 20 },
        { x: 317, y: 230 },
        { x: 20, y: 230 },
      ],
      heel: { x: 360, y: 300 },
      toe: { x: 110, y: 300 },
      widthMedial: { x: 220, y: 250 },
      widthLateral: { x: 220, y: 350 },
      foot: "right",
      ...imageSize,
    };

    const result = computeRealMeasurement(taps, "a4_paper");

    expect(result.sanity.ok).toBe(true);
    expect(result.measurement.lengthMm).toBeCloseTo(250, 5);
    expect(result.measurement.widthMm).toBeCloseTo(100, 5);
  });

  it("rejects an estimated width as an unreliable production scan", () => {
    const result = computeRealMeasurement(
      {
        refCorners: [
          { x: 20, y: 20 },
          { x: 230, y: 20 },
          { x: 230, y: 317 },
          { x: 20, y: 317 },
        ],
        heel: { x: 300, y: 320 },
        toe: { x: 300, y: 70 },
        ...imageSize,
      },
      "a4_paper",
    );

    expect(result.widthSource).toBe("estimated");
    expect(result.sanity.ok).toBe(false);
    expect(result.sanity.issue).toMatch(/Ball width must be measured/);
  });
});
