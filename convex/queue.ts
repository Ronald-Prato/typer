import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import practiceScrollParagraphs from "../src/data/practiceScrollParagraphs.json";
import { getRandomizedPracticeScrollText } from "../src/domain/practiceScroll";
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
  hasQueuedHumanOpponent,
  normalizeGameMode,
  MAX_MATCHMAKING_BATCH_SIZE,
} from "./queueState";

const gameModeValidator = v.union(v.literal("classic"), v.literal("scroll"));
const SCROLL_BOT_CHARS_PER_SECOND = 5;
const SCROLL_PARAGRAPHS = practiceScrollParagraphs as string[];

function getRandomScrollText() {
  return (
    getRandomizedPracticeScrollText(SCROLL_PARAGRAPHS) ||
    "El modo Scroll necesita texto disponible para crear una partida."
  );
}

export const getInQueue = mutation({
  args: {
    mode: v.optional(gameModeValidator),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const mode = normalizeGameMode(args.mode);

    if (
      user.activeGame ||
      user.status === "game_found" ||
      user.status === "in_game"
    ) {
      throw new Error("No puedes entrar a la cola con una partida activa");
    }

    const updatedUser = await ctx.db.patch(user._id, {
      ...buildEnterQueuePatch(Date.now(), mode),
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
    mode: v.optional(gameModeValidator),
    phrase: v.string(),
    scrollText: v.optional(v.string()),
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
              queuedMode: user.queuedMode,
              activeGame: user.activeGame,
            }
          : null
      ) ||
      user?.queuedAt !== args.queuedAt
      || normalizeGameMode(user?.queuedMode) !== normalizeGameMode(args.mode)
    ) {
      return null;
    }

    const mode = normalizeGameMode(args.mode);
    const freshQueuedUsers = await ctx.db
      .query("user")
      .withIndex("by_status_queued_at", (q) => q.eq("status", "in_queue"))
      .order("asc")
      .take(MAX_MATCHMAKING_BATCH_SIZE);

    if (
      hasQueuedHumanOpponent(
        freshQueuedUsers.map((queuedUser) => ({
          _id: queuedUser._id,
          status: queuedUser.status,
          queuedAt: queuedUser.queuedAt,
          queuedMode: queuedUser.queuedMode,
          activeGame: queuedUser.activeGame,
        })),
        args.userId,
        mode
      )
    ) {
      console.log(
        `👥 Skipped ${mode} bot match for user ${args.userId}; compatible human is queued`
      );
      await ctx.scheduler.runAfter(0, internal.queue.matchQueuedUsers);
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
      mode,
      language: "es",
      phrase: args.phrase,
      scrollText: args.scrollText,
      words: args.words,
      holds: args.holdsWords,
      lettersAndSymbols: args.lettersAndSymbols,
      playersAccepted: [bot._id],
      againstBot: true,
      botProfile,
      ...(mode === "scroll"
        ? {
            botScrollPlan: {
              botId: bot._id,
              startedAt: Date.now(),
              charsPerSecond: SCROLL_BOT_CHARS_PER_SECOND,
            },
          }
        : {}),
    });

    // Solo actualizar el usuario real, el bot no existe en la base de datos
    await ctx.db.patch(args.userId, {
      status: "game_found",
      queuedAt: undefined,
      queuedMode: undefined,
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

    for (const mode of ["classic", "scroll"] as const) {
      const modeUsers = queuedUsers.filter(
        (user) => normalizeGameMode(user.queuedMode) === mode
      );

      if (modeUsers.length === 0) continue;

      // Si hay menos de 2 usuarios para este modo, crear partida con bot.
      if (modeUsers.length === 1) {
        const user = modeUsers[0];

        if (user.status === "in_game" || user.status === "game_found") {
          continue;
        }

        const { phrase, words, lettersAndSymbols, holdsWords } =
          getRandomGameSettings();

        if (
          !canCreateBotMatchForUser(
            {
              _id: user._id,
              status: user.status,
              queuedAt: user.queuedAt,
              queuedMode: user.queuedMode,
              activeGame: user.activeGame,
            },
            now
          )
        ) {
          continue;
        }

        const queuedAt = user.queuedAt;
        if (queuedAt === undefined) continue;

        await ctx.scheduler.runAfter(0, internal.queue.createMatchWithBot, {
          userId: user._id,
          queuedAt,
          mode,
          phrase,
          scrollText: mode === "scroll" ? getRandomScrollText() : undefined,
          words,
          lettersAndSymbols,
          holdsWords,
        });

        console.log(`🤖 Scheduled ${mode} bot match for single user ${user._id}`);
        continue;
      }

      if (modeUsers.length < 2) {
        console.log(`⏳ Not enough ${mode} users to match`);
        continue;
      }

      // Agrupar de 2 en 2 por modo.
      for (let i = 0; i < modeUsers.length - 1; i += 2) {
        const user1 = modeUsers[i];
        const user2 = modeUsers[i + 1];

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
                  queuedMode: freshUser1.queuedMode,
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
                  queuedMode: freshUser2.queuedMode,
                  activeGame: freshUser2.activeGame,
                }
              : null
          ) ||
          normalizeGameMode(freshUser1?.queuedMode) !== mode ||
          normalizeGameMode(freshUser2?.queuedMode) !== mode
        ) {
          continue;
        }

        const gameId = await ctx.db.insert("game", {
          players: [user1._id, user2._id],
          mode,
          language: "es",
          phrase,
          scrollText: mode === "scroll" ? getRandomScrollText() : undefined,
          words,
          holds: holdsWords,
          lettersAndSymbols,
          playersAccepted: [],
        });

        await Promise.all([
          ctx.db.patch(user1._id, {
            status: "game_found",
            queuedAt: undefined,
            queuedMode: undefined,
            activeGame: gameId,
          }),
          ctx.db.patch(user2._id, {
            status: "game_found",
            queuedAt: undefined,
            queuedMode: undefined,
            activeGame: gameId,
          }),
        ]);
      }

      // Si hay un usuario impar, crear partida con bot solo despues de una espera minima.
      if (modeUsers.length % 2 === 1) {
        const remainingUser = modeUsers[modeUsers.length - 1];

        if (
          remainingUser.status === "in_game" ||
          remainingUser.status === "game_found"
        ) {
          console.log(`👤 Remaining user ${remainingUser._id} already in game`);
          continue;
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
                  queuedMode: freshRemainingUser.queuedMode,
                  activeGame: freshRemainingUser.activeGame,
                }
              : null,
            now
          ) ||
          normalizeGameMode(freshRemainingUser?.queuedMode) !== mode
        ) {
          continue;
        }
        const remainingQueuedAt = freshRemainingUser?.queuedAt;
        if (remainingQueuedAt === undefined) continue;

        await ctx.scheduler.runAfter(0, internal.queue.createMatchWithBot, {
          userId: remainingUser._id,
          queuedAt: remainingQueuedAt,
          mode,
          phrase,
          scrollText: mode === "scroll" ? getRandomScrollText() : undefined,
          words,
          lettersAndSymbols,
          holdsWords,
        });

        console.log(
          `🤖 Scheduled ${mode} bot match for remaining user ${remainingUser._id}`
        );
      }
    }
  },
});
