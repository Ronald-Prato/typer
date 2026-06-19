export const GOLD_REWARD_FOR_1V1_WIN = 10;

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
