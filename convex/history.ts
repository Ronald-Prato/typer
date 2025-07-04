import { query } from "./_generated/server";
import { getCurrentUser } from "./helpers/getCurrentUser";

export const getGameHistory = query({
  args: {},
  handler: async (ctx) => {
    const ownUser = await getCurrentUser(ctx);

    if (!ownUser) {
      throw new Error("Unauthorized");
    }

    const history = await ctx.db
      .query("gameHistory")
      .withIndex("by_user_id", (q) => q.eq("userId", ownUser._id))
      .order("desc")
      .collect();

    return history;
  },
});
