import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  user: defineTable({
    email: v.string(),
    authId: v.string(),
    nickname: v.string(),
    games: v.array(v.id("game")),
    friends: v.optional(v.array(v.id("user"))),
    friendRequests: v.optional(v.array(v.id("user"))),
    avatar: v.optional(v.string()),
    queueId: v.optional(v.string()),
    queuedAt: v.optional(v.number()),
    activeGame: v.optional(v.id("game")),
    status: v.optional(
      v.union(
        v.literal("online"),
        v.literal("in_queue"),
        v.literal("game_found"),
        v.literal("in_game")
      )
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
    againstBot: v.optional(v.boolean()),
    lettersAndSymbols: v.array(v.string()),
    playersAccepted: v.array(v.id("user")),
    winner: v.optional(v.id("user")),
    language: v.union(v.literal("en"), v.literal("es")),
    progress: v.optional(
      v.record(
        v.id("user"),
        v.object({
          phraseDone: v.optional(v.boolean()),
          wordsDone: v.optional(v.boolean()),
          lettersAndSymbolsDone: v.optional(v.boolean()),
          holdsDone: v.optional(v.boolean()),
          phraseMetrics: v.optional(
            v.object({
              errors: v.number(),
              timeMs: v.number(),
              accuracy: v.optional(v.number()),
              wpm: v.optional(v.number()),
            })
          ),
          wordsMetrics: v.optional(
            v.object({
              errors: v.number(),
              timeMs: v.number(),
              accuracy: v.optional(v.number()),
              wpm: v.optional(v.number()),
            })
          ),
          lettersAndSymbolsMetrics: v.optional(
            v.object({
              errors: v.number(),
              timeMs: v.number(),
              accuracy: v.optional(v.number()),
              wpm: v.optional(v.number()),
            })
          ),
          holdsMetrics: v.optional(
            v.object({
              errors: v.number(),
              timeMs: v.number(),
              accuracy: v.optional(v.number()),
              wpm: v.optional(v.number()),
            })
          ),
        })
      )
    ),
  }),

  gameHistory: defineTable({
    userId: v.id("user"),
    players: v.array(v.id("user")),
    againstBot: v.optional(v.boolean()),
    phrase: v.string(),
    words: v.array(v.string()),
    holds: v.array(
      v.object({
        word: v.string(),
        number: v.number(),
      })
    ),
    lettersAndSymbols: v.array(v.string()),
    playersAccepted: v.array(v.id("user")),
    winner: v.optional(v.id("user")),
    language: v.union(v.literal("en"), v.literal("es")),
    progress: v.optional(
      v.record(
        v.id("user"),
        v.object({
          phraseDone: v.optional(v.boolean()),
          wordsDone: v.optional(v.boolean()),
          lettersAndSymbolsDone: v.optional(v.boolean()),
          holdsDone: v.optional(v.boolean()),
          phraseMetrics: v.optional(
            v.object({
              errors: v.number(),
              timeMs: v.number(),
              accuracy: v.optional(v.number()),
              wpm: v.optional(v.number()),
            })
          ),
          wordsMetrics: v.optional(
            v.object({
              errors: v.number(),
              timeMs: v.number(),
              accuracy: v.optional(v.number()),
              wpm: v.optional(v.number()),
            })
          ),
          lettersAndSymbolsMetrics: v.optional(
            v.object({
              errors: v.number(),
              timeMs: v.number(),
              accuracy: v.optional(v.number()),
              wpm: v.optional(v.number()),
            })
          ),
          holdsMetrics: v.optional(
            v.object({
              errors: v.number(),
              timeMs: v.number(),
              accuracy: v.optional(v.number()),
              wpm: v.optional(v.number()),
            })
          ),
        })
      )
    ),
    createdAt: v.number(),
  }).index("by_user_id", ["userId"]),
});
