import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  getCurrentUser,
  getRandomGameSettings,
  avatarUrlFromSeed,
  sanitizeAvatarSeed,
} from "./helpers/getCurrentUser";
import { botNicknames } from "../src/constants";
import {
  buildBotProfile,
  buildEnterQueuePatch,
  buildExitQueuePatch,
  canCreateBotMatchForUser,
  canCreateMatchForUser,
  MAX_MATCHMAKING_BATCH_SIZE,
} from "./queueState";

export const getInQueue = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (
      user.activeGame ||
      user.status === "game_found" ||
      user.status === "in_game"
    ) {
      throw new Error("No puedes entrar a la cola con una partida activa");
    }

    const updatedUser = await ctx.db.patch(user._id, {
      ...buildEnterQueuePatch(Date.now()),
    });

    return updatedUser;
  },
});

export const exitQueue = mutation({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    const updatedUser = await ctx.db.patch(user._id, {
      ...buildExitQueuePatch(),
    });

    return updatedUser;
  },
});

export const createMatchWithBot = internalMutation({
  args: {
    userId: v.id("user"),
    queuedAt: v.number(),
    phrase: v.string(),
    words: v.array(v.string()),
    lettersAndSymbols: v.array(v.string()),
    holdsWords: v.array(v.object({ word: v.string(), number: v.number() })),
  },
  handler: async (ctx, args) => {
    const [user, bot] = await Promise.all([
      ctx.db.get(args.userId),
      ctx.db
        .query("user")
        .withIndex("by_auth_id", (q) => q.eq("authId", "imabot"))
        .first(),
    ]);

    if (
      !canCreateMatchForUser(
        user
          ? {
              _id: user._id,
              status: user.status,
              queuedAt: user.queuedAt,
              activeGame: user.activeGame,
            }
          : null
      ) ||
      user?.queuedAt !== args.queuedAt
    ) {
      return null;
    }

    if (!bot) {
      throw new Error("Bot not found");
    }

    const randomNickname =
      botNicknames[Math.floor(Math.random() * botNicknames.length)];

    const avatarSeed = sanitizeAvatarSeed(
      Math.random().toString(36).substring(7),
      bot.authId
    );

    const botProfile = buildBotProfile({
      botUserId: bot._id,
      nickname: randomNickname,
      avatarSeed,
      avatarUrl: avatarUrlFromSeed(avatarSeed),
    });

    const gameId = await ctx.db.insert("game", {
      players: [args.userId, bot._id],
      language: "es",
      phrase: args.phrase,
      words: args.words,
      holds: args.holdsWords,
      lettersAndSymbols: args.lettersAndSymbols,
      playersAccepted: [bot._id],
      againstBot: true,
      botProfile,
    });

    // Solo actualizar el usuario real, el bot no existe en la base de datos
    await ctx.db.patch(args.userId, {
      status: "game_found",
      queuedAt: undefined,
      activeGame: gameId,
    });

    console.log(
      `🤖 Created bot match for user ${args.userId} with bot ${bot.authId}`
    );
    return gameId;
  },
});

export const matchQueuedUsers = internalMutation({
  handler: async (ctx) => {
    const queuedUsers = await ctx.db
      .query("user")
      .withIndex("by_status_queued_at", (q) => q.eq("status", "in_queue"))
      .order("asc")
      .take(MAX_MATCHMAKING_BATCH_SIZE);
    const now = Date.now();

    console.log(`🔍 Found ${queuedUsers.length} users in queue`);

    // Si hay menos de 2 usuarios, crear partidas con bots
    if (queuedUsers.length === 1) {
      const user = queuedUsers[0];

      if (user.status === "in_game" || user.status === "game_found") {
        return;
      }

      const { phrase, words, lettersAndSymbols, holdsWords } =
        getRandomGameSettings();

      if (
        !canCreateBotMatchForUser(
          {
            _id: user._id,
            status: user.status,
            queuedAt: user.queuedAt,
            activeGame: user.activeGame,
          },
          now
        )
      ) {
        return;
      }

      const queuedAt = user.queuedAt;
      if (queuedAt === undefined) return;

      await ctx.scheduler.runAfter(0, internal.queue.createMatchWithBot, {
        userId: user._id,
        queuedAt,
        phrase,
        words,
        lettersAndSymbols,
        holdsWords,
      });

      console.log(`🤖 Scheduled bot match for single user ${user._id}`);
      return;
    }

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

      const [freshUser1, freshUser2] = await Promise.all([
        ctx.db.get(user1._id),
        ctx.db.get(user2._id),
      ]);

      if (
        !canCreateMatchForUser(
          freshUser1
            ? {
                _id: freshUser1._id,
                status: freshUser1.status,
                queuedAt: freshUser1.queuedAt,
                activeGame: freshUser1.activeGame,
              }
            : null
        ) ||
        !canCreateMatchForUser(
          freshUser2
            ? {
                _id: freshUser2._id,
                status: freshUser2.status,
                queuedAt: freshUser2.queuedAt,
                activeGame: freshUser2.activeGame,
              }
            : null
        )
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
          queuedAt: undefined,
          activeGame: gameId,
        }),
        ctx.db.patch(user2._id, {
          status: "game_found",
          queuedAt: undefined,
          activeGame: gameId,
        }),
      ]);
    }

    // Si hay un usuario impar, crear partida con bot solo despues de una espera minima
    if (queuedUsers.length % 2 === 1) {
      const remainingUser = queuedUsers[queuedUsers.length - 1];

      if (
        remainingUser.status === "in_game" ||
        remainingUser.status === "game_found"
      ) {
        console.log(`👤 Remaining user ${remainingUser._id} already in game`);
        return;
      }

      const { phrase, words, lettersAndSymbols, holdsWords } =
        getRandomGameSettings();

      const freshRemainingUser = await ctx.db.get(remainingUser._id);

      if (
        !canCreateBotMatchForUser(
          freshRemainingUser
            ? {
                _id: freshRemainingUser._id,
                status: freshRemainingUser.status,
                queuedAt: freshRemainingUser.queuedAt,
                activeGame: freshRemainingUser.activeGame,
              }
            : null,
          now
        )
      ) {
        return;
      }
      const remainingQueuedAt = freshRemainingUser?.queuedAt;
      if (remainingQueuedAt === undefined) return;

      await ctx.scheduler.runAfter(0, internal.queue.createMatchWithBot, {
        userId: remainingUser._id,
        queuedAt: remainingQueuedAt,
        phrase,
        words,
        lettersAndSymbols,
        holdsWords,
      });

      console.log(
        `🤖 Scheduled bot match for remaining user ${remainingUser._id}`
      );
    }
  },
});
