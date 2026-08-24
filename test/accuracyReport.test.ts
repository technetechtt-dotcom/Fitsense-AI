import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("accuracy report publisher", () => {
  it("writes nested mm metrics and does not certify the sample file", () => {
    execFileSync(process.execPath, ["scripts/publish-accuracy-report.mjs"], {
      cwd: resolve("."),
      encoding: "utf8",
    });
    const json = JSON.parse(
      readFileSync(resolve("docs/records/accuracy-report-latest.json"), "utf8"),
    );
    const md = readFileSync(resolve("docs/records/accuracy-report-latest.md"), "utf8");
    expect(json.certified).toBe(false);
    expect(json.sampleDataset).toBe(true);
    expect(json.n).toBe(3);
    expect(typeof json.overall.length.median).toBe("number");
    expect(md).toMatch(/Length median abs error \(mm\) \| [0-9]/);
    expect(md).not.toMatch(/Length median abs error \(mm\) \| —/);
    expect(md).toMatch(/Certified \| NO/);
    expect(md).toMatch(/Not certified/);
  });
});
