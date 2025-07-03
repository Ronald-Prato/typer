import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./helpers/getCurrentUser";

// export const acceptGame = mutation({
//   args: {
//     gameId: v.id("game"),
//   },
//   handler: async (ctx, args) => {
//     const game = await ctx.db.get(args.gameId);
//   },
// });

export const rejectGame = mutation({
  args: {
    gameId: v.id("game"),
  },
  handler: async (ctx, args) => {
    const ownUser = await getCurrentUser(ctx);

    const game = await ctx.db.get(args.gameId);

    if (!game) {
      throw new Error("Game not found");
    }

    await ctx.db.patch(args.gameId, {
      players: game.players.filter((player) => player !== ownUser?._id),
    });

    await ctx.db.patch(ownUser?._id, {
      activeGame: undefined,
    });
  },
});
