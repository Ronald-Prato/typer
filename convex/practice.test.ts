import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "./_generated/api";
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

async function insertUser(t: ReturnType<typeof convexTest>, authId: string) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("user", {
      authId,
      email: `${authId}@example.com`,
      nickname: authId,
      nicknameSearch: authId,
      status: "online",
    });
  });
}

async function findByAuthId(t: ReturnType<typeof convexTest>, authId: string) {
  return await t.run(async (ctx) => {
    return await (ctx.db as any)
      .query("user")
      .withIndex("by_auth_id", (q: any) => q.eq("authId", authId))
      .first();
  });
}

describe("practice persistence", () => {
  test("updates the user's highest practice WPM only when a practice beats it", async () => {
    const t = convexTest(schema, modules);
    await insertUser(t, "alice");
    const asAlice = t.withIdentity(identity("alice"));

    await asAlice.mutation(api.practice.addPractice, {
      wpm: 72,
      accuracy: 0.96,
      time: 1.2,
      errors: 2,
    });
    expect((await findByAuthId(t, "alice"))?.highestPracticeWpm).toBe(72);

    await asAlice.mutation(api.practice.addPractice, {
      wpm: 68,
      accuracy: 0.98,
      time: 1.1,
      errors: 1,
    });
    expect((await findByAuthId(t, "alice"))?.highestPracticeWpm).toBe(72);

    await asAlice.mutation(api.practice.addPractice, {
      wpm: 85,
      accuracy: 0.94,
      time: 1,
      errors: 3,
    });
    expect((await findByAuthId(t, "alice"))?.highestPracticeWpm).toBe(85);
  });
});
