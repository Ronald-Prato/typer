import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
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
  avatarSeed?: string
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("user", {
      authId,
      email: `${authId}@example.com`,
      nickname,
      nicknameSearch: nickname.trim().toLocaleLowerCase(),
      avatarSeed,
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
  test("adds 10 gold to the user who wins a 1v1 match", async () => {
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

  test("rejects scroll progress for classic games and backwards updates", async () => {
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

    await expect(
      asAlice.mutation(api.game.updateScrollProgress, {
        currentIndex: 3,
        errors: 0,
      })
    ).rejects.toThrow("Scroll progress cannot move backwards");

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
