import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  getCurrentUser,
  getRandomGameSettings,
} from "./helpers/getCurrentUser";
import { v4 as uuidv4 } from "uuid";
import { botNicknames } from "../src/constants";

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

export const createMatchWithBot = internalMutation({
  args: {
    userId: v.id("user"),
    phrase: v.string(),
    words: v.array(v.string()),
    lettersAndSymbols: v.array(v.string()),
    holdsWords: v.array(v.object({ word: v.string(), number: v.number() })),
  },
  handler: async (ctx, args) => {
    const bot = await ctx.db
      .query("user")
      .filter((q) => q.eq(q.field("authId"), "imabot"))
      .first();

    if (!bot) {
      throw new Error("Bot not found");
    }

    const randomNickname =
      botNicknames[Math.floor(Math.random() * botNicknames.length)];

    const randomSeed = Math.random().toString(36).substring(7);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;

    await ctx.db.patch(bot._id, {
      avatar: avatarUrl,
      nickname: randomNickname,
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
    });

    // Solo actualizar el usuario real, el bot no existe en la base de datos
    await ctx.db.patch(args.userId, {
      status: "game_found",
      queueId: undefined,
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

    // Ordenar por fecha de cola
    const queuedUsers = filteredUsers.sort(
      (a, b) => (a.queuedAt || 0) - (b.queuedAt || 0)
    );

    console.log(`🔍 Found ${queuedUsers.length} users in queue`);

    // Si hay menos de 2 usuarios, crear partidas con bots
    if (queuedUsers.length === 1) {
      const user = queuedUsers[0];

      if (user.status === "in_game" || user.status === "game_found") {
        return;
      }

      const { phrase, words, lettersAndSymbols, holdsWords } =
        getRandomGameSettings();

      await ctx.scheduler.runAfter(0, internal.queue.createMatchWithBot, {
        userId: user._id,
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

    // Si hay un usuario impar, crear partida con bot
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

      await ctx.scheduler.runAfter(0, internal.queue.createMatchWithBot, {
        userId: remainingUser._id,
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
