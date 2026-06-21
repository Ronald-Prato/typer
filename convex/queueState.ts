export type QueueableUser = {
  _id: string;
  status?: string;
  queuedAt?: number;
  queuedMode?: GameMode;
  activeGame?: string;
};

export type GameMode = "classic" | "scroll";

export const MAX_MATCHMAKING_BATCH_SIZE = 50;
export const MIN_BOT_MATCH_WAIT_MS = 15_000;

export function normalizeGameMode(mode: string | undefined): GameMode {
  return mode === "scroll" ? "scroll" : "classic";
}

export function buildEnterQueuePatch(now: number, mode: GameMode = "classic") {
  return {
    queuedAt: now,
    queuedMode: mode,
    status: "in_queue" as const,
    activeGame: undefined,
  };
}

export function buildExitQueuePatch() {
  return {
    queuedAt: undefined,
    queuedMode: undefined,
    status: "online" as const,
    activeGame: undefined,
  };
}

export function selectQueuedUsers<T extends QueueableUser>(
  users: T[],
  limit = MAX_MATCHMAKING_BATCH_SIZE
) {
  return users
    .filter((user) => user.status === "in_queue" && user.queuedAt !== undefined)
    .sort((a, b) => (a.queuedAt ?? 0) - (b.queuedAt ?? 0))
    .slice(0, Math.max(0, limit));
}

export function selectQueuedUsersByMode<T extends QueueableUser>(
  users: T[],
  mode: GameMode,
  limit = MAX_MATCHMAKING_BATCH_SIZE
) {
  return selectQueuedUsers(users, limit).filter(
    (user) => normalizeGameMode(user.queuedMode) === mode
  );
}

export function canCreateMatchForUser(user: QueueableUser | null | undefined) {
  return (
    user?.status === "in_queue" &&
    user.queuedAt !== undefined &&
    user.activeGame === undefined
  );
}

export function canCreateBotMatchForUser(
  user: QueueableUser | null | undefined,
  now: number
) {
  return (
    canCreateMatchForUser(user) &&
    user?.queuedAt !== undefined &&
    now - user.queuedAt >= MIN_BOT_MATCH_WAIT_MS
  );
}

export function hasQueuedHumanOpponent(
  users: QueueableUser[],
  candidateUserId: string,
  mode: GameMode
) {
  return users.some(
    (user) =>
      user._id !== candidateUserId &&
      canCreateMatchForUser(user) &&
      normalizeGameMode(user.queuedMode) === mode
  );
}

export function buildBotProfile<TUserId extends string>(args: {
  botUserId: TUserId;
  nickname: string;
  avatarSeed?: string;
  avatarUrl?: string;
}) {
  return {
    userId: args.botUserId,
    nickname: args.nickname,
    avatarSeed: args.avatarSeed,
    avatarUrl: args.avatarUrl,
  };
}
