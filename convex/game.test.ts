import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  COMPETITIVE_SCROLL_COUNTDOWN_MS,
  COMPETITIVE_SCROLL_VERSUS_INTRO_MS,
} from "../src/domain/practiceScroll";
import schema from "./schema";

declare global {
  interface ImportMeta {
    glob: (pattern: string | string[]) => Record<string, () => Promise<unknown>>;
  }
}

const modules = import.meta.glob(["./**/*.{ts,js}", "!./**/*.test.ts"]);

const identity = (subject: string, email = `${subject}@example.com`) => ({
  subject,
  email,
});

async function insertUser(
  t: ReturnType<typeof convexTest>,
  authId: string,
  nickname: string,
  avatarSeed?: string,
  highestPracticeWpm?: number
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("user", {
      authId,
      email: `${authId}@example.com`,
      nickname,
      nicknameSearch: nickname.trim().toLocaleLowerCase(),
      avatarSeed,
      ...(highestPracticeWpm !== undefined ? { highestPracticeWpm } : {}),
      gold: 0,
      status: "online",
    });
  });
}

async function getUserById(
  t: ReturnType<typeof convexTest>,
  userId: Id<"user">
) {
  return await t.run(async (ctx) => {
    return await ctx.db.get(userId);
  });
}

describe("game rewards", () => {
  test("starts accepted scroll matches after the intro countdown window", async () => {
    const t = convexTest(schema, modules);
    const aliceId = await insertUser(t, "alice", "Alice");
    const bobId = await insertUser(t, "bob", "Bob");

    const gameId = await t.run(async (ctx) => {
      const insertedGameId = await ctx.db.insert("game", {
        mode: "scroll",
        players: [aliceId, bobId],
        phrase: "hello world",
        scrollText: "uno dos tres cuatro cinco seis",
        words: ["fast", "typing"],
        holds: [{ word: "hold", number: 3 }],
        lettersAndSymbols: ["A", "!"],
        playersAccepted: [aliceId],
        acceptDeadlineAt: Date.now() + 10_000,
        language: "en",
      });

      await Promise.all([
        ctx.db.patch(aliceId, {
          activeGame: insertedGameId,
          status: "game_found",
        }),
        ctx.db.patch(bobId, {
          activeGame: insertedGameId,
          status: "game_found",
        }),
      ]);

      return insertedGameId;
    });

    const beforeAccept = Date.now();
    const asBob = t.withIdentity(identity("bob"));
    await asBob.mutation(api.game.acceptGame, {});

    const [alice, bob, game] = await Promise.all([
      getUserById(t, aliceId),
      getUserById(t, bobId),
      t.run(async (ctx) => ctx.db.get(gameId)),
    ]);
    const startDelay =
      COMPETITIVE_SCROLL_VERSUS_INTRO_MS + COMPETITIVE_SCROLL_COUNTDOWN_MS;

    expect(alice?.status).toBe("in_game");
    expect(bob?.status).toBe("in_game");
    expect(game?.playersAccepted).toEqual([aliceId, bobId]);
    expect(game?.scrollStartedAt).toBeGreaterThanOrEqual(
      beforeAccept + startDelay
    );
    expect(game?.botScrollPlan).toBeUndefined();
  });

  test("expires pending match acceptance and clears human players", async () => {
    const t = convexTest(schema, modules);
    const aliceId = await insertUser(t, "alice", "Alice");
    const bobId = await insertUser(t, "bob", "Bob");
    const acceptDeadlineAt = 1;

    const gameId = await t.run(async (ctx) => {
      const insertedGameId = await ctx.db.insert("game", {
        players: [aliceId, bobId],
        phrase: "hello world",
        words: ["fast", "typing"],
        holds: [{ word: "hold", number: 3 }],
        lettersAndSymbols: ["A", "!"],
        playersAccepted: [aliceId],
        acceptDeadlineAt,
        language: "en",
      });

      await Promise.all([
        ctx.db.patch(aliceId, {
          activeGame: insertedGameId,
          status: "game_found",
        }),
        ctx.db.patch(bobId, {
          activeGame: insertedGameId,
          status: "game_found",
        }),
      ]);

      return insertedGameId;
    });

    await t.mutation(internal.game.expirePendingGame, {
      gameId,
      acceptDeadlineAt,
    });

    const [alice, bob] = await Promise.all([
      getUserById(t, aliceId),
      getUserById(t, bobId),
    ]);

    expect(alice?.status).toBe("online");
    expect(alice?.activeGame).toBeUndefined();
    expect(bob?.status).toBe("online");
    expect(bob?.activeGame).toBeUndefined();
  });

  test("adds 10 typocoins to the legacy gold balance for a 1v1 winner", async () => {
    const t = convexTest(schema, modules);
    const aliceId = await insertUser(t, "alice", "Alice");
    const bobId = await insertUser(t, "bob", "Bob");

    const gameId = await t.run(async (ctx) => {
      const insertedGameId = await ctx.db.insert("game", {
        players: [aliceId, bobId],
        phrase: "hello world",
        words: ["fast", "typing"],
        holds: [{ word: "hold", number: 3 }],
        lettersAndSymbols: ["A", "!"],
        playersAccepted: [aliceId, bobId],
        language: "en",
      });

      await Promise.all([
        ctx.db.patch(aliceId, {
          activeGame: insertedGameId,
          status: "in_game",
        }),
        ctx.db.patch(bobId, {
          activeGame: insertedGameId,
          status: "in_game",
        }),
      ]);

      return insertedGameId;
    });

    const asAlice = t.withIdentity(identity("alice"));
    const metrics = { errors: 0, timeMs: 1000, accuracy: 100, wpm: 50 };

    await asAlice.mutation(api.game.setStepDone, {
      step: "phrase",
      metrics,
    });
    await asAlice.mutation(api.game.setStepDone, {
      step: "words",
      metrics,
    });
    await asAlice.mutation(api.game.setStepDone, {
      step: "lettersAndSymbols",
      metrics,
    });
    await asAlice.mutation(api.game.setStepDone, {
      step: "holds",
      metrics,
    });

    const [alice, bob, game] = await Promise.all([
      getUserById(t, aliceId),
      getUserById(t, bobId),
      t.run(async (ctx) => ctx.db.get(gameId)),
    ]);

    expect(game?.winner).toBe(aliceId);
    expect(alice?.gold).toBe(10);
    expect(bob?.gold).toBe(0);
  });

  test("marks the remaining classic player as winner when their opponent abandons", async () => {
    const t = convexTest(schema, modules);
    const aliceId = await insertUser(t, "alice", "Alice");
    const bobId = await insertUser(t, "bob", "Bob");

    const gameId = await t.run(async (ctx) => {
      const insertedGameId = await ctx.db.insert("game", {
        mode: "classic",
        players: [aliceId, bobId],
        phrase: "hello world",
        words: ["fast", "typing"],
        holds: [{ word: "hold", number: 3 }],
        lettersAndSymbols: ["A", "!"],
        playersAccepted: [aliceId, bobId],
        language: "en",
      });

      await Promise.all([
        ctx.db.patch(aliceId, {
          activeGame: insertedGameId,
          status: "in_game",
        }),
        ctx.db.patch(bobId, {
          activeGame: insertedGameId,
          status: "in_game",
        }),
      ]);

      return insertedGameId;
    });

    await t.withIdentity(identity("alice")).mutation(api.game.finishGame, {});

    const [alice, bob, game, historyRows] = await Promise.all([
      getUserById(t, aliceId),
      getUserById(t, bobId),
      t.run(async (ctx) => ctx.db.get(gameId)),
      t.run(async (ctx) => ctx.db.query("gameHistory").collect()),
    ]);

    expect(game?.winner).toBe(bobId);
    expect(alice?.status).toBe("online");
    expect(alice?.activeGame).toBeUndefined();
    expect(bob?.status).toBe("in_game");
    expect(bob?.activeGame).toBe(gameId);
    expect(bob?.gold).toBe(10);
    expect(historyRows).toHaveLength(2);
    expect(historyRows.map((row) => row.winner)).toEqual([bobId, bobId]);
  });

  test("adds 10 typocoins when a human wins a classic match against a bot", async () => {
    const t = convexTest(schema, modules);
    const aliceId = await insertUser(t, "alice", "Alice");
    const botId = await insertUser(t, "imabot", "Generic Bot");

    const gameId = await t.run(async (ctx) => {
      const insertedGameId = await ctx.db.insert("game", {
        players: [aliceId, botId],
        phrase: "hello world",
        words: ["fast", "typing"],
        holds: [{ word: "hold", number: 3 }],
        lettersAndSymbols: ["A", "!"],
        playersAccepted: [aliceId, botId],
        language: "en",
        againstBot: true,
        botProfile: {
          userId: botId,
          nickname: "Tecla Turbo",
          avatarSeed: "tecla-turbo",
        },
      });

      await ctx.db.patch(aliceId, {
        activeGame: insertedGameId,
        status: "in_game",
      });

      return insertedGameId;
    });

    const asAlice = t.withIdentity(identity("alice"));
    const metrics = { errors: 0, timeMs: 1000, accuracy: 100, wpm: 50 };

    await asAlice.mutation(api.game.setStepDone, {
      step: "phrase",
      metrics,
    });
    await asAlice.mutation(api.game.setStepDone, {
      step: "words",
      metrics,
    });
    await asAlice.mutation(api.game.setStepDone, {
      step: "lettersAndSymbols",
      metrics,
    });
    await asAlice.mutation(api.game.setStepDone, {
      step: "holds",
      metrics,
    });

    const [alice, bot, game, historyRows] = await Promise.all([
      getUserById(t, aliceId),
      getUserById(t, botId),
      t.run(async (ctx) => ctx.db.get(gameId)),
      t.run(async (ctx) => ctx.db.query("gameHistory").collect()),
    ]);

    expect(game?.winner).toBe(aliceId);
    expect(alice?.gold).toBe(10);
    expect(bot?.gold).toBe(0);
    expect(historyRows).toHaveLength(1);
    expect(historyRows[0]).toMatchObject({
      userId: aliceId,
      winner: aliceId,
      againstBot: true,
    });
  });

  test("updates human players' best WPM from finished classic match progress", async () => {
    const t = convexTest(schema, modules);
    const aliceId = await insertUser(t, "alice", "Alice", undefined, 60);
    const bobId = await insertUser(t, "bob", "Bob", undefined, 75);

    await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("game", {
        players: [aliceId, bobId],
        phrase: "hello world",
        words: ["fast", "typing"],
        holds: [{ word: "hold", number: 3 }],
        lettersAndSymbols: ["A", "!"],
        playersAccepted: [aliceId, bobId],
        language: "en",
      });

      await Promise.all([
        ctx.db.patch(aliceId, {
          activeGame: gameId,
          status: "in_game",
        }),
        ctx.db.patch(bobId, {
          activeGame: gameId,
          status: "in_game",
        }),
      ]);
    });

    const asBob = t.withIdentity(identity("bob"));
    await asBob.mutation(api.game.setStepDone, {
      step: "phrase",
      metrics: { errors: 0, timeMs: 1000, accuracy: 100, wpm: 80 },
    });
    await asBob.mutation(api.game.setStepDone, {
      step: "words",
      metrics: { errors: 0, timeMs: 1000, accuracy: 100, wpm: 90 },
    });

    const asAlice = t.withIdentity(identity("alice"));
    await asAlice.mutation(api.game.setStepDone, {
      step: "phrase",
      metrics: { errors: 0, timeMs: 1000, accuracy: 100, wpm: 70 },
    });
    await asAlice.mutation(api.game.setStepDone, {
      step: "words",
      metrics: { errors: 0, timeMs: 1000, accuracy: 100, wpm: 90 },
    });
    await asAlice.mutation(api.game.setStepDone, {
      step: "lettersAndSymbols",
      metrics: { errors: 0, timeMs: 1000, accuracy: 100, wpm: 110 },
    });
    await asAlice.mutation(api.game.setStepDone, {
      step: "holds",
      metrics: { errors: 0, timeMs: 1000, accuracy: 100, wpm: 130 },
    });

    const [alice, bob] = await Promise.all([
      getUserById(t, aliceId),
      getUserById(t, bobId),
    ]);

    expect(alice?.highestPracticeWpm).toBe(100);
    expect(bob?.highestPracticeWpm).toBe(85);
  });

  test("stores the opponent snapshot for each 1v1 history row", async () => {
    const t = convexTest(schema, modules);
    const aliceId = await insertUser(t, "alice", "Alice", "alice-seed");
    const bobId = await insertUser(t, "bob", "Bobby", "bob-seed");

    const gameId = await t.run(async (ctx) => {
      const insertedGameId = await ctx.db.insert("game", {
        players: [aliceId, bobId],
        phrase: "hello world",
        words: ["fast", "typing"],
        holds: [{ word: "hold", number: 3 }],
        lettersAndSymbols: ["A", "!"],
        playersAccepted: [aliceId, bobId],
        language: "en",
      });

      await Promise.all([
        ctx.db.patch(aliceId, {
          activeGame: insertedGameId,
          status: "in_game",
        }),
        ctx.db.patch(bobId, {
          activeGame: insertedGameId,
          status: "in_game",
        }),
      ]);

      return insertedGameId;
    });

    const asAlice = t.withIdentity(identity("alice"));
    const metrics = { errors: 0, timeMs: 1000, accuracy: 100, wpm: 50 };

    await asAlice.mutation(api.game.setStepDone, {
      step: "phrase",
      metrics,
    });
    await asAlice.mutation(api.game.setStepDone, {
      step: "words",
      metrics,
    });
    await asAlice.mutation(api.game.setStepDone, {
      step: "lettersAndSymbols",
      metrics,
    });
    await asAlice.mutation(api.game.setStepDone, {
      step: "holds",
      metrics,
    });

    const historyRows = await t.run(async (ctx) => {
      return await ctx.db.query("gameHistory").collect();
    });
    const aliceHistory = historyRows.find((row) => row.userId === aliceId);
    const bobHistory = historyRows.find((row) => row.userId === bobId);

    expect(gameId).toBeDefined();
    expect(aliceHistory?.opponentSnapshot).toMatchObject({
      userId: bobId,
      nickname: "Bobby",
      avatarSeed: "bob-seed",
    });
    expect(bobHistory?.opponentSnapshot).toMatchObject({
      userId: aliceId,
      nickname: "Alice",
      avatarSeed: "alice-seed",
    });
  });

  test("finishes a scroll match when a player completes the scroll text", async () => {
    const t = convexTest(schema, modules);
    const aliceId = await insertUser(t, "alice", "Alice", "alice-seed");
    const bobId = await insertUser(t, "bob", "Bobby", "bob-seed");
    const scrollText = "uno dos";

    const gameId = await t.run(async (ctx) => {
      const insertedGameId = await ctx.db.insert("game", {
        mode: "scroll",
        players: [aliceId, bobId],
        phrase: "hello world",
        scrollText,
        words: ["fast", "typing"],
        holds: [{ word: "hold", number: 3 }],
        lettersAndSymbols: ["A", "!"],
        playersAccepted: [aliceId, bobId],
        language: "en",
      });

      await Promise.all([
        ctx.db.patch(aliceId, {
          activeGame: insertedGameId,
          status: "in_game",
        }),
        ctx.db.patch(bobId, {
          activeGame: insertedGameId,
          status: "in_game",
        }),
      ]);

      return insertedGameId;
    });

    await t.withIdentity(identity("alice")).mutation(api.game.updateScrollProgress, {
      currentIndex: scrollText.length,
      errors: 0,
    });

    const [alice, game, historyRows] = await Promise.all([
      getUserById(t, aliceId),
      t.run(async (ctx) => ctx.db.get(gameId)),
      t.run(async (ctx) => ctx.db.query("gameHistory").collect()),
    ]);

    expect(game?.winner).toBe(aliceId);
    expect(game?.scrollProgress?.[aliceId]).toMatchObject({
      currentIndex: scrollText.length,
      typedWords: 2,
      completed: true,
    });
    expect(alice?.gold).toBe(10);
    expect(historyRows).toHaveLength(2);
    expect(historyRows[0]).toMatchObject({
      mode: "scroll",
      scrollText,
    });
  });

  test("marks the remaining scroll player as winner when their opponent abandons", async () => {
    const t = convexTest(schema, modules);
    const aliceId = await insertUser(t, "alice", "Alice", "alice-seed");
    const bobId = await insertUser(t, "bob", "Bobby", "bob-seed");
    const scrollText = "uno dos tres cuatro";

    const gameId = await t.run(async (ctx) => {
      const insertedGameId = await ctx.db.insert("game", {
        mode: "scroll",
        players: [aliceId, bobId],
        phrase: "hello world",
        scrollText,
        words: ["fast", "typing"],
        holds: [{ word: "hold", number: 3 }],
        lettersAndSymbols: ["A", "!"],
        playersAccepted: [aliceId, bobId],
        language: "en",
        scrollStartedAt: 1000,
        scrollProgress: {
          [aliceId]: {
            currentIndex: 7,
            typedWords: 2,
            failed: false,
            completed: false,
            startedAt: 1000,
            errors: 1,
          },
        },
      });

      await Promise.all([
        ctx.db.patch(aliceId, {
          activeGame: insertedGameId,
          status: "in_game",
        }),
        ctx.db.patch(bobId, {
          activeGame: insertedGameId,
          status: "in_game",
        }),
      ]);

      return insertedGameId;
    });

    await t.withIdentity(identity("alice")).mutation(api.game.finishGame, {});

    const [alice, bob, game, historyRows] = await Promise.all([
      getUserById(t, aliceId),
      getUserById(t, bobId),
      t.run(async (ctx) => ctx.db.get(gameId)),
      t.run(async (ctx) => ctx.db.query("gameHistory").collect()),
    ]);

    expect(game?.winner).toBe(bobId);
    expect(game?.scrollProgress?.[aliceId]).toMatchObject({
      currentIndex: 7,
      typedWords: 2,
      failed: true,
      completed: false,
      errors: 1,
    });
    expect(alice?.status).toBe("online");
    expect(alice?.activeGame).toBeUndefined();
    expect(bob?.status).toBe("in_game");
    expect(bob?.activeGame).toBe(gameId);
    expect(bob?.gold).toBe(10);
    expect(historyRows).toHaveLength(2);
    expect(historyRows.map((row) => row.winner)).toEqual([bobId, bobId]);
  });

  test("adds 10 typocoins when a bot tick closes a scroll match won by the human", async () => {
    const t = convexTest(schema, modules);
    const aliceId = await insertUser(t, "alice", "Alice", "alice-seed");
    const botId = await insertUser(t, "imabot", "Generic Bot", "bot-seed");
    const scrollText = "uno dos";

    const gameId = await t.run(async (ctx) => {
      const insertedGameId = await ctx.db.insert("game", {
        mode: "scroll",
        players: [aliceId, botId],
        phrase: "hello world",
        scrollText,
        words: ["fast", "typing"],
        holds: [{ word: "hold", number: 3 }],
        lettersAndSymbols: ["A", "!"],
        playersAccepted: [aliceId, botId],
        language: "en",
        againstBot: true,
        botProfile: {
          userId: botId,
          nickname: "Tecla Turbo",
          avatarSeed: "tecla-turbo",
        },
        botScrollPlan: {
          botId,
          startedAt: Date.now(),
          charsPerSecond: 0,
        },
        scrollProgress: {
          [aliceId]: {
            currentIndex: scrollText.length,
            typedWords: 2,
            failed: false,
            completed: true,
            startedAt: 1000,
            finishedAt: 2000,
            errors: 0,
          },
        },
      });

      await ctx.db.patch(aliceId, {
        activeGame: insertedGameId,
        status: "in_game",
      });

      return insertedGameId;
    });

    await t.mutation(internal.game.tickScrollBot, {
      gameId,
      botId,
    });

    const [alice, bot, game, historyRows] = await Promise.all([
      getUserById(t, aliceId),
      getUserById(t, botId),
      t.run(async (ctx) => ctx.db.get(gameId)),
      t.run(async (ctx) => ctx.db.query("gameHistory").collect()),
    ]);

    expect(game?.winner).toBe(aliceId);
    expect(alice?.gold).toBe(10);
    expect(bot?.gold).toBe(0);
    expect(historyRows).toHaveLength(1);
    expect(historyRows[0]).toMatchObject({
      mode: "scroll",
      userId: aliceId,
      winner: aliceId,
      againstBot: true,
    });
  });

  test("ignores backwards scroll updates and rejects progress for classic games", async () => {
    const t = convexTest(schema, modules);
    const aliceId = await insertUser(t, "alice", "Alice");
    const bobId = await insertUser(t, "bob", "Bob");

    const gameId = await t.run(async (ctx) => {
      const insertedGameId = await ctx.db.insert("game", {
        mode: "scroll",
        players: [aliceId, bobId],
        phrase: "hello world",
        scrollText: "uno dos tres",
        words: ["fast", "typing"],
        holds: [{ word: "hold", number: 3 }],
        lettersAndSymbols: ["A", "!"],
        playersAccepted: [aliceId, bobId],
        language: "en",
      });

      await ctx.db.patch(aliceId, {
        activeGame: insertedGameId,
        status: "in_game",
      });

      return insertedGameId;
    });

    const asAlice = t.withIdentity(identity("alice"));

    await asAlice.mutation(api.game.updateScrollProgress, {
      currentIndex: 7,
      errors: 0,
    });

    await asAlice.mutation(api.game.updateScrollProgress, {
      currentIndex: 3,
      errors: 0,
    });

    const gameAfterBackwardsUpdate = await t.run(async (ctx) =>
      ctx.db.get(gameId)
    );
    expect(gameAfterBackwardsUpdate?.scrollProgress?.[aliceId]).toMatchObject({
      currentIndex: 7,
      typedWords: 2,
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(gameId, {
        mode: "classic",
      });
    });

    await expect(
      asAlice.mutation(api.game.updateScrollProgress, {
        currentIndex: 8,
        errors: 0,
      })
    ).rejects.toThrow("Esta partida no es Scroll");
  });
});
