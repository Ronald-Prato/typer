import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createGame = mutation({
  args: {
    name: v.string(),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    language: v.union(
      v.literal("javascript"),
      v.literal("python"),
      v.literal("java"),
      v.literal("c++"),
      v.literal("c"),
      v.literal("c#"),
      v.literal("typescript"),
      v.literal("sql"),
      v.literal("go"),
      v.literal("php")
    ),
  },
  handler: async (ctx, args) => {
    const { name, difficulty, language } = args;

    const snippetsIds = await ctx.db
      .query("snippet")
      .withIndex("by_difficulty", (q) => q.eq("difficulty", difficulty))
      .filter((q) => q.eq(q.field("language"), language))
      .filter((q) => q.eq(q.field("difficulty"), difficulty))
      .collect();

    if (snippetsIds.length < 5) {
      throw new Error("No se encontraron suficientes snippets");
    }

    await ctx.db.insert("game", {
      name,
      language,
      difficulty,
      snippets: snippetsIds.map((snippet) => snippet._id),
    });
  },
});

export const getGameById = query({
  args: {
    id: v.id("game"),
  },
  handler: async (ctx, args) => {
    const { id } = args;

    const game = await ctx.db.get(id);

    if (!game) {
      throw new Error("Game not found");
    }

    const snippets = await Promise.all(
      game.snippets.map((id) => ctx.db.get(id))
    );

    return {
      ...game,
      snippets: snippets.map((snippet) => ({
        id: snippet?._id,
        code: snippet?.code ?? "",
        language: snippet?.language ?? "",
        difficulty: snippet?.difficulty ?? "",
      })),
    };
  },
});
