import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./helpers/getCurrentUser";
import { Id } from "./_generated/dataModel";

export const getOwnUser = query({
  handler: async (ctx) => {
    const clerkUser = await ctx.auth.getUserIdentity();

    if (!clerkUser) {
      return null; // Return null instead of throwing error
    }

    const user = await ctx.db
      .query("user")
      .withIndex("by_auth_id", (q) => q.eq("authId", clerkUser?.subject))
      .first();

    return user;
  },
});

export const getUserByAuthId = query({
  args: {
    authId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();
  },
});

export const searchUsersByNickname = query({
  args: {
    nickname: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Search for users whose nickname contains the search term
    const users = await ctx.db
      .query("user")
      .filter((q) =>
        q.and(
          q.neq(q.field("_id"), currentUser._id), // Exclude current user
          q.gte(q.field("nickname"), args.nickname),
          q.lt(q.field("nickname"), args.nickname + "\uffff")
        )
      )
      .take(10); // Limit to 10 results

    return users;
  },
});

export const createUser = mutation({
  args: {
    email: v.string(),
    authId: v.string(),
    nickname: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("user")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();

    if (user) {
      return user;
    }

    return await ctx.db.insert("user", {
      ...args,
      games: [],
      status: "online",
    });
  },
});

export const updateUser = mutation({
  args: {
    avatar: v.optional(v.string()),
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

    const updateData: any = {};
    if (args.avatar !== undefined) {
      updateData.avatar = args.avatar;
    }
    if (args.nickname !== undefined) {
      updateData.nickname = args.nickname;
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

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Get the target user
    const targetUser = await ctx.db.get(args.userId);

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Check if friend request already exists
    const existingRequests = targetUser.friendRequests || [];
    if (existingRequests.includes(currentUser._id)) {
      return; // Already sent a request
    }

    // Add current user to target user's friend requests
    return await ctx.db.patch(args.userId, {
      friendRequests: [...existingRequests, currentUser._id],
    });
  },
});

export const getFriends = query({
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const friendsIds = currentUser.friends;

    if (!friendsIds) return [];

    const friendDocs = await Promise.all(
      friendsIds.map((friendId) => ctx.db.get(friendId))
    );

    return friendDocs.filter(
      (doc): doc is NonNullable<typeof doc> => doc !== null
    );
  },
});

export const getFriendRequests = query({
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const friendRequestsIds = currentUser.friendRequests;

    if (!friendRequestsIds) return [];

    const friendRequestsDocs = await Promise.all(
      friendRequestsIds.map((friendRequestId) => ctx.db.get(friendRequestId))
    );

    return friendRequestsDocs.filter(
      (doc): doc is NonNullable<typeof doc> => doc !== null
    );
  },
});

export const acceptFriendRequest = mutation({
  args: {
    friendRequestId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const targetUser = await ctx.db.get(args.friendRequestId);

    // console.log("\n\n Current user:", currentUser?.nickname);
    // console.log("\nTarget user:", targetUser?.nickname);

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Prepare the updated friends arrays
    const currentUserFriends = currentUser.friends || [];
    const targetUserFriends = targetUser.friends || [];

    // Add each user to the other's friends list (if not already there)
    const updatedCurrentUserFriends = currentUserFriends.includes(
      args.friendRequestId
    )
      ? currentUserFriends
      : [...currentUserFriends, args.friendRequestId];

    const updatedTargetUserFriends = targetUserFriends.includes(currentUser._id)
      ? targetUserFriends
      : [...targetUserFriends, currentUser._id];

    await ctx.db.patch(args.friendRequestId, {
      friends: updatedTargetUserFriends,
      friendRequests: (targetUser.friendRequests || [])?.filter(
        (id) => id !== currentUser._id
      ),
    });

    await ctx.db.patch(currentUser?._id, {
      friends: updatedCurrentUserFriends,
      friendRequests: (currentUser.friendRequests || [])?.filter(
        (id) => id !== args.friendRequestId
      ),
    });

    return true;

    // return await Promise.all([
    //   ctx.db.patch(currentUser._id, {
    //     friends: updatedCurrentUserFriends,
    //     // friendRequests:
    //     //   currentUser.friendRequests?.filter(
    //     //     (id) => id !== args.friendRequestId
    //     //   ) || [],
    //   }),
    //   ctx.db.patch(args.friendRequestId, {
    //     friends: updatedTargetUserFriends,
    //   }),
    // ]);
  },
});

export const rejectFriendRequest = mutation({
  args: {
    friendRequestId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    return await ctx.db.patch(currentUser._id, {
      friendRequests: currentUser.friendRequests?.filter(
        (id) => id !== args.friendRequestId
      ),
    });
  },
});
