import { describe, expect, it } from "vitest";
import {
  getFinishedGameHistoryUserIds,
  getWinnerGoldPatch,
  shouldRewardWinner,
} from "../convex/gameLifecycle";

describe("gameLifecycle", () => {
  it("keeps history for both players in human matches", () => {
    expect(
      getFinishedGameHistoryUserIds({
        players: ["alice", "bob"],
      })
    ).toEqual(["alice", "bob"]);
  });

  it("does not write bot-only history entries for bot matches", () => {
    expect(
      getFinishedGameHistoryUserIds({
        players: ["human", "bot"],
        againstBot: true,
        botPlayerId: "bot",
      })
    ).toEqual(["human"]);
  });

  it("builds the winner reward patch from missing or existing gold", () => {
    expect(getWinnerGoldPatch(undefined)).toEqual({ gold: 10 });
    expect(getWinnerGoldPatch(15)).toEqual({ gold: 25 });
  });

  it("rewards human winners and skips bot winners", () => {
    expect(
      shouldRewardWinner({
        winnerId: "human",
        humanPlayerId: "human",
        againstBot: true,
      })
    ).toBe(true);
    expect(
      shouldRewardWinner({
        winnerId: "bot",
        humanPlayerId: "human",
        againstBot: true,
      })
    ).toBe(false);
  });
});
