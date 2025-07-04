import { query } from "./_generated/server";
import { getCurrentUser } from "./helpers/getCurrentUser";
import { v } from "convex/values";

export const getGameHistory = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const ownUser = await getCurrentUser(ctx);

    if (!ownUser) {
      throw new Error("Unauthorized");
    }

    const page = args.page || 0;
    const limit = args.limit || 6;
    const offset = page * limit;

    // Get all results first, then slice for pagination
    const allHistory = await ctx.db
      .query("gameHistory")
      .withIndex("by_user_id", (q) => q.eq("userId", ownUser._id))
      .order("desc")
      .collect();

    const totalCount = allHistory.length;
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedHistory = allHistory.slice(startIndex, endIndex);

    return {
      results: paginatedHistory,
      hasMore: endIndex < totalCount,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    };
  },
});
