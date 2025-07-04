import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import {
  getCurrentUser,
  getRandomGameSettings,
} from "./helpers/getCurrentUser";

export const getInQueue = mutation({
  args: {
    queueId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const updatedUser = await ctx.db.patch(user._id, {
      queueId: args.queueId,
      queuedAt: Date.now(),
      status: "in_queue",
      activeGame: undefined,
    });

    return updatedUser;
  },
});

export const exitQueue = mutation({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    const updatedUser = await ctx.db.patch(user._id, {
      queueId: undefined,
      queuedAt: undefined,
      status: "online",
      activeGame: undefined,
    });

    return updatedUser;
  },
});

export const matchQueuedUsers = internalMutation({
  handler: async (ctx) => {
    // Buscar todos los usuarios con queueId seteado
    const filteredUsers = await ctx.db
      .query("user")
      .filter((q) =>
        q.and(
          q.neq(q.field("queueId"), undefined),
          q.eq(q.field("status"), "in_queue")
        )
      )
      .collect();

    const queuedUsers = filteredUsers.sort(
      (a, b) => (a.queuedAt || 0) - (b.queuedAt || 0)
    );

    console.log(`🔍 Found ${queuedUsers.length} users in queue`);

    if (queuedUsers.length < 2) {
      console.log("⏳ Not enough users to match (need at least 2)");
      return;
    }

    // Agrupar de 2 en 2
    for (let i = 0; i < queuedUsers.length - 1; i += 2) {
      const user1 = queuedUsers[i];
      const user2 = queuedUsers[i + 1];

      const { phrase, words, lettersAndSymbols, holdsWords } =
        getRandomGameSettings();

      if (
        user1.status === "in_game" ||
        user2.status === "in_game" ||
        user1.status === "game_found" ||
        user2.status === "game_found"
      ) {
        continue;
      }

      const gameId = await ctx.db.insert("game", {
        players: [user1._id, user2._id],
        language: "es",
        phrase: phrase,
        words: words,
        holds: holdsWords,
        lettersAndSymbols: lettersAndSymbols,
        playersAccepted: [],
      });

      await Promise.all([
        ctx.db.patch(user1._id, {
          status: "game_found",
          queueId: undefined,
          queuedAt: undefined,
          activeGame: gameId,
        }),
        ctx.db.patch(user2._id, {
          status: "game_found",
          queueId: undefined,
          queuedAt: undefined,
          activeGame: gameId,
        }),
      ]);
    }

    // Si hay un usuario impar, mostrarlo
    if (queuedUsers.length % 2 === 1) {
      const remainingUser = queuedUsers[queuedUsers.length - 1];
      console.log(`👤 Remaining user waiting: ${remainingUser.queueId}`);
    }
  },
});
