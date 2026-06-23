import { avatarUrlFromSeed, DEFAULT_AVATAR_SEED } from "../../src/domain/avatar";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = QueryCtx | MutationCtx;

export { avatarUrlFromSeed };

export const sanitizeNickname = (nickname: string) => {
  const trimmed = nickname.trim();
  if (!trimmed) throw new Error("Nickname is required");
  if (trimmed.length > 40) throw new Error("Nickname is too long");

  return trimmed;
};

export const sanitizeAvatarSeed = (
  seed: string | undefined,
  fallbackSeed: string
) => {
  const fallback = fallbackSeed.trim() || DEFAULT_AVATAR_SEED;
  const rawSeed = seed?.trim() || fallback;
  const unsafeSeed = /[<>]|script|javascript:/i.test(rawSeed);
  const seedToClean = unsafeSeed ? fallback : rawSeed;
  const safeSeed = seedToClean
    .replace(/[^a-z0-9_-]/gi, "")
    .slice(0, 64);

  return safeSeed || DEFAULT_AVATAR_SEED;
};

export const toPublicUserDto = (user: Doc<"user"> | null) => {
  if (!user) return null;

  return {
    _id: user._id,
    _creationTime: user._creationTime,
    nickname: user.nickname,
    avatarSeed: user.avatarSeed,
    avatarUrl: user.avatarUrl,
    gold: user.gold ?? 0,
    highestPracticeWpm: user.highestPracticeWpm ?? 0,
    status: user.status,
  };
};

export const getCurrentUser = async (ctx: AuthCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("user")
    .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
    .first();

  if (!user) throw new Error("User not found");

  return user;
};

export const getCurrentUserOrNull = async (ctx: AuthCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("user")
    .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
    .first();
};

export const requireCurrentUser = getCurrentUser;
export const currentUserOrNull = getCurrentUserOrNull;
