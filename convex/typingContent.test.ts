import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api, internal } from "./_generated/api";
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

async function insertQueuedUser(
  t: ReturnType<typeof convexTest>,
  authId: string,
  queuedMode: "classic" | "scroll",
  queuedAt: number
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("user", {
      authId,
      email: `${authId}@example.com`,
      nickname: authId,
      nicknameSearch: authId,
      status: "in_queue",
      queuedMode,
      queuedAt,
      gold: 0,
    });
  });
}

describe("typing content persistence", () => {
  test("seeds typing content once and keeps the migration idempotent", async () => {
    const t = convexTest(schema, modules);

    const firstRun = await t.mutation(internal.migrations.seedTypingContent, {});
    expect(firstRun).toEqual({
      inserted: 669,
      updated: 0,
      unchanged: 0,
      total: 669,
    });

    const secondRun = await t.mutation(internal.migrations.seedTypingContent, {});
    expect(secondRun).toEqual({
      inserted: 0,
      updated: 0,
      unchanged: 669,
      total: 669,
    });
  });

  test("returns active practice content ordered from Convex", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.migrations.seedTypingContent, {});

    const firstPhrase = await t.run(async (ctx) => {
      return await ctx.db
        .query("typingContent")
        .withIndex("by_source_key", (q) =>
          q.eq("sourceKey", "practicePhrase:0001")
        )
        .first();
    });
    expect(firstPhrase).not.toBeNull();

    await t.run(async (ctx) => {
      await ctx.db.patch(firstPhrase!._id, { active: false });
    });

    const content = await t.query(api.typingContent.getPracticeContent, {});

    expect(content.phrases).toHaveLength(114);
    expect(content.scrollParagraphs).toHaveLength(15);
    expect(content.phrases[0]).not.toBe(firstPhrase?.text);
  });

  test("rejects queue entry when typing content has not been seeded", async () => {
    const t = convexTest(schema, modules);
    await insertQueuedUser(t, "alice", "classic", Date.now());
    const asAlice = t.withIdentity(identity("alice"));

    await expect(
      asAlice.mutation(api.queue.getInQueue, { mode: "classic" })
    ).rejects.toThrow("Ejecuta migrations:seedTypingContent");
  });

  test("creates classic match snapshots from Convex typing content", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.migrations.seedTypingContent, {});
    const aliceId = await insertQueuedUser(t, "alice", "classic", 1);
    const bobId = await insertQueuedUser(t, "bob", "classic", 2);

    await t.mutation(internal.queue.matchQueuedUsers, {});

    const games = await t.run(async (ctx) => ctx.db.query("game").collect());

    expect(games).toHaveLength(1);
    expect(games[0]).toMatchObject({
      players: [aliceId, bobId],
      mode: "classic",
      language: "es",
    });
    expect(games[0].phrase).toBeTruthy();
    expect(games[0].words).toHaveLength(6);
    expect(games[0].lettersAndSymbols).toHaveLength(6);
    expect(games[0].holds).toHaveLength(6);
  });

  test("creates scroll match snapshots from Convex typing content", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.migrations.seedTypingContent, {});
    await insertQueuedUser(t, "alice", "scroll", 1);
    await insertQueuedUser(t, "bob", "scroll", 2);

    await t.mutation(internal.queue.matchQueuedUsers, {});

    const games = await t.run(async (ctx) => ctx.db.query("game").collect());

    expect(games).toHaveLength(1);
    expect(games[0].mode).toBe("scroll");
    expect(games[0].scrollText).toBeTruthy();
    expect(games[0].phrase).toBeTruthy();
    expect(games[0].words).toHaveLength(6);
  });

  test("replaces active typing content with generated OpenAI content", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.migrations.seedTypingContent, {});

    const result = await t.mutation(
      internal.typingContent.replaceGeneratedContent,
      {
        runId: "test-run",
        phrases: ["frase nueva uno", "frase nueva dos"],
        words: ["alfa", "beta", "gamma"],
        characters: ["a", "1", "!"],
        scrollParagraphs: ["Parrafo nuevo para scroll con varias palabras."],
      }
    );

    expect(result.totalInserted).toBe(9);
    const activeRows = await t.run(async (ctx) => {
      return await ctx.db
        .query("typingContent")
        .withIndex("by_kind_active_sort_order", (q) =>
          q.eq("kind", "practicePhrase").eq("active", true)
        )
        .collect();
    });
    const content = await t.query(api.typingContent.getPracticeContent, {});

    expect(activeRows.map((row) => row.text)).toEqual([
      "frase nueva uno",
      "frase nueva dos",
    ]);
    expect(content.phrases).toEqual(["frase nueva uno", "frase nueva dos"]);
    expect(content.scrollParagraphs).toEqual([
      "Parrafo nuevo para scroll con varias palabras.",
    ]);
  });
});
