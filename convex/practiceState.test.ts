import { describe, expect, test } from "vitest";

import { getNextHighestPracticeWpm } from "./practiceState";

describe("practiceState", () => {
  test("sets the first positive practice WPM as the highest practice WPM", () => {
    expect(
      getNextHighestPracticeWpm({
        currentHighestWpm: undefined,
        practiceWpm: 58,
      })
    ).toBe(58);
  });

  test("keeps the existing highest practice WPM when the new result is lower", () => {
    expect(
      getNextHighestPracticeWpm({
        currentHighestWpm: 82,
        practiceWpm: 64,
      })
    ).toBe(82);
  });

  test("raises the highest practice WPM when the new result is higher", () => {
    expect(
      getNextHighestPracticeWpm({
        currentHighestWpm: 82,
        practiceWpm: 91,
      })
    ).toBe(91);
  });

  test("normalizes invalid or negative values to zero", () => {
    expect(
      getNextHighestPracticeWpm({
        currentHighestWpm: Number.NaN,
        practiceWpm: -12,
      })
    ).toBe(0);
  });
});
