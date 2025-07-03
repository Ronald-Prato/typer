import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
