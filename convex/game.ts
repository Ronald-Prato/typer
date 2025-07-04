import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./helpers/getCurrentUser";

export const acceptGame = mutation({
  handler: async (ctx) => {
    const ownUser = await getCurrentUser(ctx);

    if (!ownUser?.activeGame) {
      throw new Error("No tienes un juego activo");
    }

    const game = await ctx.db.get(ownUser.activeGame);

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    const theOtherPlayerId = game.players.find(
      (player) => player !== ownUser._id
    );

    if (!theOtherPlayerId) {
      throw new Error("Oponente no encontrado");
    }

    const theOtherPlayer = await ctx.db.get(theOtherPlayerId);
    const againstBot = game.againstBot;

    if (
      !againstBot &&
      (theOtherPlayer?.status !== "game_found" ||
        theOtherPlayer.activeGame !== ownUser.activeGame)
    ) {
      throw new Error("Oponente no está en la partida");
    }

    const newPlayersAccepted = [...game.playersAccepted, ownUser._id];

    if (newPlayersAccepted.length >= 2) {
      !againstBot
        ? await Promise.all([
            ctx.db.patch(ownUser._id, {
              status: "in_game",
            }),
            ctx.db.patch(theOtherPlayerId, {
              status: "in_game",
            }),
          ])
        : await Promise.all([
            ctx.db.patch(ownUser._id, {
              status: "in_game",
            }),
          ]);
    }

    return await ctx.db.patch(game._id, {
      playersAccepted: newPlayersAccepted,
    });
  },
});

export const rejectGame = mutation({
  handler: async (ctx) => {
    const ownUser = await getCurrentUser(ctx);

    if (!ownUser) {
      throw new Error("Usuario no encontrado");
    }

    await ctx.db.patch(ownUser._id, {
      activeGame: undefined,
      status: "online",
    });
  },
});

export const getGameData = query({
  handler: async (ctx) => {
    const ownUser = await getCurrentUser(ctx);

    if (!ownUser?.activeGame) {
      return {
        game: null,
        opponent: null,
      };
    }

    const game = await ctx.db.get(ownUser.activeGame);

    if (!game) {
      return {
        game: null,
        opponent: null,
      };
    }

    const theOtherPlayerId = game.players.find(
      (player) => player !== ownUser._id
    );

    const opponent = theOtherPlayerId
      ? await ctx.db.get(theOtherPlayerId)
      : null;

    return {
      game,
      opponent,
    };
  },
});

export const setStepDone = mutation({
  args: {
    step: v.union(
      v.literal("phrase"),
      v.literal("words"),
      v.literal("holds"),
      v.literal("lettersAndSymbols")
    ),
    metrics: v.optional(
      v.object({
        errors: v.number(),
        timeMs: v.number(),
        accuracy: v.optional(v.number()),
        wpm: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ownUser = await getCurrentUser(ctx);

    if (!ownUser?.activeGame) {
      throw new Error("No tienes un juego activo");
    }

    const game = await ctx.db.get(ownUser.activeGame);

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    const theOtherPlayerId = game.players.find(
      (player) => player !== ownUser._id
    );

    // Map step names to schema field names
    const stepFieldMap: Record<string, string> = {
      phrase: "phraseDone",
      words: "wordsDone",
      lettersAndSymbols: "lettersAndSymbolsDone",
      holds: "holdsDone",
    };

    const metricsFieldMap: Record<string, string> = {
      phrase: "phraseMetrics",
      words: "wordsMetrics",
      lettersAndSymbols: "lettersAndSymbolsMetrics",
      holds: "holdsMetrics",
    };

    const fieldName = stepFieldMap[args.step];
    const metricsFieldName = metricsFieldMap[args.step];

    const newProgress = {
      ...game.progress,
      [ownUser._id]: {
        ...game.progress?.[ownUser._id],
        [fieldName]: true,
        ...(args.metrics && { [metricsFieldName]: args.metrics }),
      },
    };

    // Winner 🎉
    if (args.step === "holds" && !game.winner && theOtherPlayerId) {
      // Save game history for both players
      await Promise.all([
        ctx.db.insert("gameHistory", {
          userId: ownUser._id,
          players: game.players,
          phrase: game.phrase,
          words: game.words,
          holds: game.holds,
          lettersAndSymbols: game.lettersAndSymbols,
          playersAccepted: game.playersAccepted,
          winner: ownUser._id,
          language: game.language,
          progress: newProgress,
          createdAt: Date.now(),
        }),
        ctx.db.insert("gameHistory", {
          userId: theOtherPlayerId,
          players: game.players,
          phrase: game.phrase,
          words: game.words,
          holds: game.holds,
          lettersAndSymbols: game.lettersAndSymbols,
          playersAccepted: game.playersAccepted,
          winner: ownUser._id,
          language: game.language,
          progress: newProgress,
          createdAt: Date.now(),
        }),
      ]);

      return await ctx.db.patch(game._id, {
        progress: newProgress,
        winner: ownUser._id,
      });
    }

    return await ctx.db.patch(game._id, {
      progress: newProgress,
    });
  },
});

export const setStepDoneBot = mutation({
  args: {
    step: v.union(
      v.literal("phrase"),
      v.literal("words"),
      v.literal("lettersAndSymbols"),
      v.literal("holds")
    ),
    metrics: v.optional(
      v.object({
        errors: v.number(),
        timeMs: v.number(),
        accuracy: v.optional(v.number()),
        wpm: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ownUser = await getCurrentUser(ctx);

    if (!ownUser?.activeGame) {
      return null;
    }

    const bot = await ctx.db
      .query("user")
      .filter((q) => q.eq(q.field("authId"), "imabot"))
      .first();

    if (!bot) {
      throw new Error("Bot not found");
    }

    const game = await ctx.db.get(ownUser.activeGame);

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    const stepFieldMap: Record<string, string> = {
      phrase: "phraseDone",
      words: "wordsDone",
      lettersAndSymbols: "lettersAndSymbolsDone",
      holds: "holdsDone",
    };

    const metricsFieldMap: Record<string, string> = {
      phrase: "phraseMetrics",
      words: "wordsMetrics",
      lettersAndSymbols: "lettersAndSymbolsMetrics",
      holds: "holdsMetrics",
    };

    const newProgress = {
      ...game.progress,
      [bot._id]: {
        ...game.progress?.[bot._id],
        [stepFieldMap[args.step]]: true,
        ...(args.metrics && { [metricsFieldMap[args.step]]: args.metrics }),
      },
    };

    // Winner 🎉
    if (args.step === "holds" && !game.winner && bot._id) {
      // Save game history for both players
      await Promise.all([
        ctx.db.insert("gameHistory", {
          userId: ownUser._id,
          players: game.players,
          phrase: game.phrase,
          words: game.words,
          holds: game.holds,
          lettersAndSymbols: game.lettersAndSymbols,
          playersAccepted: game.playersAccepted,
          winner: bot._id,
          language: game.language,
          progress: newProgress,
          createdAt: Date.now(),
        }),
      ]);

      return await ctx.db.patch(game._id, {
        progress: newProgress,
        winner: bot._id,
      });
    }

    if (game.winner) {
      return;
    }

    return await ctx.db.patch(game._id, {
      progress: newProgress,
    });
  },
});

export const finishGame = mutation({
  handler: async (ctx) => {
    const ownUser = await getCurrentUser(ctx);

    return await ctx.db.patch(ownUser._id, {
      status: "online",
      activeGame: undefined,
    });
  },
});
