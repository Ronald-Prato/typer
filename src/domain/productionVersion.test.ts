import { describe, expect, it } from "vitest";
import { shouldNotifyProductionVersionUpdate } from "./productionVersion";

describe("shouldNotifyProductionVersionUpdate", () => {
  it("does not notify before the first known version is captured", () => {
    expect(
      shouldNotifyProductionVersionUpdate({
        initialVersion: null,
        latestVersion: "commit-b",
      })
    ).toBe(false);
  });

  it("does not notify when production still serves the current version", () => {
    expect(
      shouldNotifyProductionVersionUpdate({
        initialVersion: "commit-a",
        latestVersion: "commit-a",
      })
    ).toBe(false);
  });

  it("notifies when production serves a different version", () => {
    expect(
      shouldNotifyProductionVersionUpdate({
        initialVersion: "commit-a",
        latestVersion: "commit-b",
      })
    ).toBe(true);
  });

  it("does not repeat the toast for the same new version", () => {
    expect(
      shouldNotifyProductionVersionUpdate({
        initialVersion: "commit-a",
        latestVersion: "commit-b",
        notifiedVersion: "commit-b",
      })
    ).toBe(false);
  });

  it("ignores blank versions", () => {
    expect(
      shouldNotifyProductionVersionUpdate({
        initialVersion: "commit-a",
        latestVersion: "   ",
      })
    ).toBe(false);
  });
});
