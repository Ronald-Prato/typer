import { describe, expect, it } from "vitest";
import {
  getFinishedGameHistoryUserIds,
  getHistoryOpponentSnapshot,
  getWinnerGoldPatch,
  shouldRewardWinner,
  toPlayerSnapshot,
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

  it("snapshots the other human player for each history owner", () => {
    const alice = toPlayerSnapshot({
      _id: "alice",
      nickname: "Alice",
      avatarSeed: "alice-seed",
    });
    const bob = toPlayerSnapshot({
      _id: "bob",
      nickname: "Bobby",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    });

    expect(
      getHistoryOpponentSnapshot({
        historyUserId: "alice",
        players: ["alice", "bob"],
        playerSnapshotsById: { alice, bob },
      })
    ).toEqual(bob);
    expect(
      getHistoryOpponentSnapshot({
        historyUserId: "bob",
        players: ["alice", "bob"],
        playerSnapshotsById: { alice, bob },
      })
    ).toEqual(alice);
  });

  it("uses the per-match bot profile as the opponent snapshot", () => {
    const botProfile = {
      userId: "bot",
      nickname: "Tecla Turbo",
      avatarSeed: "tecla-turbo",
    };

    expect(
      getHistoryOpponentSnapshot({
        historyUserId: "human",
        players: ["human", "bot"],
        playerSnapshotsById: {
          bot: {
            userId: "bot",
            nickname: "Generic Bot",
          },
        },
        againstBot: true,
        botProfile,
      })
    ).toEqual(botProfile);
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
