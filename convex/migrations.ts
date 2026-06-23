import { internalMutation } from "./_generated/server";
import { normalizeNicknameSearch } from "./socialState";
import { typingContentSeed } from "./typingContentSeed";
import { buildTypingContentSeedRows } from "./typingContentState";

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

export const seedTypingContent = internalMutation({
  handler: async (ctx) => {
    const rows = buildTypingContentSeedRows(typingContentSeed);
    const now = Date.now();
    const result = {
      inserted: 0,
      updated: 0,
      unchanged: 0,
      total: rows.length,
    };

    for (const row of rows) {
      const existing = await ctx.db
        .query("typingContent")
        .withIndex("by_source_key", (q) => q.eq("sourceKey", row.sourceKey))
        .first();

      if (!existing) {
        await ctx.db.insert("typingContent", {
          ...row,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
        result.inserted += 1;
        continue;
      }

      const patch =
        existing.kind !== row.kind ||
        existing.text !== row.text ||
        existing.language !== row.language ||
        existing.sortOrder !== row.sortOrder
          ? {
              kind: row.kind,
              text: row.text,
              language: row.language,
              sortOrder: row.sortOrder,
              updatedAt: now,
            }
          : null;

      if (patch) {
        await ctx.db.patch(existing._id, patch);
        result.updated += 1;
      } else {
        result.unchanged += 1;
      }
    }

    return result;
  },
});
