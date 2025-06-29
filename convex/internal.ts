import OpenAI from "openai";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

import { internalAction } from "./_generated/server";
import { z } from "zod";

const schema = z.object({
  codes: z.array(z.string()),
});

export const createSnippetsAction = internalAction({
  handler: async (ctx) => {
    const response = await generateObject({
      schema,
      model: openai("gpt-4o-mini"),
      prompt: `Create un arreglo de snippets de código de no más de 5 lineas, con un error se sintaxis que esté
      probando que no compile el código. Este debe tener la estructura para que pueda ser colocado
      en un <CodeMirror /> de react-codemirror.`,
    });

    return response.object.codes;
  },
});
