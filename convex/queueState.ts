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
export const BOT_INTRO_WPM_FALLBACK = 45;
export const BOT_INTRO_WPM_MIN = 15;
export const BOT_INTRO_WPM_VARIANCE = 8;

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
  highestPracticeWpm?: number;
}) {
  return {
    userId: args.botUserId,
    nickname: args.nickname,
    avatarSeed: args.avatarSeed,
    avatarUrl: args.avatarUrl,
    ...(args.highestPracticeWpm !== undefined
      ? { highestPracticeWpm: args.highestPracticeWpm }
      : {}),
  };
}

export function getNearbyBotIntroWpm({
  random = Math.random,
  userWpm,
}: {
  random?: () => number;
  userWpm?: number | null;
}) {
  const baseWpm =
    typeof userWpm === "number" && Number.isFinite(userWpm) && userWpm > 0
      ? userWpm
      : BOT_INTRO_WPM_FALLBACK;
  const randomValue = Math.max(0, Math.min(0.999_999, random()));
  const offset = Math.round((randomValue * 2 - 1) * BOT_INTRO_WPM_VARIANCE);

  return Math.max(BOT_INTRO_WPM_MIN, Math.round(baseWpm + offset));
}
