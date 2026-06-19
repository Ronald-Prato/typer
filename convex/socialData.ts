import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { userPairKey } from "./socialState";

type SocialCtx = QueryCtx | MutationCtx;

export const toUserSummary = (user: Doc<"user">) => ({
  _id: user._id,
  _creationTime: user._creationTime,
  nickname: user.nickname,
  avatarSeed: user.avatarSeed,
  avatarUrl: user.avatarUrl,
  gold: user.gold ?? 0,
  highestPracticeWpm: user.highestPracticeWpm ?? 0,
  status: user.status,
  gamesCount: 0,
});

export async function getFriendshipByPair(
  ctx: SocialCtx,
  left: Id<"user">,
  right: Id<"user">
) {
  return await ctx.db
    .query("friendships")
    .withIndex("by_pair", (q) => q.eq("pairKey", userPairKey(left, right)))
    .first();
}

export async function getPendingRequestByPair(
  ctx: SocialCtx,
  left: Id<"user">,
  right: Id<"user">
) {
  return await ctx.db
    .query("friendRequests")
    .withIndex("by_pair_status", (q) =>
      q.eq("pairKey", userPairKey(left, right)).eq("status", "pending")
    )
    .first();
}

export async function getFriendIdsForUser(
  ctx: QueryCtx,
  userId: Id<"user">,
  limit: number,
  beforeCreatedAt?: number
) {
  const [asUserA, asUserB] = await Promise.all([
    ctx.db
      .query("friendships")
      .withIndex("by_user_a_created_at", (q) => {
        const scoped = q.eq("userAId", userId);
        return beforeCreatedAt === undefined
          ? scoped
          : scoped.lt("createdAt", beforeCreatedAt);
      })
      .order("desc")
      .take(limit + 1),
    ctx.db
      .query("friendships")
      .withIndex("by_user_b_created_at", (q) => {
        const scoped = q.eq("userBId", userId);
        return beforeCreatedAt === undefined
          ? scoped
          : scoped.lt("createdAt", beforeCreatedAt);
      })
      .order("desc")
      .take(limit + 1),
  ]);

  return [...asUserA, ...asUserB]
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, limit + 1);
}

export function getFriendIdFromFriendship(
  friendship: Doc<"friendships">,
  userId: Id<"user">
) {
  return friendship.userAId === userId ? friendship.userBId : friendship.userAId;
}
