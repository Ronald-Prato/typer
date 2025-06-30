import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  user: defineTable({
    authId: v.string(),
    username: v.string(),
    nickname: v.string(),
    email: v.string(),
  }).index("by_auth_id", ["authId"]),

  game: defineTable({
    phrase: v.string(),
    winner: v.optional(v.id("user")),
    language: v.union(v.literal("en"), v.literal("es")),
  }),
});
