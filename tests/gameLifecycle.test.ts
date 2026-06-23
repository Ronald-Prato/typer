import { describe, expect, it } from "vitest";
import {
  getClassicMatchAverageWpm,
  getClassicMatchHighestWpmPatch,
  getFinishedGameHistoryUserIds,
  getForfeitWinnerId,
  getHistoryOpponentSnapshot,
  getRewardedWinnerId,
  getWinnerTypocoinPatch,
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

  it("builds the winner typocoin patch against legacy gold storage", () => {
    expect(getWinnerTypocoinPatch(undefined)).toEqual({ gold: 10 });
    expect(getWinnerTypocoinPatch(15)).toEqual({ gold: 25 });
  });

  it("rewards the human winner in bot matches and skips bot winners", () => {
    expect(
      getRewardedWinnerId({
        players: ["human", "bot"],
        winnerId: "human",
        againstBot: true,
        botPlayerId: "bot",
      })
    ).toBe("human");

    expect(
      getRewardedWinnerId({
        players: ["human", "bot"],
        winnerId: "bot",
        againstBot: true,
        botPlayerId: "bot",
      })
    ).toBeUndefined();
  });

  it("selects the non-abandoning player as the forfeit winner", () => {
    expect(
      getForfeitWinnerId({
        players: ["alice", "bob"],
        forfeitingPlayerId: "alice",
      })
    ).toBe("bob");

    expect(
      getForfeitWinnerId({
        players: ["alice", "bob"],
        forfeitingPlayerId: "alice",
        existingWinner: "bob",
      })
    ).toBeUndefined();

    expect(
      getForfeitWinnerId({
        players: ["alice", "bob"],
        forfeitingPlayerId: "charlie",
      })
    ).toBeUndefined();
  });

  it("summarizes classic match WPM from completed player stages", () => {
    expect(
      getClassicMatchAverageWpm({
        phraseMetrics: { errors: 0, timeMs: 1000, accuracy: 100, wpm: 68 },
        wordsMetrics: { errors: 0, timeMs: 1000, accuracy: 100, wpm: 71 },
        lettersAndSymbolsMetrics: {
          errors: 0,
          timeMs: 1000,
          accuracy: 100,
          wpm: 83,
        },
      })
    ).toBe(74);
    expect(getClassicMatchAverageWpm(undefined)).toBe(0);
  });

  it("builds a highest WPM patch only when a classic match beats the record", () => {
    expect(
      getClassicMatchHighestWpmPatch({
        currentHighestWpm: 72,
        progress: {
          phraseMetrics: { errors: 0, timeMs: 1000, accuracy: 100, wpm: 80 },
          wordsMetrics: { errors: 0, timeMs: 1000, accuracy: 100, wpm: 92 },
        },
      })
    ).toEqual({ highestPracticeWpm: 86 });

    expect(
      getClassicMatchHighestWpmPatch({
        currentHighestWpm: 90,
        progress: {
          phraseMetrics: { errors: 0, timeMs: 1000, accuracy: 100, wpm: 80 },
        },
      })
    ).toBeUndefined();
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
