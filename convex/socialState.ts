export type FriendshipStatus =
  | "none"
  | "friends"
  | "request_sent"
  | "request_received";

export const MAX_SOCIAL_PAGE_SIZE = 50;
export const DEFAULT_SOCIAL_PAGE_SIZE = 25;
export const MAX_USER_SEARCH_RESULTS = 10;

export function normalizeNicknameSearch(nickname: string) {
  return nickname.trim().toLocaleLowerCase();
}

export function normalizeSocialPageSize(limit: number | undefined) {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_SOCIAL_PAGE_SIZE;
  }

  return Math.min(MAX_SOCIAL_PAGE_SIZE, Math.max(1, Math.floor(limit)));
}

export function userPairKey(left: string, right: string) {
  return [left, right].sort().join(":");
}

export function getCanonicalFriendshipUsers<TUserId extends string>(
  left: TUserId,
  right: TUserId
) {
  return left < right
    ? { userAId: left, userBId: right }
    : { userAId: right, userBId: left };
}

export function getFriendshipStatus(args: {
  currentUserId: string;
  friendshipExists: boolean;
  pendingRequest?: {
    requesterId: string;
    receiverId: string;
  } | null;
}): FriendshipStatus {
  if (args.friendshipExists) return "friends";
  if (args.pendingRequest?.requesterId === args.currentUserId) {
    return "request_sent";
  }
  if (args.pendingRequest?.receiverId === args.currentUserId) {
    return "request_received";
  }
  return "none";
}
