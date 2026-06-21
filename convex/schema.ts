import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

const gameProgress = v.record(
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
);

const gameMode = v.union(v.literal("classic"), v.literal("scroll"));

const scrollProgress = v.record(
  v.id("user"),
  v.object({
    currentIndex: v.number(),
    typedWords: v.number(),
    failed: v.boolean(),
    completed: v.boolean(),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    errors: v.number(),
  })
);

export default defineSchema({
  user: defineTable({
    email: v.string(),
    authId: v.string(),
    nickname: v.string(),
    nicknameSearch: v.optional(v.string()),
    // Legacy denormalized arrays kept optional for existing rows. New code uses
    // indexed gameHistory, friendships, and friendRequests tables instead.
    games: v.optional(v.array(v.id("game"))),
    friends: v.optional(v.array(v.id("user"))),
    friendRequests: v.optional(v.array(v.id("user"))),
    gold: v.optional(v.number()),
    highestPracticeWpm: v.optional(v.number()),
    avatar: v.optional(v.string()),
    avatarSeed: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    queuedAt: v.optional(v.number()),
    queuedMode: v.optional(gameMode),
    activeGame: v.optional(v.id("game")),
    status: v.optional(
      v.union(
        v.literal("online"),
        v.literal("in_queue"),
        v.literal("game_found"),
        v.literal("in_game")
      )
    ),
  })
    .index("by_auth_id", ["authId"])
    .index("by_nickname_search", ["nicknameSearch"])
    .index("by_status_queued_at", ["status", "queuedAt"]),

  friendRequests: defineTable({
    requesterId: v.id("user"),
    receiverId: v.id("user"),
    pairKey: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("canceled")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_receiver_status", ["receiverId", "status"])
    .index("by_receiver_status_created_at", [
      "receiverId",
      "status",
      "createdAt",
    ])
    .index("by_pair_status", ["pairKey", "status"])
    .index("by_requester_receiver_status", [
      "requesterId",
      "receiverId",
      "status",
    ]),

  friendships: defineTable({
    userAId: v.id("user"),
    userBId: v.id("user"),
    pairKey: v.string(),
    createdAt: v.number(),
  })
    .index("by_pair", ["pairKey"])
    .index("by_user_a", ["userAId"])
    .index("by_user_a_created_at", ["userAId", "createdAt"])
    .index("by_user_b", ["userBId"])
    .index("by_user_b_created_at", ["userBId", "createdAt"]),

  practice: defineTable({
    user: v.id("user"),
    wpm: v.number(),
    accuracy: v.number(),
    time: v.number(),
    errors: v.number(),
    date: v.number(),
  }),

  game: defineTable({
    mode: v.optional(gameMode),
    players: v.array(v.id("user")),
    phrase: v.string(),
    scrollText: v.optional(v.string()),
    words: v.array(v.string()),
    holds: v.array(
      v.object({
        word: v.string(),
        number: v.number(),
      })
    ),
    againstBot: v.optional(v.boolean()),
    botProfile: v.optional(
      v.object({
        userId: v.id("user"),
        nickname: v.string(),
        avatarSeed: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
      })
    ),
    lettersAndSymbols: v.array(v.string()),
    playersAccepted: v.array(v.id("user")),
    winner: v.optional(v.id("user")),
    language: v.union(v.literal("en"), v.literal("es")),
    progress: v.optional(gameProgress),
    scrollStartedAt: v.optional(v.number()),
    scrollProgress: v.optional(scrollProgress),
    botScrollPlan: v.optional(
      v.object({
        botId: v.id("user"),
        startedAt: v.number(),
        charsPerSecond: v.number(),
      })
    ),
  }),

  gameHistory: defineTable({
    mode: v.optional(gameMode),
    userId: v.id("user"),
    players: v.array(v.id("user")),
    againstBot: v.optional(v.boolean()),
    botProfile: v.optional(
      v.object({
        userId: v.id("user"),
        nickname: v.string(),
        avatarSeed: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
      })
    ),
    opponentSnapshot: v.optional(
      v.object({
        userId: v.id("user"),
        nickname: v.string(),
        avatarSeed: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
      })
    ),
    phrase: v.string(),
    scrollText: v.optional(v.string()),
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
    progress: v.optional(gameProgress),
    scrollStartedAt: v.optional(v.number()),
    scrollProgress: v.optional(scrollProgress),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_created_at", ["userId", "createdAt"]),
});
