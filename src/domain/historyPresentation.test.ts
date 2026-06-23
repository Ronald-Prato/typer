import { describe, expect, it } from "vitest";
import {
  calculateHistoryAverageMetrics,
  filterHistoryGames,
  formatHistoryAccuracy,
  formatHistoryTime,
  formatHistoryWpm,
  getHistoryPageItems,
  getHistoryPaginationPages,
  getHistoryPrimaryStats,
  getHistoryStageStats,
  getHistoryOpponent,
  isHistoryPageLoaded,
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

  it("derives scroll WPM and mode-specific stats from scroll progress", () => {
    const scrollGame = makeGame({
      mode: "scroll",
      scrollText: "hello world again now",
      createdAt: 70_000,
      progress: undefined,
      scrollProgress: {
        alice: {
          currentIndex: 20,
          typedWords: 4,
          failed: false,
          completed: true,
          startedAt: 10_000,
          finishedAt: 70_000,
          errors: 2,
        },
      },
    });

    expect(calculateHistoryAverageMetrics(scrollGame, "alice")).toEqual({
      timeMs: 60_000,
      errors: 2,
      accuracy: 91,
      wpm: 4,
    });
    expect(getHistoryPrimaryStats(scrollGame, "alice")).toEqual([
      { label: "WPM", value: "4", emphasis: true },
      { label: "Palabras", value: 4 },
      { label: "Errores", value: 2 },
      { label: "Estado", value: "Completado" },
    ]);
  });

  it("uses the history creation time for unfinished loser scroll progress", () => {
    const scrollGame = makeGame({
      mode: "scroll",
      createdAt: 45_000,
      progress: undefined,
      scrollProgress: {
        alice: {
          currentIndex: 10,
          typedWords: 2,
          failed: false,
          completed: false,
          startedAt: 15_000,
          errors: 0,
        },
      },
    });

    expect(calculateHistoryAverageMetrics(scrollGame, "alice")).toMatchObject({
      timeMs: 30_000,
      wpm: 4,
    });
    expect(getHistoryPrimaryStats(scrollGame, "alice")).toContainEqual({
      label: "Estado",
      value: "Rival terminó",
    });
  });

  it("returns per-stage classic stats without pretending every row has the same columns", () => {
    expect(getHistoryPrimaryStats(makeGame({}), "alice")).toEqual([
      { label: "WPM", value: "50", emphasis: true },
      { label: "Tiempo", value: "3.0s" },
      { label: "Errores", value: 1 },
      { label: "Precisión", value: "95%" },
    ]);
    const [phraseStage] = getHistoryStageStats(makeGame({}), "alice");
    expect(phraseStage.label).toBe("Frase");
    expect(phraseStage.stats).toEqual(
      expect.arrayContaining([
        { label: "WPM", value: "40", emphasis: true },
        { label: "Tiempo", value: "1.0s" },
      ])
    );
  });

  it("backfills missing classic WPM and accuracy from saved stage timing", () => {
    const game = makeGame({
      phrase: "hello",
      progress: {
        alice: {
          phraseMetrics: { errors: 1, timeMs: 60_000 },
        },
      },
    });

    expect(calculateHistoryAverageMetrics(game, "alice")).toEqual({
      timeMs: 60_000,
      errors: 1,
      accuracy: 80,
      wpm: 1,
    });
    expect(getHistoryStageStats(game, "alice")[0].stats).toEqual([
      { label: "WPM", value: "1", emphasis: true },
      { label: "Tiempo", value: "60.0s" },
      { label: "Errores", value: 1 },
      { label: "Precisión", value: "80%" },
    ]);
  });

  it("slices loaded history into stable pages", () => {
    expect(
      getHistoryPageItems({
        items: ["a", "b", "c", "d", "e"],
        page: 2,
        pageSize: 2,
      })
    ).toEqual(["c", "d"]);
    expect(
      getHistoryPageItems({
        items: ["a", "b", "c"],
        page: 99,
        pageSize: 2,
      })
    ).toEqual(["c"]);
  });

  it("exposes the next cursor-backed page while more records can load", () => {
    expect(
      getHistoryPaginationPages({
        currentPage: 1,
        hasMore: true,
        loadedItems: 5,
        pageSize: 5,
      })
    ).toEqual([1, 2]);
    expect(
      getHistoryPaginationPages({
        currentPage: 6,
        hasMore: true,
        loadedItems: 45,
        pageSize: 5,
      })
    ).toEqual([1, 5, 6, 7, 10]);
    expect(
      isHistoryPageLoaded({ loadedItems: 5, page: 2, pageSize: 5 })
    ).toBe(false);
    expect(
      isHistoryPageLoaded({ loadedItems: 8, page: 2, pageSize: 5 })
    ).toBe(true);
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
    expect(formatHistoryWpm(0)).toBe("0");
    expect(formatHistoryWpm(41.4)).toBe("41");
    expect(formatHistoryAccuracy(undefined)).toBe("N/A");
    expect(formatHistoryAccuracy(0)).toBe("0%");
    expect(formatHistoryAccuracy(98.6)).toBe("99%");
  });
});
