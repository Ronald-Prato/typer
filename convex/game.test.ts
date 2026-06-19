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
  nickname: string
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("user", {
      authId,
      email: `${authId}@example.com`,
      nickname,
      nicknameSearch: nickname.trim().toLocaleLowerCase(),
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
});
