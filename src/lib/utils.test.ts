import { beforeEach, describe, expect, test } from "vitest";

import { getShuffledPhrases } from "./utils";

describe("getShuffledPhrases", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  test("selects phrases from the provided Convex-backed pool", () => {
    const phrases = getShuffledPhrases(["alpha", "beta", "gamma"]);

    expect(phrases).toHaveLength(3);
    expect(
      phrases.every((phrase) => ["alpha", "beta", "gamma"].includes(phrase))
    ).toBe(true);
  });

  test("keeps browser-session phrase memory across calls", () => {
    getShuffledPhrases(["alpha", "beta"]);

    const phrases = getShuffledPhrases(["alpha", "beta", "gamma"]);

    expect(phrases).toContain("gamma");
  });
});
