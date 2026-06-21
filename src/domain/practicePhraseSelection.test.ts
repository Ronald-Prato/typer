import { describe, expect, it } from "vitest";
import { selectPracticePhrases } from "./practicePhraseSelection";

describe("practicePhraseSelection", () => {
  it("selects only unseen phrases while enough remain", () => {
    const result = selectPracticePhrases(
      ["a", "b", "c", "d", "e"],
      ["a", "b"],
      2,
      () => 0
    );

    expect(result.phrases).toEqual(["d", "e"]);
    expect(result.seenPhrases).toEqual(["a", "b", "d", "e"]);
  });

  it("starts a new cycle after using the final unseen phrases", () => {
    const result = selectPracticePhrases(
      ["a", "b", "c", "d"],
      ["a", "b", "c"],
      3,
      () => 0
    );

    expect(result.phrases).toEqual(["d", "b", "c"]);
    expect(result.seenPhrases).toEqual(["d", "b", "c"]);
  });

  it("deduplicates source phrases before selecting", () => {
    const result = selectPracticePhrases(["a", "a", "b"], [], 5, () => 0);

    expect(result.phrases).toEqual(["b", "a"]);
    expect(result.seenPhrases).toEqual(["b", "a"]);
  });
});
