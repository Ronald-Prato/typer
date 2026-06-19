import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  getCurrentUser,
  getCurrentUserOrNull,
} from "./helpers/getCurrentUser";
import type { Doc, Id } from "./_generated/dataModel";
import {
  applyGameStep,
  canAcceptGame,
  getNextBotStep,
  type GameMetrics,
  type GameProgress,
  type GameStep,
} from "./gameStateMachine";
import {
  getFinishedGameHistoryUserIds,
  getWinnerGoldPatch,
  shouldRewardWinner,
} from "./gameLifecycle";

const gameStepValidator = v.union(
  v.literal("phrase"),
  v.literal("words"),
  v.literal("holds"),
  v.literal("lettersAndSymbols")
);

const gameMetricsValidator = v.object({
  errors: v.number(),
  timeMs: v.number(),
  accuracy: v.optional(v.number()),
  wpm: v.optional(v.number()),
});

const botStepDelays: Record<GameStep, number> = {
  phrase: 10000,
  words: 12000,
  lettersAndSymbols: 8000,
  holds: 18000,
};

function createBotMetrics(): GameMetrics {
  const errors = Math.floor(Math.random() * 3);

  return {
    timeMs: Math.floor(Math.random() * 5000) + 3000,
    errors,
    accuracy: Math.max(85, 100 - errors * 5),
    wpm: Math.floor(Math.random() * 20) + 30,
  };
}

async function saveFinishedGameHistory(
  ctx: { db: any },
  game: Doc<"game">,
  winner: Id<"user">,
  progress: GameProgress,
  userIds: Id<"user">[]
) {
  const createdAt = Date.now();

  await Promise.all(
    userIds.map((userId) =>
      ctx.db.insert("gameHistory", {
        userId,
        players: game.players,
        phrase: game.phrase,
        words: game.words,
        holds: game.holds,
        lettersAndSymbols: game.lettersAndSymbols,
        playersAccepted: game.playersAccepted,
        winner,
        language: game.language,
        progress,
        againstBot: game.againstBot,
        botProfile: game.botProfile,
        createdAt,
      })
    )
  );
}

async function scheduleNextBotStep(
  ctx: { scheduler: any },
  gameId: Id<"game">,
  botId: Id<"user">,
  progress: GameProgress | undefined
) {
  const nextStep = getNextBotStep(progress?.[botId]);
  if (!nextStep) return;

  await ctx.scheduler.runAfter(
    botStepDelays[nextStep],
    internal.game.setStepDoneBot,
    {
      gameId,
      botId,
    }
  );
}

function getHumanGamePlayerIds(game: Doc<"game">) {
  const botUserId = game.botProfile?.userId;
  if (!game.againstBot || !botUserId) return game.players;

  return game.players.filter((playerId) => playerId !== botUserId);
}

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

    if (ownUser.status !== "game_found" && ownUser.status !== "in_game") {
      throw new Error("No puedes aceptar esta partida");
    }

    if (
      !againstBot &&
      (theOtherPlayer?.status !== "game_found" ||
        theOtherPlayer.activeGame !== ownUser.activeGame)
    ) {
      throw new Error("Oponente no está en la partida");
    }

    const wasAlreadyAccepted = game.playersAccepted.includes(ownUser._id);
    const acceptedState = canAcceptGame({
      players: game.players,
      playersAccepted: game.playersAccepted,
      playerId: ownUser._id,
    });

    if (acceptedState.allAccepted) {
      const playerIdsToStart = againstBot ? [ownUser._id] : game.players;

      await Promise.all(
        playerIdsToStart.map((playerId) =>
          ctx.db.patch(playerId, {
            status: "in_game",
          })
        )
      );
    }

    const result = await ctx.db.patch(game._id, {
      playersAccepted: acceptedState.playersAccepted,
    });

    if (againstBot && acceptedState.allAccepted && !wasAlreadyAccepted) {
      await scheduleNextBotStep(
        ctx,
        game._id,
        theOtherPlayerId,
        game.progress as GameProgress | undefined
      );
    }

    return result;
  },
});

export const rejectGame = mutation({
  handler: async (ctx) => {
    const ownUser = await getCurrentUser(ctx);

    if (!ownUser) {
      throw new Error("Usuario no encontrado");
    }

    if (!ownUser.activeGame) {
      return null;
    }

    const game = await ctx.db.get(ownUser.activeGame);
    const playerIdsToClear = game ? getHumanGamePlayerIds(game) : [ownUser._id];

    await Promise.all(
      playerIdsToClear.map((playerId) =>
        ctx.db.patch(playerId, {
          activeGame: undefined,
          status: "online",
        })
      )
    );

    return null;
  },
});

export const getGameData = query({
  handler: async (ctx) => {
    const ownUser = await getCurrentUserOrNull(ctx);

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

    const opponentDoc = theOtherPlayerId ? await ctx.db.get(theOtherPlayerId) : null;
    const opponent =
      opponentDoc && game.againstBot && game.botProfile?.userId === opponentDoc._id
        ? {
            ...opponentDoc,
            nickname: game.botProfile.nickname,
            avatarSeed: game.botProfile.avatarSeed,
            avatarUrl: game.botProfile.avatarUrl,
          }
        : opponentDoc;

    return {
      game,
      opponent,
    };
  },
});

export const setStepDone = mutation({
  args: {
    step: gameStepValidator,
    metrics: v.optional(gameMetricsValidator),
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

    const nextState = applyGameStep({
      game: {
        players: game.players,
        playersAccepted: game.playersAccepted,
        progress: game.progress as GameProgress | undefined,
        winner: game.winner,
      },
      playerId: ownUser._id,
      userStatus: ownUser.status,
      step: args.step,
      metrics: args.metrics,
    });

    if (nextState.winner && theOtherPlayerId) {
      const historyUserIds = getFinishedGameHistoryUserIds({
        players: game.players,
        againstBot: game.againstBot,
        botPlayerId: game.againstBot ? theOtherPlayerId : undefined,
      });

      await saveFinishedGameHistory(
        ctx,
        game,
        ownUser._id,
        nextState.progress,
        historyUserIds
      );

      if (
        shouldRewardWinner({
          winnerId: ownUser._id,
          humanPlayerId: ownUser._id,
          againstBot: game.againstBot,
        })
      ) {
        await ctx.db.patch(ownUser._id, getWinnerGoldPatch(ownUser.gold));
      }

      return await ctx.db.patch(game._id, {
        progress: nextState.progress,
        winner: ownUser._id,
      });
    }

    return await ctx.db.patch(game._id, {
      progress: nextState.progress,
    });
  },
});

export const setStepDoneBot = internalMutation({
  args: {
    gameId: v.id("game"),
    botId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    if (!game.againstBot || !game.players.includes(args.botId)) {
      throw new Error("Bot no pertenece a esta partida");
    }

    if (game.winner) {
      return null;
    }

    const nextStep = getNextBotStep(game.progress?.[args.botId]);
    if (!nextStep) {
      return null;
    }

    const nextState = applyGameStep({
      game: {
        players: game.players,
        playersAccepted: game.playersAccepted,
        progress: game.progress as GameProgress | undefined,
        winner: game.winner,
      },
      playerId: args.botId,
      userStatus: "in_game",
      step: nextStep,
      metrics: createBotMetrics(),
    });

    if (nextState.winner) {
      const historyUserIds = getFinishedGameHistoryUserIds({
        players: game.players,
        againstBot: game.againstBot,
        botPlayerId: args.botId,
      });

      await saveFinishedGameHistory(
        ctx,
        game,
        args.botId,
        nextState.progress,
        historyUserIds
      );

      return await ctx.db.patch(game._id, {
        progress: nextState.progress,
        winner: args.botId,
      });
    }

    const result = await ctx.db.patch(game._id, {
      progress: nextState.progress,
    });

    await scheduleNextBotStep(ctx, game._id, args.botId, nextState.progress);

    return result;
  },
});

export const finishGame = mutation({
  handler: async (ctx) => {
    const ownUser = await getCurrentUser(ctx);

    if (!ownUser.activeGame) {
      return null;
    }

    const game = await ctx.db.get(ownUser.activeGame);
    const playerIdsToClear = game ? getHumanGamePlayerIds(game) : [ownUser._id];

    await Promise.all(
      playerIdsToClear.map((playerId) =>
        ctx.db.patch(playerId, {
          status: "online",
          activeGame: undefined,
        })
      )
    );

    return null;
  },
});
