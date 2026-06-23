import { TYPOCOIN_REWARD_FOR_1V1_WIN } from "../src/domain/currency";
import type { GameMetrics, UserGameProgress } from "./gameStateMachine";
import { getNextHighestPracticeWpm } from "./practiceState";

export interface PlayerSnapshot<TPlayerId extends string = string> {
  userId: TPlayerId;
  nickname: string;
  avatarSeed?: string;
  avatarUrl?: string;
  highestPracticeWpm?: number;
}

const classicMatchMetricFields = [
  "phraseMetrics",
  "wordsMetrics",
  "lettersAndSymbolsMetrics",
  "holdsMetrics",
] as const satisfies Array<keyof UserGameProgress>;

export function getFinishedGameHistoryUserIds<TPlayerId extends string>(args: {
  players: TPlayerId[];
  againstBot?: boolean;
  botPlayerId?: TPlayerId;
}) {
  if (!args.againstBot || !args.botPlayerId) {
    return args.players;
  }

  return args.players.filter((playerId) => playerId !== args.botPlayerId);
}

export function getWinnerTypocoinPatch(currentGold: number | undefined) {
  return {
    gold: (currentGold ?? 0) + TYPOCOIN_REWARD_FOR_1V1_WIN,
  };
}

export function getRewardedWinnerId<TPlayerId extends string>(args: {
  players: TPlayerId[];
  winnerId: TPlayerId;
  againstBot?: boolean;
  botPlayerId?: TPlayerId;
}) {
  if (!args.players.includes(args.winnerId)) return undefined;

  if (args.againstBot) {
    if (!args.botPlayerId || args.winnerId === args.botPlayerId) {
      return undefined;
    }
  }

  return args.winnerId;
}

export function getForfeitWinnerId<TPlayerId extends string>(args: {
  players: TPlayerId[];
  forfeitingPlayerId: TPlayerId;
  existingWinner?: TPlayerId | null;
}) {
  if (args.existingWinner) return undefined;
  if (!args.players.includes(args.forfeitingPlayerId)) return undefined;

  return args.players.find((playerId) => playerId !== args.forfeitingPlayerId);
}

export function getClassicMatchAverageWpm(
  progress: UserGameProgress | undefined
) {
  const metrics = classicMatchMetricFields
    .map((field) => progress?.[field])
    .filter((metric): metric is GameMetrics => Boolean(metric));

  if (metrics.length === 0) return 0;

  return Math.round(
    metrics.reduce((total, metric) => total + (metric.wpm ?? 0), 0) /
      metrics.length
  );
}

export function getClassicMatchHighestWpmPatch(args: {
  currentHighestWpm?: number;
  progress: UserGameProgress | undefined;
}) {
  const matchWpm = getClassicMatchAverageWpm(args.progress);

  if (matchWpm <= 0) return undefined;

  const currentHighestWpm = getNextHighestPracticeWpm({
    currentHighestWpm: args.currentHighestWpm,
    practiceWpm: 0,
  });
  const nextHighestWpm = getNextHighestPracticeWpm({
    currentHighestWpm: args.currentHighestWpm,
    practiceWpm: matchWpm,
  });

  if (nextHighestWpm === currentHighestWpm) return undefined;

  return {
    highestPracticeWpm: nextHighestWpm,
  };
}

export function shouldRewardWinner(args: {
  winnerId: string;
  humanPlayerId: string;
  againstBot?: boolean;
}) {
  return !args.againstBot || args.winnerId === args.humanPlayerId;
}

export function toPlayerSnapshot<TPlayerId extends string>(player: {
  _id: TPlayerId;
  nickname: string;
  avatarSeed?: string;
  avatarUrl?: string;
  highestPracticeWpm?: number;
}): PlayerSnapshot<TPlayerId> {
  return {
    userId: player._id,
    nickname: player.nickname,
    avatarSeed: player.avatarSeed,
    avatarUrl: player.avatarUrl,
    ...(player.highestPracticeWpm !== undefined
      ? { highestPracticeWpm: player.highestPracticeWpm }
      : {}),
  };
}

export function getHistoryOpponentSnapshot<TPlayerId extends string>(args: {
  historyUserId: TPlayerId;
  players: TPlayerId[];
  playerSnapshotsById: Partial<Record<TPlayerId, PlayerSnapshot<TPlayerId>>>;
  againstBot?: boolean;
  botProfile?: PlayerSnapshot<TPlayerId>;
}) {
  const opponentId = args.players.find(
    (playerId) => playerId !== args.historyUserId
  );

  if (!opponentId) return undefined;

  if (args.againstBot && args.botProfile?.userId === opponentId) {
    return args.botProfile;
  }

  return args.playerSnapshotsById[opponentId];
}
