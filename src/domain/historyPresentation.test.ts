import { describe, expect, it } from "vitest";
import {
  calculateHistoryAverageMetrics,
  filterHistoryGames,
  formatHistoryAccuracy,
  formatHistoryTime,
  formatHistoryWpm,
  getHistoryOpponent,
  summarizeHistoryPage,
  type HistoryGame,
} from "./historyPresentation";

const makeGame = (overrides: Partial<HistoryGame>): HistoryGame => ({
  _id: "game",
  _creationTime: 1,
  userId: "alice",
  players: ["alice", "bob"],
  phrase: "hello",
  words: ["fast"],
  holds: [{ word: "hold", number: 1 }],
  lettersAndSymbols: ["!"],
  playersAccepted: ["alice", "bob"],
  winner: "alice",
  language: "es",
  createdAt: 1,
  progress: {
    alice: {
      phraseMetrics: { errors: 1, timeMs: 1000, accuracy: 90, wpm: 40 },
      wordsMetrics: { errors: 0, timeMs: 2000, accuracy: 100, wpm: 60 },
    },
  },
  ...overrides,
});

describe("historyPresentation", () => {
  it("filters history by result and mode for the current user", () => {
    const games = [
      makeGame({ _id: "win-human", winner: "alice", againstBot: false }),
      makeGame({ _id: "loss-bot", winner: "bot", againstBot: true }),
    ];

    expect(filterHistoryGames(games, "wins", "alice").map((game) => game._id))
      .toEqual(["win-human"]);
    expect(filterHistoryGames(games, "losses", "alice").map((game) => game._id))
      .toEqual(["loss-bot"]);
    expect(filterHistoryGames(games, "1v1", "alice").map((game) => game._id))
      .toEqual(["win-human"]);
    expect(filterHistoryGames(games, "bot", "alice").map((game) => game._id))
      .toEqual(["loss-bot"]);
  });

  it("summarizes page totals from completed stage metrics", () => {
    const summary = summarizeHistoryPage(
      [
        makeGame({ winner: "alice" }),
        makeGame({ _id: "loss", winner: "bob" }),
      ],
      "alice"
    );

    expect(summary).toEqual({
      total: 2,
      winRate: 50,
      averageWpm: 50,
      averageAccuracy: 95,
    });
  });

  it("calculates average metrics for one history item", () => {
    expect(
      calculateHistoryAverageMetrics(makeGame({}).progress, "alice")
    ).toEqual({
      timeMs: 3000,
      errors: 1,
      accuracy: 95,
      wpm: 50,
    });
  });

  it("uses opponent snapshots before legacy bot profile labels", () => {
    expect(
      getHistoryOpponent(
        makeGame({
          opponentSnapshot: {
            userId: "bot",
            nickname: "Tecla Turbo",
            avatarSeed: "tecla-turbo",
          },
          botProfile: {
            userId: "bot",
            nickname: "Bot",
          },
        })
      )
    ).toEqual({
      userId: "bot",
      nickname: "Tecla Turbo",
      avatarSeed: "tecla-turbo",
    });
  });

  it("falls back to old bot profiles for existing history rows", () => {
    expect(
      getHistoryOpponent(
        makeGame({
          againstBot: true,
          botProfile: {
            userId: "bot",
            nickname: "Retro Bot",
          },
        })
      )
    ).toEqual({
      userId: "bot",
      nickname: "Retro Bot",
    });
  });

  it("formats missing and present metric values consistently", () => {
    expect(formatHistoryTime(1250)).toBe("1.3s");
    expect(formatHistoryWpm(undefined)).toBe("N/A");
    expect(formatHistoryWpm(41.4)).toBe("41");
    expect(formatHistoryAccuracy(undefined)).toBe("N/A");
    expect(formatHistoryAccuracy(98.6)).toBe("99%");
  });
});
