import { describe, expect, it } from "vitest";
import { normalizeHistoryPageSize } from "../convex/historyPagination";

describe("historyPagination", () => {
  it("clamps history page size to backend bounds", () => {
    expect(normalizeHistoryPageSize(undefined)).toBe(6);
    expect(normalizeHistoryPageSize(0)).toBe(1);
    expect(normalizeHistoryPageSize(5)).toBe(5);
    expect(normalizeHistoryPageSize(500)).toBe(25);
  });
});
