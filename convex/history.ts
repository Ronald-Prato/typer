import { query } from "./_generated/server";
import { getCurrentUserOrNull } from "./helpers/getCurrentUser";
import { paginationOptsValidator } from "convex/server";
import { normalizeHistoryPageSize } from "./historyPagination";

export const getGameHistory = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const ownUser = await getCurrentUserOrNull(ctx);

    if (!ownUser) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const pageSize = normalizeHistoryPageSize(args.paginationOpts.numItems);

    const query = ctx.db
      .query("gameHistory")
      .withIndex("by_user_created_at", (q) => q.eq("userId", ownUser._id))
      .order("desc");

    return await query.paginate({
      numItems: pageSize,
      cursor: args.paginationOpts.cursor,
    });
  },
});
