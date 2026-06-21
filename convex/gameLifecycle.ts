export const GOLD_REWARD_FOR_1V1_WIN = 10;

export interface PlayerSnapshot<TPlayerId extends string = string> {
  userId: TPlayerId;
  nickname: string;
  avatarSeed?: string;
  avatarUrl?: string;
}

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

export function getWinnerGoldPatch(currentGold: number | undefined) {
  return {
    gold: (currentGold ?? 0) + GOLD_REWARD_FOR_1V1_WIN,
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
}): PlayerSnapshot<TPlayerId> {
  return {
    userId: player._id,
    nickname: player.nickname,
    avatarSeed: player.avatarSeed,
    avatarUrl: player.avatarUrl,
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
