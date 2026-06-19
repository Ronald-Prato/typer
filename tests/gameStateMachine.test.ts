import { describe, expect, it } from "vitest";
import {
  applyGameStep,
  canAcceptGame,
  getNextBotStep,
  validateGameMetrics,
} from "../convex/gameStateMachine";

describe("gameStateMachine", () => {
  const playerId = "player-1";

  it("requires players to accept before progressing", () => {
    expect(() =>
      applyGameStep({
        game: {
          players: [playerId, "player-2"],
          playersAccepted: ["player-2"],
          progress: {},
        },
        playerId,
        userStatus: "in_game",
        step: "phrase",
      })
    ).toThrow(/accepted/i);
  });

  it("requires in_game user status before progressing", () => {
    expect(() =>
      applyGameStep({
        game: {
          players: [playerId, "player-2"],
          playersAccepted: [playerId, "player-2"],
          progress: {},
        },
        playerId,
        userStatus: "game_found",
        step: "phrase",
      })
    ).toThrow(/in_game/i);
  });

  it("rejects out-of-order and repeated steps", () => {
    const game = {
      players: [playerId, "player-2"],
      playersAccepted: [playerId, "player-2"],
      progress: {},
    };

    expect(() =>
      applyGameStep({ game, playerId, userStatus: "in_game", step: "words" })
    ).toThrow(/order/i);

    const afterPhrase = applyGameStep({
      game,
      playerId,
      userStatus: "in_game",
      step: "phrase",
    });

    expect(() =>
      applyGameStep({
        game: { ...game, progress: afterPhrase.progress },
        playerId,
        userStatus: "in_game",
        step: "phrase",
      })
    ).toThrow(/already/i);
  });

  it("records ordered progress and marks winner on holds", () => {
    let progress = {};
    for (const step of ["phrase", "words", "lettersAndSymbols"] as const) {
      progress = applyGameStep({
        game: {
          players: [playerId, "player-2"],
          playersAccepted: [playerId, "player-2"],
          progress,
        },
        playerId,
        userStatus: "in_game",
        step,
        metrics: { errors: 0, timeMs: 1000, accuracy: 100, wpm: 45 },
      }).progress;
    }

    const result = applyGameStep({
      game: {
        players: [playerId, "player-2"],
        playersAccepted: [playerId, "player-2"],
        progress,
      },
      playerId,
      userStatus: "in_game",
      step: "holds",
      metrics: { errors: 1, timeMs: 2000, accuracy: 98, wpm: 42 },
    });

    expect(result.progress[playerId]?.holdsDone).toBe(true);
    expect(result.winner).toBe(playerId);
  });

  it("validates metric ranges", () => {
    expect(validateGameMetrics({ errors: 0, timeMs: 1, accuracy: 0, wpm: 0 }))
      .toEqual({ errors: 0, timeMs: 1, accuracy: 0, wpm: 0 });
    expect(() => validateGameMetrics({ errors: -1, timeMs: 1 })).toThrow(
      /errors/i
    );
    expect(() => validateGameMetrics({ errors: 0, timeMs: 0 })).toThrow(
      /timeMs/i
    );
    expect(() =>
      validateGameMetrics({ errors: 0, timeMs: 1, accuracy: 101 })
    ).toThrow(/accuracy/i);
    expect(() =>
      validateGameMetrics({ errors: 0, timeMs: 1, wpm: 501 })
    ).toThrow(/wpm/i);
  });

  it("deduplicates accepted players and only starts when all accepted", () => {
    expect(
      canAcceptGame({
        players: [playerId, "player-2"],
        playersAccepted: [playerId],
        playerId,
      })
    ).toEqual({ playersAccepted: [playerId], allAccepted: false });

    expect(
      canAcceptGame({
        players: [playerId, "player-2"],
        playersAccepted: [playerId],
        playerId: "player-2",
      })
    ).toEqual({
      playersAccepted: [playerId, "player-2"],
      allAccepted: true,
    });
  });

  it("computes the next bot step from persisted progress", () => {
    expect(getNextBotStep(undefined)).toBe("phrase");
    expect(getNextBotStep({ phraseDone: true })).toBe("words");
    expect(
      getNextBotStep({
        phraseDone: true,
        wordsDone: true,
        lettersAndSymbolsDone: true,
        holdsDone: true,
      })
    ).toBe(null);
  });
});
