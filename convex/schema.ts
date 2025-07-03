import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  user: defineTable({
    email: v.string(),
    authId: v.string(),
    nickname: v.string(),
    games: v.array(v.id("game")),
    avatar: v.optional(v.string()),
    queueId: v.optional(v.string()),
    queuedAt: v.optional(v.number()),
    activeGame: v.optional(v.id("game")),
    status: v.optional(
      v.union(v.literal("online"), v.literal("in_queue"), v.literal("in_game"))
    ),
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
    players: v.array(v.id("user")),
    phrase: v.string(),
    words: v.array(v.string()),
    holds: v.array(
      v.object({
        word: v.string(),
        number: v.number(),
      })
    ),
    lettersAndSymbols: v.array(
      v.object({
        letter: v.string(),
        position: v.number(),
      })
    ),
    winner: v.optional(v.id("user")),
    language: v.union(v.literal("en"), v.literal("es")),
  }),
});
