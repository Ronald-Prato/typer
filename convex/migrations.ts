import { internalMutation } from "./_generated/server";
import { normalizeNicknameSearch } from "./socialState";

export const backfillNicknameSearch = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("user").collect();
    let updated = 0;

    for (const user of users) {
      const nicknameSearch = normalizeNicknameSearch(user.nickname);
      if (user.nicknameSearch === nicknameSearch) continue;

      await ctx.db.patch(user._id, { nicknameSearch });
      updated += 1;
    }

    return { updated };
  },
});
