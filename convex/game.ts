import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  getBotScrollIndex,
  hasCompetitiveScrollBotMissedLine,
  COMPETITIVE_SCROLL_COUNTDOWN_MS,
  COMPETITIVE_SCROLL_VERSUS_INTRO_MS,
  getCompetitiveScrollWinner,
  getPracticeScrollWordLines,
  normalizeCompetitiveScrollProgress,
  type CompetitiveScrollProgress,
} from "../src/domain/practiceScroll";
import {
  getCurrentUser,
  getCurrentUserOrNull,
} from "./helpers/getCurrentUser";
import type { Doc, Id } from "./_generated/dataModel";
import {
  applyGameStep,
  canAcceptGame,
  getBotStepScheduleDelayMs,
  getNextBotStep,
  hasMatchAcceptWindowExpired,
  type GameMetrics,
  type GameProgress,
} from "./gameStateMachine";
import {
  getClassicMatchHighestWpmPatch,
  getFinishedGameHistoryUserIds,
  getForfeitWinnerId,
  getHistoryOpponentSnapshot,
  getRewardedWinnerId,
  getWinnerTypocoinPatch,
  toPlayerSnapshot,
  type PlayerSnapshot,
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

const SCROLL_BOT_TICK_MS = 1_000;
const COMPETITIVE_SCROLL_START_DELAY_MS =
  COMPETITIVE_SCROLL_VERSUS_INTRO_MS + COMPETITIVE_SCROLL_COUNTDOWN_MS;
const CLASSIC_MATCH_START_DELAY_MS = COMPETITIVE_SCROLL_START_DELAY_MS;

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
  const playerDocs = await Promise.all(
    game.players.map((playerId) => ctx.db.get(playerId))
  );
  const playerSnapshotsById = Object.fromEntries(
    playerDocs
      .filter((player): player is Doc<"user"> => Boolean(player))
      .map((player) => [player._id, toPlayerSnapshot(player)])
  ) as Partial<Record<Id<"user">, PlayerSnapshot<Id<"user">>>>;

  await Promise.all(
    userIds.map((userId) => {
      const opponentSnapshot = getHistoryOpponentSnapshot({
        historyUserId: userId,
        players: game.players,
        playerSnapshotsById,
        againstBot: game.againstBot,
        botProfile: game.botProfile,
      });

      return ctx.db.insert("gameHistory", {
        userId,
        mode: game.mode,
        players: game.players,
        phrase: game.phrase,
        scrollText: game.scrollText,
        words: game.words,
        holds: game.holds,
        lettersAndSymbols: game.lettersAndSymbols,
        playersAccepted: game.playersAccepted,
        winner,
        language: game.language,
        progress,
        scrollProgress: game.scrollProgress,
        againstBot: game.againstBot,
        botProfile: game.botProfile,
        opponentSnapshot,
        createdAt,
      });
    })
  );
}

async function saveFinishedScrollGameHistory(
  ctx: { db: any },
  game: Doc<"game">,
  winner: Id<"user">,
  scrollProgress: Record<string, CompetitiveScrollProgress>,
  userIds: Id<"user">[]
) {
  const createdAt = Date.now();
  const playerDocs = await Promise.all(
    game.players.map((playerId) => ctx.db.get(playerId))
  );
  const playerSnapshotsById = Object.fromEntries(
    playerDocs
      .filter((player): player is Doc<"user"> => Boolean(player))
      .map((player) => [player._id, toPlayerSnapshot(player)])
  ) as Partial<Record<Id<"user">, PlayerSnapshot<Id<"user">>>>;

  await Promise.all(
    userIds.map((userId) => {
      const opponentSnapshot = getHistoryOpponentSnapshot({
        historyUserId: userId,
        players: game.players,
        playerSnapshotsById,
        againstBot: game.againstBot,
        botProfile: game.botProfile,
      });

      return ctx.db.insert("gameHistory", {
        userId,
        mode: "scroll",
        players: game.players,
        phrase: game.phrase,
        scrollText: game.scrollText,
        words: game.words,
        holds: game.holds,
        lettersAndSymbols: game.lettersAndSymbols,
        playersAccepted: game.playersAccepted,
        winner,
        language: game.language,
        progress: game.progress,
        scrollStartedAt: game.scrollStartedAt,
        scrollProgress,
        againstBot: game.againstBot,
        botProfile: game.botProfile,
        opponentSnapshot,
        createdAt,
      });
    })
  );
}

async function scheduleNextBotStep(
  ctx: { scheduler: any },
  gameId: Id<"game">,
  botId: Id<"user">,
  progress: GameProgress | undefined,
  initialDelayMs = 0
) {
  const nextStep = getNextBotStep(progress?.[botId]);
  if (!nextStep) return;

  await ctx.scheduler.runAfter(
    getBotStepScheduleDelayMs({ step: nextStep, initialDelayMs }),
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

async function clearPendingGamePlayers(ctx: { db: any }, game: Doc<"game">) {
  const playerIdsToClear = getHumanGamePlayerIds(game);
  const players = await Promise.all(
    playerIdsToClear.map((playerId) => ctx.db.get(playerId))
  );

  await Promise.all(
    players
      .filter(
        (player): player is Doc<"user"> =>
          Boolean(player) &&
          player.activeGame === game._id &&
          player.status === "game_found"
      )
      .map((player) =>
        ctx.db.patch(player._id, {
          activeGame: undefined,
          status: "online",
        })
      )
  );
}

async function updateFinishedClassicMatchHighestWpms(
  ctx: { db: any },
  progress: GameProgress,
  userIds: Id<"user">[]
) {
  const users = await Promise.all(userIds.map((userId) => ctx.db.get(userId)));

  await Promise.all(
    users.map((user) => {
      if (!user) return null;

      const patch = getClassicMatchHighestWpmPatch({
        currentHighestWpm: user.highestPracticeWpm,
        progress: progress[user._id],
      });

      if (!patch) return null;

      return ctx.db.patch(user._id, patch);
    })
  );
}

async function rewardFinishedGameWinner(
  ctx: { db: any },
  game: Doc<"game">,
  winnerId: Id<"user">
) {
  const rewardUserId = getRewardedWinnerId({
    players: game.players,
    winnerId,
    againstBot: game.againstBot,
    botPlayerId: game.againstBot
      ? (game.botProfile?.userId as Id<"user"> | undefined)
      : undefined,
  });

  if (!rewardUserId) return;

  const rewardUser = await ctx.db.get(rewardUserId);
  if (!rewardUser) return;

  await ctx.db.patch(rewardUserId, getWinnerTypocoinPatch(rewardUser.gold));
}

async function finishGameByForfeit(
  ctx: { db: any },
  game: Doc<"game">,
  forfeitingPlayerId: Id<"user">,
  winnerId: Id<"user">
) {
  const historyUserIds = getFinishedGameHistoryUserIds({
    players: game.players,
    againstBot: game.againstBot,
    botPlayerId: game.againstBot
      ? (game.botProfile?.userId as Id<"user"> | undefined)
      : undefined,
  });

  if (game.mode === "scroll" && game.scrollText) {
    const previousProgress = game.scrollProgress?.[
      forfeitingPlayerId
    ] as CompetitiveScrollProgress | undefined;
    const now = Date.now();
    const scrollStartedAt = game.scrollStartedAt ?? previousProgress?.startedAt ?? now;
    const forfeitingProgress = normalizeCompetitiveScrollProgress({
      currentIndex: previousProgress?.currentIndex ?? 0,
      errors: previousProgress?.errors ?? 0,
      failed: true,
      now,
      previousProgress,
      startedAt: scrollStartedAt,
      text: game.scrollText,
    });
    const scrollProgress = {
      ...(game.scrollProgress as Record<string, CompetitiveScrollProgress> | undefined),
      [forfeitingPlayerId]: forfeitingProgress,
    };

    await saveFinishedScrollGameHistory(
      ctx,
      game,
      winnerId,
      scrollProgress,
      historyUserIds
    );
    await rewardFinishedGameWinner(ctx, game, winnerId);
    await ctx.db.patch(game._id, {
      scrollProgress,
      ...(game.scrollStartedAt !== undefined ? {} : { scrollStartedAt }),
      winner: winnerId,
    });
  } else {
    const progress = (game.progress as GameProgress | undefined) ?? {};

    await saveFinishedGameHistory(ctx, game, winnerId, progress, historyUserIds);
    await updateFinishedClassicMatchHighestWpms(ctx, progress, historyUserIds);
    await rewardFinishedGameWinner(ctx, game, winnerId);
    await ctx.db.patch(game._id, {
      progress,
      winner: winnerId,
    });
  }

  await ctx.db.patch(forfeitingPlayerId, {
    status: "online",
    activeGame: undefined,
  });
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
      hasMatchAcceptWindowExpired({
        acceptDeadlineAt: game.acceptDeadlineAt,
        now: Date.now(),
        players: game.players,
        playersAccepted: game.playersAccepted,
      })
    ) {
      await clearPendingGamePlayers(ctx, game);
      throw new Error("La ventana para aceptar la partida expiró");
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

    const now = Date.now();
    const scrollStartedAt =
      game.mode === "scroll" && acceptedState.allAccepted
        ? (game.scrollStartedAt ?? now + COMPETITIVE_SCROLL_START_DELAY_MS)
        : undefined;
    const result = await ctx.db.patch(game._id, {
      playersAccepted: acceptedState.playersAccepted,
      ...(acceptedState.allAccepted && game.mode === "scroll" && scrollStartedAt
        ? {
            scrollStartedAt,
            ...(againstBot
              ? {
                  botScrollPlan: {
                    botId: theOtherPlayerId,
                    startedAt: scrollStartedAt,
                    charsPerSecond: game.botScrollPlan?.charsPerSecond ?? 5,
                  },
                }
              : {}),
          }
        : {}),
    });

    if (againstBot && acceptedState.allAccepted && !wasAlreadyAccepted) {
      if (game.mode === "scroll") {
        await ctx.scheduler.runAfter(SCROLL_BOT_TICK_MS, internal.game.tickScrollBot, {
          gameId: game._id,
          botId: theOtherPlayerId,
        });
      } else {
        await scheduleNextBotStep(
          ctx,
          game._id,
          theOtherPlayerId,
          game.progress as GameProgress | undefined,
          CLASSIC_MATCH_START_DELAY_MS
        );
      }
    }

    return result;
  },
});

export const expirePendingGame = internalMutation({
  args: {
    gameId: v.id("game"),
    acceptDeadlineAt: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);

    if (!game || game.acceptDeadlineAt !== args.acceptDeadlineAt) {
      return null;
    }

    if (
      !hasMatchAcceptWindowExpired({
        acceptDeadlineAt: game.acceptDeadlineAt,
        now: Date.now(),
        players: game.players,
        playersAccepted: game.playersAccepted,
      })
    ) {
      return null;
    }

    await clearPendingGamePlayers(ctx, game);
    return null;
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
            highestPracticeWpm:
              game.botProfile.highestPracticeWpm ??
              opponentDoc.highestPracticeWpm,
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
      await updateFinishedClassicMatchHighestWpms(
        ctx,
        nextState.progress,
        historyUserIds
      );

      await rewardFinishedGameWinner(ctx, game, ownUser._id);

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

export const updateScrollProgress = mutation({
  args: {
    currentIndex: v.number(),
    errors: v.number(),
    failed: v.optional(v.boolean()),
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

    if (game.mode !== "scroll" || !game.scrollText) {
      throw new Error("Esta partida no es Scroll");
    }

    if (ownUser.status !== "in_game") {
      throw new Error("User must be in_game to progress");
    }

    if (!game.playersAccepted.includes(ownUser._id)) {
      throw new Error("Player must have accepted the game");
    }

    if (game.winner) {
      return game;
    }

    const previousProgress =
      game.scrollProgress?.[ownUser._id] as CompetitiveScrollProgress | undefined;

    const now = Date.now();
    const scrollStartedAt = game.scrollStartedAt ?? now;
    const nextPlayerProgress = normalizeCompetitiveScrollProgress({
      currentIndex: args.currentIndex,
      errors: args.errors,
      failed: Boolean(args.failed),
      now,
      previousProgress,
      startedAt: scrollStartedAt,
      text: game.scrollText,
    });
    const scrollProgress = {
      ...(game.scrollProgress as Record<string, CompetitiveScrollProgress> | undefined),
      [ownUser._id]: nextPlayerProgress,
    };
    const winner = getCompetitiveScrollWinner({
      playerIds: game.players,
      progressByPlayerId: scrollProgress,
    });

    if (winner) {
      const historyUserIds = getFinishedGameHistoryUserIds({
        players: game.players,
        againstBot: game.againstBot,
        botPlayerId: game.againstBot
          ? (game.botProfile?.userId as Id<"user"> | undefined)
          : undefined,
      });

      await saveFinishedScrollGameHistory(
        ctx,
        game,
        winner as Id<"user">,
        scrollProgress,
        historyUserIds
      );

      await rewardFinishedGameWinner(ctx, game, winner as Id<"user">);

      return await ctx.db.patch(game._id, {
        scrollProgress,
        ...(game.scrollStartedAt !== undefined ? {} : { scrollStartedAt }),
        winner: winner as Id<"user">,
      });
    }

    return await ctx.db.patch(game._id, {
      scrollProgress,
      ...(game.scrollStartedAt !== undefined ? {} : { scrollStartedAt }),
    });
  },
});

export const tickScrollBot = internalMutation({
  args: {
    gameId: v.id("game"),
    botId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);

    if (!game || game.winner) return null;
    if (game.mode !== "scroll" || !game.scrollText) return null;
    if (!game.againstBot || game.botProfile?.userId !== args.botId) {
      throw new Error("Bot no pertenece a esta partida Scroll");
    }

    const plan = game.botScrollPlan;
    const now = Date.now();
    const startedAt = plan?.startedAt ?? now;
    const charsPerSecond = plan?.charsPerSecond ?? 5;

    if (now < startedAt) {
      await ctx.scheduler.runAfter(
        Math.max(1, startedAt - now),
        internal.game.tickScrollBot,
        {
          gameId: game._id,
          botId: args.botId,
        }
      );
      return null;
    }

    const previousProgress =
      game.scrollProgress?.[args.botId] as CompetitiveScrollProgress | undefined;
    const humanPlayerId = game.players.find((playerId) => playerId !== args.botId);
    const humanProgress = humanPlayerId
      ? (game.scrollProgress?.[humanPlayerId] as
          | CompetitiveScrollProgress
          | undefined)
      : undefined;
    const humanPlayer = humanPlayerId ? await ctx.db.get(humanPlayerId) : null;
    const currentIndex = getBotScrollIndex({
      charsPerSecond,
      now,
      startedAt,
      textLength: game.scrollText.length,
    });
    const lines = getPracticeScrollWordLines(game.scrollText);
    const failed = hasCompetitiveScrollBotMissedLine({
      currentIndex,
      playerCompletedWords: humanProgress?.typedWords ?? 0,
      playerWpm: humanPlayer?.highestPracticeWpm,
      previousIndex: previousProgress?.currentIndex ?? 0,
      text: game.scrollText,
      lines,
    });
    const nextBotProgress = normalizeCompetitiveScrollProgress({
      currentIndex,
      errors: previousProgress?.errors ?? 0,
      failed,
      now,
      previousProgress,
      text: game.scrollText,
    });
    const scrollProgress = {
      ...(game.scrollProgress as Record<string, CompetitiveScrollProgress> | undefined),
      [args.botId]: nextBotProgress,
    };
    const winner = getCompetitiveScrollWinner({
      playerIds: game.players,
      progressByPlayerId: scrollProgress,
    });

    if (winner) {
      const historyUserIds = getFinishedGameHistoryUserIds({
        players: game.players,
        againstBot: game.againstBot,
        botPlayerId: args.botId,
      });

      await saveFinishedScrollGameHistory(
        ctx,
        game,
        winner as Id<"user">,
        scrollProgress,
        historyUserIds
      );
      await rewardFinishedGameWinner(ctx, game, winner as Id<"user">);

      return await ctx.db.patch(game._id, {
        scrollProgress,
        winner: winner as Id<"user">,
      });
    }

    const result = await ctx.db.patch(game._id, {
      botScrollPlan: {
        botId: args.botId,
        startedAt,
        charsPerSecond,
      },
      scrollProgress,
    });

    await ctx.scheduler.runAfter(SCROLL_BOT_TICK_MS, internal.game.tickScrollBot, {
      gameId: game._id,
      botId: args.botId,
    });

    return result;
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
      await updateFinishedClassicMatchHighestWpms(
        ctx,
        nextState.progress,
        historyUserIds
      );
      await rewardFinishedGameWinner(ctx, game, args.botId);

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
    if (!game) {
      await ctx.db.patch(ownUser._id, {
        status: "online",
        activeGame: undefined,
      });
      return null;
    }

    const forfeitWinnerId = getForfeitWinnerId({
      players: game.players,
      forfeitingPlayerId: ownUser._id,
      existingWinner: game.winner,
    });

    if (
      forfeitWinnerId &&
      ownUser.status === "in_game" &&
      game.playersAccepted.includes(ownUser._id)
    ) {
      await finishGameByForfeit(ctx, game, ownUser._id, forfeitWinnerId);
      return null;
    }

    const playerIdsToClear = getHumanGamePlayerIds(game);

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
