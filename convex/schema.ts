import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  user: defineTable({
    email: v.string(),
    authId: v.string(),
    nickname: v.string(),
    avatar: v.optional(v.string()),
    games: v.array(v.id("game")),
  }).index("by_auth_id", ["authId"]),

  practice: defineTable({
    user: v.id("user"),
    wpm: v.number(),
    accuracy: v.number(),
    time: v.number(),
    errors: v.number(),
    date: v.number(),
  }),

  game: defineTable({
    phrase: v.string(),
    winner: v.optional(v.id("user")),
    language: v.union(v.literal("en"), v.literal("es")),
  }),

  phrase: defineTable({
    text: v.string(),
    language: v.union(v.literal("en"), v.literal("es")),
  }),
});
