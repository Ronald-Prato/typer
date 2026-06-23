export const GAME_STEPS = [
  "phrase",
  "words",
  "lettersAndSymbols",
  "holds",
] as const;

export type GameStep = (typeof GAME_STEPS)[number];

export type GameMetrics = {
  errors: number;
  timeMs: number;
  accuracy?: number;
  wpm?: number;
};

export type UserGameProgress = {
  phraseDone?: boolean;
  wordsDone?: boolean;
  lettersAndSymbolsDone?: boolean;
  holdsDone?: boolean;
  phraseMetrics?: GameMetrics;
  wordsMetrics?: GameMetrics;
  lettersAndSymbolsMetrics?: GameMetrics;
  holdsMetrics?: GameMetrics;
};

export type GameProgress = Record<string, UserGameProgress>;

export type UserGameStatus =
  | "online"
  | "in_queue"
  | "game_found"
  | "in_game";

export const MATCH_ACCEPT_TIMEOUT_MS = 5_000;

export const BOT_STEP_DELAYS_MS: Record<GameStep, number> = {
  phrase: 10000,
  words: 12000,
  lettersAndSymbols: 8000,
  holds: 18000,
};

export const stepFieldMap = {
  phrase: "phraseDone",
  words: "wordsDone",
  lettersAndSymbols: "lettersAndSymbolsDone",
  holds: "holdsDone",
} as const satisfies Record<GameStep, keyof UserGameProgress>;

export const metricsFieldMap = {
  phrase: "phraseMetrics",
  words: "wordsMetrics",
  lettersAndSymbols: "lettersAndSymbolsMetrics",
  holds: "holdsMetrics",
} as const satisfies Record<GameStep, keyof UserGameProgress>;

export function validateGameMetrics(metrics: GameMetrics): GameMetrics {
  if (!Number.isInteger(metrics.errors) || metrics.errors < 0) {
    throw new Error("errors must be a non-negative integer");
  }
  if (!Number.isFinite(metrics.timeMs) || metrics.timeMs < 1) {
    throw new Error("timeMs must be greater than zero");
  }
  if (
    metrics.accuracy !== undefined &&
    (!Number.isFinite(metrics.accuracy) ||
      metrics.accuracy < 0 ||
      metrics.accuracy > 100)
  ) {
    throw new Error("accuracy must be between 0 and 100");
  }
  if (
    metrics.wpm !== undefined &&
    (!Number.isFinite(metrics.wpm) || metrics.wpm < 0 || metrics.wpm > 500)
  ) {
    throw new Error("wpm must be between 0 and 500");
  }

  return metrics;
}

export function getNextBotStep(
  progress: UserGameProgress | undefined
): GameStep | null {
  if (!progress?.phraseDone) return "phrase";
  if (!progress.wordsDone) return "words";
  if (!progress.lettersAndSymbolsDone) return "lettersAndSymbols";
  if (!progress.holdsDone) return "holds";
  return null;
}

export function getBotStepScheduleDelayMs({
  initialDelayMs = 0,
  step,
}: {
  initialDelayMs?: number;
  step: GameStep;
}) {
  const safeInitialDelayMs =
    Number.isFinite(initialDelayMs) && initialDelayMs > 0
      ? Math.floor(initialDelayMs)
      : 0;

  return BOT_STEP_DELAYS_MS[step] + safeInitialDelayMs;
}

export function canAcceptGame<TPlayerId extends string>(args: {
  players: TPlayerId[];
  playersAccepted: TPlayerId[];
  playerId: TPlayerId;
}) {
  if (!args.players.includes(args.playerId)) {
    throw new Error("Player does not belong to this game");
  }

  const playersAccepted = args.playersAccepted.includes(args.playerId)
    ? args.playersAccepted
    : [...args.playersAccepted, args.playerId];

  return {
    playersAccepted,
    allAccepted: args.players.every((playerId) =>
      playersAccepted.includes(playerId)
    ),
  };
}

export function getMatchAcceptDeadline(now: number) {
  return now + MATCH_ACCEPT_TIMEOUT_MS;
}

export function hasMatchAcceptWindowExpired(args: {
  acceptDeadlineAt?: number;
  now: number;
  players: string[];
  playersAccepted: string[];
}) {
  if (args.acceptDeadlineAt === undefined) return false;
  if (!Number.isFinite(args.acceptDeadlineAt)) return false;
  if (
    args.players.length > 0 &&
    args.players.every((playerId) => args.playersAccepted.includes(playerId))
  ) {
    return false;
  }

  return args.now >= args.acceptDeadlineAt;
}

export function applyGameStep(args: {
  game: {
    players: string[];
    playersAccepted: string[];
    progress?: GameProgress;
    winner?: string | null;
  };
  playerId: string;
  userStatus?: UserGameStatus;
  step: GameStep;
  metrics?: GameMetrics;
}) {
  if (!args.game.players.includes(args.playerId)) {
    throw new Error("Player does not belong to this game");
  }
  if (args.userStatus !== "in_game") {
    throw new Error("User must be in_game to progress");
  }
  if (!args.game.playersAccepted.includes(args.playerId)) {
    throw new Error("Player must have accepted the game");
  }
  if (args.game.winner) {
    throw new Error("Game already has a winner");
  }

  const currentProgress = args.game.progress?.[args.playerId] ?? {};
  const stepField = stepFieldMap[args.step];
  if (currentProgress[stepField]) {
    throw new Error("Step already completed");
  }

  const nextStep = getNextBotStep(currentProgress);
  if (nextStep !== args.step) {
    throw new Error(`Step order invalid: expected ${nextStep}`);
  }

  const metrics = args.metrics ? validateGameMetrics(args.metrics) : undefined;
  const nextPlayerProgress: UserGameProgress = {
    ...currentProgress,
    [stepField]: true,
    ...(metrics ? { [metricsFieldMap[args.step]]: metrics } : {}),
  };
  const progress = {
    ...args.game.progress,
    [args.playerId]: nextPlayerProgress,
  };

  return {
    progress,
    winner: args.step === "holds" ? args.playerId : undefined,
  };
}
