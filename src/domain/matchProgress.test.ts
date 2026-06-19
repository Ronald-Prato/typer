import { describe, expect, it } from "vitest";
import {
  countCompletedMatchSteps,
  didCurrentUserWin,
  getOpponentProgressIndex,
} from "./matchProgress";

describe("matchProgress", () => {
  it("counts completed steps in match order", () => {
    expect(countCompletedMatchSteps()).toBe(0);
    expect(
      countCompletedMatchSteps({
        phraseDone: true,
        wordsDone: true,
        holdsDone: true,
      })
    ).toBe(3);
  });

  it("maps mirrored opponent labels to progress indexes", () => {
    expect(getOpponentProgressIndex("Frase")).toBe(0);
    expect(getOpponentProgressIndex("Palabras")).toBe(1);
    expect(getOpponentProgressIndex("Caracteres")).toBe(2);
  });

  it("derives winner state without UI assumptions", () => {
    expect(didCurrentUserWin({ winner: "alice", currentUserId: "alice" })).toBe(
      true
    );
    expect(didCurrentUserWin({ winner: "bob", currentUserId: "alice" })).toBe(
      false
    );
    expect(didCurrentUserWin({ currentUserId: "alice" })).toBe(false);
  });
});
