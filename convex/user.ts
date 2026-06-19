import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  avatarUrlFromSeed,
  getCurrentUser,
  getCurrentUserOrNull,
  sanitizeAvatarSeed,
  sanitizeNickname,
  toPublicUserDto,
} from "./helpers/getCurrentUser";
import {
  getFriendIdsForUser,
  getFriendIdFromFriendship,
  getFriendshipByPair,
  getPendingRequestByPair,
  toUserSummary,
} from "./socialData";
import {
  getCanonicalFriendshipUsers,
  getFriendshipStatus,
  MAX_USER_SEARCH_RESULTS,
  normalizeNicknameSearch,
  normalizeSocialPageSize,
  userPairKey,
  type FriendshipStatus,
} from "./socialState";

export const getOwnUser = query({
  handler: async (ctx) => {
    const clerkUser = await ctx.auth.getUserIdentity();

    if (!clerkUser) {
      return null;
    }

    return await ctx.db
      .query("user")
      .withIndex("by_auth_id", (q) => q.eq("authId", clerkUser.subject))
      .first();
  },
});

export const getUserByAuthId = query({
  args: {
    authId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("user")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();

    return user ? toUserSummary(user) : null;
  },
});

export const searchUsersByNickname = query({
  args: {
    nickname: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrNull(ctx);

    if (!currentUser) return [];

    const nickname = normalizeNicknameSearch(args.nickname);
    if (!nickname) return [];

    const users = await ctx.db
      .query("user")
      .withIndex("by_nickname_search", (q) =>
        q
          .gte("nicknameSearch", nickname)
          .lt("nicknameSearch", nickname + "\uffff")
      )
      .take(MAX_USER_SEARCH_RESULTS + 1);

    return await Promise.all(
      users
        .filter((user) => user._id !== currentUser._id)
        .slice(0, MAX_USER_SEARCH_RESULTS)
        .map(async (user) => {
          const friendship = await getFriendshipByPair(
            ctx,
            currentUser._id,
            user._id
          );
          const pendingRequest = await getPendingRequestByPair(
            ctx,
            currentUser._id,
            user._id
          );

          const friendshipStatus: FriendshipStatus = getFriendshipStatus({
            currentUserId: currentUser._id,
            friendshipExists: Boolean(friendship),
            pendingRequest,
          });

          return {
            ...toUserSummary(user),
            friendshipStatus,
          };
        })
    );
  },
});

export const createUser = mutation({
  args: {
    email: v.optional(v.string()),
    authId: v.optional(v.string()),
    nickname: v.string(),
    avatar: v.optional(v.string()),
    avatarSeed: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existingUser = await ctx.db
      .query("user")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first();

    if (existingUser) {
      return toPublicUserDto(existingUser);
    }

    const nickname = sanitizeNickname(args.nickname);
    const nicknameSearch = normalizeNicknameSearch(nickname);
    const avatarSeed = sanitizeAvatarSeed(
      args.avatarSeed ?? args.avatar,
      identity.subject
    );

    const userId = await ctx.db.insert("user", {
      email: identity.email ?? "",
      authId: identity.subject,
      nickname,
      nicknameSearch,
      avatarSeed,
      avatarUrl: avatarUrlFromSeed(avatarSeed),
      gold: 0,
      status: "online",
    });

    return toPublicUserDto(await ctx.db.get(userId));
  },
});

export const updateUser = mutation({
  args: {
    avatar: v.optional(v.string()),
    avatarSeed: v.optional(v.string()),
    nickname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkUser = await ctx.auth.getUserIdentity();

    if (!clerkUser) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("user")
      .withIndex("by_auth_id", (q) => q.eq("authId", clerkUser.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updateData: {
      avatarSeed?: string;
      avatarUrl?: string;
      nickname?: string;
      nicknameSearch?: string;
    } = {};

    if (args.avatar !== undefined || args.avatarSeed !== undefined) {
      const avatarSeed = sanitizeAvatarSeed(
        args.avatarSeed ?? args.avatar,
        clerkUser.subject
      );
      updateData.avatarSeed = avatarSeed;
      updateData.avatarUrl = avatarUrlFromSeed(avatarSeed);
    }
    if (args.nickname !== undefined) {
      const nickname = sanitizeNickname(args.nickname);
      updateData.nickname = nickname;
      updateData.nicknameSearch = normalizeNicknameSearch(nickname);
    }

    return await ctx.db.patch(user._id, updateData);
  },
});

export const sendFriendRequest = mutation({
  args: {
    userId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const targetUser = await ctx.db.get(args.userId);

    if (!targetUser) {
      throw new Error("User not found");
    }

    if (targetUser._id === currentUser._id) {
      throw new Error("You cannot send a friend request to yourself");
    }

    const existingFriendship = await getFriendshipByPair(
      ctx,
      currentUser._id,
      targetUser._id
    );

    if (existingFriendship) {
      return {
        status: "friends" as const,
        friendshipId: existingFriendship._id,
      };
    }

    const existingPendingRequest = await getPendingRequestByPair(
      ctx,
      currentUser._id,
      targetUser._id
    );

    if (existingPendingRequest) {
      return {
        status: "pending" as const,
        requestId: existingPendingRequest._id,
      };
    }

    const now = Date.now();
    const requestId = await ctx.db.insert("friendRequests", {
      requesterId: currentUser._id,
      receiverId: targetUser._id,
      pairKey: userPairKey(currentUser._id, targetUser._id),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return {
      status: "pending" as const,
      requestId,
    };
  },
});

export const getFriends = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrNull(ctx);

    if (!currentUser) return [];

    const friendships = await getFriendIdsForUser(
      ctx,
      currentUser._id,
      normalizeSocialPageSize(args.limit)
    );
    const friendIds = friendships
      .slice(0, normalizeSocialPageSize(args.limit))
      .map((friendship) =>
        getFriendIdFromFriendship(friendship, currentUser._id)
      );

    const friendDocs = await Promise.all(
      friendIds.map((friendId) => ctx.db.get(friendId))
    );

    return friendDocs
      .filter((doc): doc is NonNullable<typeof doc> => doc !== null)
      .map(toUserSummary);
  },
});

async function getFriendRequestsPageData(
  ctx: QueryCtx,
  args: { cursorCreatedAt?: number; limit?: number }
) {
  const currentUser = await getCurrentUserOrNull(ctx);

  if (!currentUser) return { page: [], nextCursorCreatedAt: null };

  const pageSize = normalizeSocialPageSize(args.limit);
  const pendingRequests = await ctx.db
    .query("friendRequests")
    .withIndex("by_receiver_status_created_at", (q) => {
      const scoped = q.eq("receiverId", currentUser._id).eq("status", "pending");
      return args.cursorCreatedAt === undefined
        ? scoped
        : scoped.lt("createdAt", args.cursorCreatedAt);
    })
    .order("desc")
    .take(pageSize + 1);
  const pageRows = pendingRequests.slice(0, pageSize);
  const requesters = await Promise.all(
    pageRows.map((friendRequest) => ctx.db.get(friendRequest.requesterId))
  );

  return {
    page: pageRows
      .map((friendRequest, index) => {
        const fromUser = requesters[index];
        if (!fromUser) return null;

        return {
          requestId: friendRequest._id,
          fromUser: toUserSummary(fromUser),
          createdAt: friendRequest.createdAt,
        };
      })
      .filter(
        (request): request is NonNullable<typeof request> => request !== null
      ),
    nextCursorCreatedAt:
      pendingRequests.length > pageSize
        ? (pageRows[pageRows.length - 1]?.createdAt ?? null)
        : null,
  };
}

export const getFriendsPage = query({
  args: {
    cursorCreatedAt: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrNull(ctx);

    if (!currentUser) return { page: [], nextCursorCreatedAt: null };

    const pageSize = normalizeSocialPageSize(args.limit);
    const friendships = await getFriendIdsForUser(
      ctx,
      currentUser._id,
      pageSize,
      args.cursorCreatedAt
    );
    const pageRows = friendships.slice(0, pageSize);
    const friendDocs = await Promise.all(
      pageRows.map((friendship) =>
        ctx.db.get(getFriendIdFromFriendship(friendship, currentUser._id))
      )
    );

    return {
      page: friendDocs
        .filter((doc): doc is NonNullable<typeof doc> => doc !== null)
        .map(toUserSummary),
      nextCursorCreatedAt:
        friendships.length > pageSize
          ? (pageRows[pageRows.length - 1]?.createdAt ?? null)
          : null,
    };
  },
});

export const getFriendRequests = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const page = await getFriendRequestsPageData(ctx, args);
    return page.page;
  },
});

export const getFriendRequestsPage = query({
  args: {
    cursorCreatedAt: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await getFriendRequestsPageData(ctx, args);
  },
});

export const acceptFriendRequest = mutation({
  args: {
    friendRequestId: v.id("friendRequests"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const friendRequest = await ctx.db.get(args.friendRequestId);

    if (!friendRequest) {
      throw new Error("Friend request not found");
    }

    if (friendRequest.receiverId !== currentUser._id) {
      throw new Error("Friend request does not belong to the current user");
    }

    const existingFriendship = await getFriendshipByPair(
      ctx,
      friendRequest.requesterId,
      friendRequest.receiverId
    );

    if (friendRequest.status !== "pending") {
      if (existingFriendship) {
        return {
          status: "accepted" as const,
          friendshipId: existingFriendship._id,
        };
      }

      throw new Error("Friend request is not pending");
    }

    const friendshipId =
      existingFriendship?._id ??
      (await ctx.db.insert("friendships", {
        ...getCanonicalFriendshipUsers(
          friendRequest.requesterId,
          friendRequest.receiverId
        ),
        pairKey: friendRequest.pairKey,
        createdAt: Date.now(),
      }));

    await ctx.db.patch(friendRequest._id, {
      status: "accepted",
      updatedAt: Date.now(),
    });

    return {
      status: "accepted" as const,
      friendshipId,
    };
  },
});

export const rejectFriendRequest = mutation({
  args: {
    friendRequestId: v.id("friendRequests"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const friendRequest = await ctx.db.get(args.friendRequestId);

    if (!friendRequest) {
      throw new Error("Friend request not found");
    }

    if (friendRequest.receiverId !== currentUser._id) {
      throw new Error("Friend request does not belong to the current user");
    }

    if (friendRequest.status !== "pending") {
      return {
        status: friendRequest.status,
        requestId: friendRequest._id,
      };
    }

    await ctx.db.patch(friendRequest._id, {
      status: "rejected",
      updatedAt: Date.now(),
    });

    return {
      status: "rejected" as const,
      requestId: friendRequest._id,
    };
  },
});

export const cancelFriendRequest = mutation({
  args: {
    friendRequestId: v.id("friendRequests"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const friendRequest = await ctx.db.get(args.friendRequestId);

    if (!friendRequest) {
      throw new Error("Friend request not found");
    }

    if (friendRequest.requesterId !== currentUser._id) {
      throw new Error("Only the requester can cancel a friend request");
    }

    if (friendRequest.status !== "pending") {
      return {
        status: friendRequest.status,
        requestId: friendRequest._id,
      };
    }

    await ctx.db.patch(friendRequest._id, {
      status: "canceled",
      updatedAt: Date.now(),
    });

    return {
      status: "canceled" as const,
      requestId: friendRequest._id,
    };
  },
});
