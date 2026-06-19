export type QueueableUser = {
  _id: string;
  status?: string;
  queuedAt?: number;
  activeGame?: string;
};

export const MAX_MATCHMAKING_BATCH_SIZE = 50;
export const MIN_BOT_MATCH_WAIT_MS = 15_000;

export function buildEnterQueuePatch(now: number) {
  return {
    queuedAt: now,
    status: "in_queue" as const,
    activeGame: undefined,
  };
}

export function buildExitQueuePatch() {
  return {
    queuedAt: undefined,
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
