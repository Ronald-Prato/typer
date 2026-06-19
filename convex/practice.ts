import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getNextHighestPracticeWpm } from "./practiceState";

export const addPractice = mutation({
  args: {
    wpm: v.number(),
    accuracy: v.number(),
    time: v.number(),
    errors: v.number(),
  },
  handler: async (ctx, args) => {
    const clerkUser = await ctx.auth.getUserIdentity();

    if (!clerkUser) {
      throw new Error("User not authenticated");
    }

    const user = await ctx.db
      .query("user")
      .withIndex("by_auth_id", (q) => q.eq("authId", clerkUser?.subject))
      .first();

    if (!user) {
      return null;
    }

    const practice = await ctx.db.insert("practice", {
      user: user._id,
      wpm: args.wpm,
      accuracy: args.accuracy,
      time: args.time,
      errors: args.errors,
      date: Date.now(),
    });

    const nextHighestPracticeWpm = getNextHighestPracticeWpm({
      currentHighestWpm: user.highestPracticeWpm,
      practiceWpm: args.wpm,
    });

    if (nextHighestPracticeWpm !== (user.highestPracticeWpm ?? 0)) {
      await ctx.db.patch(user._id, {
        highestPracticeWpm: nextHighestPracticeWpm,
      });
    }

    return practice;
  },
});
