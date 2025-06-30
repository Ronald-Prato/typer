import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  user: defineTable({
    email: v.string(),
    authId: v.string(),
    nickname: v.string(),
    games: v.array(v.id("game")),
  }).index("by_auth_id", ["authId"]),

  game: defineTable({
    phrase: v.string(),
    winner: v.optional(v.id("user")),
    language: v.union(v.literal("en"), v.literal("es")),
  }),
});
