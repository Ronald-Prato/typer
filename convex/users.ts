import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update user when they sign in with Clerk
export const createUser = mutation({
  args: {
    authId: v.string(),
    username: v.string(),
    nickname: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("user")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();

    if (user) {
      return user;
    }
    return ctx.db.insert("user", args);
  },
});
