import { z } from "zod";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { api } from "./_generated/api";

// Create or update user when they sign in with Clerk

const schema = z.object({
  snippets: z.array(
    z.object({
      code: z.string(),
      language: z.string(),
      difficulty: z.string(),
    })
  ),
});

export const createSnippet = mutation({
  args: {
    code: v.string(),
    language: v.union(
      v.literal("javascript"),
      v.literal("python"),
      v.literal("java"),
      v.literal("c++"),
      v.literal("c"),
      v.literal("c#"),
      v.literal("typescript"),
      v.literal("sql"),
      v.literal("go"),
      v.literal("php")
    ),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("snippet", args);
  },
});

export const updateSnippet = mutation({
  args: {
    id: v.id("snippet"),
    code: v.optional(v.string()),
    language: v.optional(
      v.union(
        v.literal("javascript"),
        v.literal("python"),
        v.literal("java"),
        v.literal("c++"),
        v.literal("c"),
        v.literal("c#"),
        v.literal("typescript"),
        v.literal("sql"),
        v.literal("go"),
        v.literal("php")
      )
    ),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;

    // Delete undefined fields
    const updateFields = Object.fromEntries(
      Object.entries(fields).filter(([_, v]) => v !== undefined)
    );

    return ctx.db.patch(id, updateFields);
  },
});

export const createSnippetsAction = action({
  handler: async (ctx) => {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await generateObject({
      schema,
      model: openai("gpt-4o-mini"),
      prompt: `Create un arreglo de snippets, con un error de sintaxis que esté
      ocasionando que no compile el código. Este debe tener la estructura para que pueda ser colocado
      en un <CodeMirror /> de react-codemirror.
      
      todos deben ser de dificultad easy, y lenguaje javascript. Debe tener esta structura:
      {
        snippets: [
          {
            code: string, // el código del snippet max 5 lineas
            language: string, // el lenguaje del snippet alguno de estos solamente: javascript, python, java, c++, c, c#, typescript, sql, go, php
            difficulty: "easy" | "medium" | "hard", // la dificultad del snippet
          }
        ]
      }`,
    });

    const snippets = response.object.snippets;

    for (const snippet of snippets) {
      await ctx.runMutation(api.snippets.createSnippet, {
        code: snippet.code,
        language: snippet.language as any,
        difficulty: snippet.difficulty as any,
      });
    }

    return response.object.snippets;
  },
});

export const updateSnippetsScheduled = internalMutation({
  args: {},
  handler: async (ctx) => {
    const snippets = await ctx.db.query("snippet").collect();

    for (const snippet of snippets) {
      await ctx.db.patch(snippet._id, {
        code: snippet.code + "\n// touched by cron ",
      });
    }
  },
});
