import { describe, expect, it } from "vitest";
import {
  createPendingMatchExitValue,
  shouldGuardMatchExit,
} from "./matchExit";

describe("matchExit", () => {
  it("guards only unfinished matches with an active game", () => {
    expect(
      shouldGuardMatchExit({ activeGame: "game-1", isFinished: false })
    ).toBe(true);
    expect(
      shouldGuardMatchExit({ activeGame: "game-1", isFinished: true })
    ).toBe(false);
    expect(
      shouldGuardMatchExit({ activeGame: undefined, isFinished: false })
    ).toBe(false);
  });

  it("stores the active game in the pending exit marker", () => {
    expect(JSON.parse(createPendingMatchExitValue("game-1"))).toMatchObject({
      activeGame: "game-1",
    });
  });
});
