import { describe, expect, it } from "vitest";
import {
  deriveStepFromProgress,
  getAcceptedMatchRoute,
  getMatchAcceptCountdownSeconds,
  getNextStepSubmission,
  isAcceptedMatchReadyToEnter,
  summarizeClassicMatchMetrics,
} from "./matchFlow";

const content = {
  phrase: "hello",
  words: ["ab", "cd"],
  lettersAndSymbols: ["@", "#"],
  holds: [{ word: "shift", number: 1 }],
};

describe("matchFlow", () => {
  it("derives the local stage from persisted progress", () => {
    expect(deriveStepFromProgress({})).toBe("1");
    expect(deriveStepFromProgress({ phraseDone: true })).toBe("2");
    expect(deriveStepFromProgress({ wordsDone: true })).toBe("3");
    expect(deriveStepFromProgress({ lettersAndSymbolsDone: true })).toBe("4");
  });

  it("maps stage one metrics to a phrase payload and next step", () => {
    expect(
      getNextStepSubmission({
        step: "1",
        content,
        metrics: { errors: 1, timeMs: 60_000 },
      })
    ).toEqual({
      nextStep: "2",
      payload: {
        step: "phrase",
        metrics: { errors: 1, timeMs: 60_000, accuracy: 80, wpm: 1 },
      },
    });
  });

  it("returns no next step after submitting holds", () => {
    expect(
      getNextStepSubmission({
        step: "4",
        content,
        metrics: { errors: 0, timeMs: 30_000 },
      })
    ).toMatchObject({
      nextStep: null,
      payload: {
        step: "holds",
        metrics: { errors: 0, timeMs: 30_000, accuracy: 100, wpm: 2 },
      },
    });
  });

  it("summarizes completed classic match metrics for the result overlay", () => {
    expect(
      summarizeClassicMatchMetrics({
        phraseMetrics: { errors: 1, timeMs: 10_000, accuracy: 95, wpm: 42 },
        wordsMetrics: { errors: 0, timeMs: 20_000, accuracy: 100, wpm: 54 },
        lettersAndSymbolsMetrics: {
          errors: 2,
          timeMs: 30_000,
          accuracy: 90,
          wpm: 48,
        },
        holdsMetrics: { errors: 1, timeMs: 40_000, accuracy: 85, wpm: 36 },
      })
    ).toEqual({
      averageAccuracy: 93,
      averageWpm: 45,
      completedStages: 4,
      stageCount: 4,
      totalErrors: 4,
      totalTimeMs: 100_000,
    });
  });

  it("returns empty classic result metrics before progress exists", () => {
    expect(summarizeClassicMatchMetrics(undefined)).toEqual({
      averageAccuracy: 0,
      averageWpm: 0,
      completedStages: 0,
      stageCount: 4,
      totalErrors: 0,
      totalTimeMs: 0,
    });
  });

  it("routes accepted matches by backend mode", () => {
    expect(getAcceptedMatchRoute("scroll")).toBe("/scroll");
    expect(getAcceptedMatchRoute("classic")).toBe("/1v1");
    expect(getAcceptedMatchRoute(undefined)).toBe("/1v1");
  });

  it("allows entering after all players accepted even when the user is already in_game", () => {
    expect(
      isAcceptedMatchReadyToEnter({
        activeGame: "game-1",
        status: "in_game",
        players: ["alice", "bob"],
        playersAccepted: ["bob", "alice"],
      })
    ).toBe(true);
  });

  it("waits until every player accepted before entering", () => {
    expect(
      isAcceptedMatchReadyToEnter({
        activeGame: "game-1",
        status: "game_found",
        players: ["alice", "bob"],
        playersAccepted: ["alice"],
      })
    ).toBe(false);
  });

  it("counts down match acceptance seconds from the backend deadline", () => {
    expect(
      getMatchAcceptCountdownSeconds({
        acceptDeadlineAt: 15_000,
        now: 10_001,
      })
    ).toBe(5);
    expect(
      getMatchAcceptCountdownSeconds({
        acceptDeadlineAt: 15_000,
        now: 14_999,
      })
    ).toBe(1);
    expect(
      getMatchAcceptCountdownSeconds({
        acceptDeadlineAt: 15_000,
        now: 16_000,
      })
    ).toBe(0);
    expect(
      getMatchAcceptCountdownSeconds({
        acceptDeadlineAt: null,
        now: 16_000,
      })
    ).toBe(null);
  });

  it("does not enter without an active match state", () => {
    expect(
      isAcceptedMatchReadyToEnter({
        activeGame: undefined,
        status: "in_game",
        players: ["alice", "bob"],
        playersAccepted: ["alice", "bob"],
      })
    ).toBe(false);
    expect(
      isAcceptedMatchReadyToEnter({
        activeGame: "game-1",
        status: "online",
        players: ["alice", "bob"],
        playersAccepted: ["alice", "bob"],
      })
    ).toBe(false);
  });
});
