import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  user: defineTable({
    authId: v.string(),
    username: v.string(),
    nickname: v.string(),
    email: v.string(),
  })
    .index("by_auth_id", ["authId"])
    .index("by_username", ["username"]),

  snippet: defineTable({
    code: v.string(),
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
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
  })
    .index("by_difficulty", ["difficulty"])
    .index("by_language", ["language"]),

  game: defineTable({
    name: v.string(),
    snippets: v.array(v.id("snippet")),
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
  }),
});
