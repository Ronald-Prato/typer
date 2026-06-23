import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import {
  assertTypingContentAvailable,
  buildMatchTypingContent,
  getActiveTypingContentPool,
  typingContentKinds,
  type GameMode,
  type TypingContentKind,
} from "./typingContentState";

const MAX_ACTIVE_CONTENT_ITEMS_PER_KIND = 2_000;
const generatedTypingContentValidator = v.object({
  runId: v.string(),
  phrases: v.array(v.string()),
  words: v.array(v.string()),
  characters: v.array(v.string()),
  scrollParagraphs: v.array(v.string()),
});

type ActiveTypingContentRow = {
  kind: TypingContentKind;
  text: string;
  sortOrder: number;
  active: boolean;
};

async function getActiveRowsByKind(
  ctx: { db: any },
  kind: TypingContentKind
): Promise<ActiveTypingContentRow[]> {
  return (await ctx.db
    .query("typingContent")
    .withIndex("by_kind_active_sort_order", (q: any) =>
      q.eq("kind", kind).eq("active", true)
    )
    .order("asc")
    .take(MAX_ACTIVE_CONTENT_ITEMS_PER_KIND)) as ActiveTypingContentRow[];
}

export async function getActiveTypingContentPoolFromDb(ctx: { db: any }) {
  const rowsByKind = await Promise.all(
    typingContentKinds.map((kind) => getActiveRowsByKind(ctx, kind))
  );

  return getActiveTypingContentPool(rowsByKind.flat());
}

export async function assertTypingContentAvailableForMode(
  ctx: { db: any },
  mode: GameMode
) {
  const pool = await getActiveTypingContentPoolFromDb(ctx);
  assertTypingContentAvailable(pool, mode);
}

export async function buildMatchTypingContentFromDb(
  ctx: { db: any },
  mode: GameMode
) {
  const pool = await getActiveTypingContentPoolFromDb(ctx);
  return buildMatchTypingContent(pool, mode);
}

export const getPracticeContent = query({
  handler: async (ctx) => {
    const [phrases, scrollParagraphs] = await Promise.all([
      getActiveRowsByKind(ctx, "practicePhrase"),
      getActiveRowsByKind(ctx, "scrollParagraph"),
    ]);

    return {
      phrases: phrases.map((phrase) => phrase.text),
      scrollParagraphs: scrollParagraphs.map((paragraph) => paragraph.text),
    };
  },
});

function toSourceKey(runId: string, kind: TypingContentKind, index: number) {
  return `openai:${runId}:${kind}:${String(index + 1).padStart(4, "0")}`;
}

async function deactivateActiveContentByKind(
  ctx: { db: any },
  kind: TypingContentKind,
  now: number
) {
  const activeRows = await getActiveRowsByKind(ctx, kind);

  await Promise.all(
    activeRows.map((row: any) =>
      ctx.db.patch(row._id, {
        active: false,
        updatedAt: now,
      })
    )
  );

  return activeRows.length;
}

async function upsertGeneratedRows({
  ctx,
  kind,
  texts,
  runId,
  now,
}: {
  ctx: { db: any };
  kind: TypingContentKind;
  texts: string[];
  runId: string;
  now: number;
}) {
  let inserted = 0;
  let updated = 0;

  for (const [index, text] of texts.entries()) {
    const sourceKey = toSourceKey(runId, kind, index);
    const existing = await ctx.db
      .query("typingContent")
      .withIndex("by_source_key", (q: any) => q.eq("sourceKey", sourceKey))
      .first();
    const row = {
      kind,
      text,
      language: "es" as const,
      sortOrder: index,
      active: true,
      sourceKey,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, row);
      updated += 1;
    } else {
      await ctx.db.insert("typingContent", {
        ...row,
        createdAt: now,
      });
      inserted += 1;
    }
  }

  return { inserted, updated };
}

export const replaceGeneratedContent = internalMutation({
  args: generatedTypingContentValidator,
  handler: async (ctx, args) => {
    const now = Date.now();
    const rowsByKind = {
      practicePhrase: args.phrases,
      classicWord: args.words,
      classicCharacter: args.characters,
      scrollParagraph: args.scrollParagraphs,
    } satisfies Record<TypingContentKind, string[]>;
    const deactivatedByKind: Record<TypingContentKind, number> = {
      practicePhrase: 0,
      classicWord: 0,
      classicCharacter: 0,
      scrollParagraph: 0,
    };
    const insertedByKind: Record<TypingContentKind, number> = {
      practicePhrase: 0,
      classicWord: 0,
      classicCharacter: 0,
      scrollParagraph: 0,
    };
    const updatedByKind: Record<TypingContentKind, number> = {
      practicePhrase: 0,
      classicWord: 0,
      classicCharacter: 0,
      scrollParagraph: 0,
    };

    for (const kind of typingContentKinds) {
      deactivatedByKind[kind] = await deactivateActiveContentByKind(
        ctx,
        kind,
        now
      );
      const result = await upsertGeneratedRows({
        ctx,
        kind,
        texts: rowsByKind[kind],
        runId: args.runId,
        now,
      });
      insertedByKind[kind] = result.inserted;
      updatedByKind[kind] = result.updated;
    }

    return {
      runId: args.runId,
      deactivatedByKind,
      insertedByKind,
      updatedByKind,
      totalInserted: Object.values(insertedByKind).reduce(
        (sum, count) => sum + count,
        0
      ),
      totalUpdated: Object.values(updatedByKind).reduce(
        (sum, count) => sum + count,
        0
      ),
    };
  },
});
