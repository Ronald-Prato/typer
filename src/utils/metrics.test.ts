import { describe, expect, it } from "vitest";
import {
  calculateAccuracy,
  calculateWPM,
  getCharacterCount,
  getCharacterCountFromHolds,
  getCharacterCountFromWords,
} from "./metrics";

describe("metrics", () => {
  it("calculates standard typing WPM from five-character words", () => {
    expect(calculateWPM(25, 60_000)).toBe(5);
    expect(calculateWPM(10, 30_000)).toBe(4);
  });

  it("clamps accuracy between 0 and 100", () => {
    expect(calculateAccuracy(10, 2)).toBe(80);
    expect(calculateAccuracy(10, -1)).toBe(100);
    expect(calculateAccuracy(10, 20)).toBe(0);
  });

  it("counts characters for each exercise shape", () => {
    expect(getCharacterCount("hola mundo")).toBe(10);
    expect(getCharacterCountFromWords(["ab", "cde"])).toBe(5);
    expect(
      getCharacterCountFromHolds([
        { word: "shift", number: 1 },
        { word: "ctrl", number: 2 },
      ])
    ).toBe(9);
  });
});
