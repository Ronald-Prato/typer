import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_COUNTS = {
  phrases: 100,
  words: 200,
  characters: 39,
  scrollParagraphs: 50,
};
const OVERGENERATION_MULTIPLIER = 1.2;

type CliOptions = {
  model: string;
  phrases: number;
  words: number;
  characters: number;
  scrollParagraphs: number;
  dryRun: boolean;
  prod: boolean;
  deploymentName?: string;
  previewName?: string;
};

type GeneratedTypingContent = {
  runId: string;
  phrases: string[];
  words: string[];
  characters: string[];
  scrollParagraphs: string[];
};

type ContentPoolKey = keyof Omit<GeneratedTypingContent, "runId">;

type OpenAiContentSection = "practice" | "classic" | "scroll";

const spinnerFrames = ["-", "\\", "|", "/"];

const practiceResponseSchema = z.object({
  phrases: z.array(z.string()),
});

const classicResponseSchema = z.object({
  words: z.array(z.string()),
  characters: z.array(z.string()),
});

const scrollResponseSchema = z.object({
  scrollParagraphs: z.array(z.string()),
});

class StageLogger {
  private frameIndex = 0;
  private interval: NodeJS.Timeout | null = null;
  private startedAt = 0;
  private text = "";

  start(text: string) {
    this.stopInterval();
    this.text = text;
    this.startedAt = Date.now();

    if (!process.stdout.isTTY) {
      console.log(`[stage] ${text}`);
      return;
    }

    this.render();
    this.interval = setInterval(() => this.render(), 80);
  }

  update(text: string) {
    this.text = text;
    if (!process.stdout.isTTY) {
      console.log(`[stage] ${text}`);
      return;
    }

    this.render();
  }

  succeed(text?: string) {
    this.finish("ok", text ?? this.text);
  }

  fail(text?: string) {
    this.finish("failed", text ?? this.text);
  }

  info(text: string) {
    this.stopInterval();
    if (process.stdout.isTTY) {
      process.stdout.write(`\r\x1b[K`);
    }
    console.log(`[info] ${text}`);
  }

  private finish(status: "ok" | "failed", text: string) {
    const elapsedMs = Date.now() - this.startedAt;
    this.stopInterval();

    if (process.stdout.isTTY) {
      process.stdout.write(`\r\x1b[K`);
    }

    console.log(`[${status}] ${text} (${formatDuration(elapsedMs)})`);
  }

  private render() {
    const frame = spinnerFrames[this.frameIndex % spinnerFrames.length];
    this.frameIndex += 1;
    process.stdout.write(`\r\x1b[K${frame} ${this.text}`);
  }

  private stopInterval() {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

async function runStage<T>(
  logger: StageLogger,
  text: string,
  task: () => Promise<T> | T,
  successText?: (result: T) => string
): Promise<T> {
  logger.start(text);

  try {
    const result = await task();
    logger.succeed(successText ? successText(result) : text);
    return result;
  } catch (error) {
    logger.fail(text);
    throw error;
  }
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;

  return `${(ms / 1000).toFixed(1)}s`;
}

function summarizeTarget(options: CliOptions) {
  if (options.prod) return "production";
  if (options.deploymentName) return `deployment:${options.deploymentName}`;
  if (options.previewName) return `preview:${options.previewName}`;

  return "current deployment";
}

function parseEnvValue(value: string) {
  const trimmedValue = value.trim();
  const quote = trimmedValue[0];

  if (
    (quote === `"` || quote === "'") &&
    trimmedValue[trimmedValue.length - 1] === quote
  ) {
    return trimmedValue.slice(1, -1);
  }

  return trimmedValue;
}

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return { loaded: false, path: envPath };
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  let loadedKeys = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = parseEnvValue(trimmedLine.slice(separatorIndex + 1));

    if (!process.env[key]) {
      process.env[key] = value;
      loadedKeys += 1;
    }
  }

  return { loaded: true, loadedKeys, path: envPath };
}

function readFlagValue(args: string[], flag: string) {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;

  return args[index + 1];
}

function readNumberFlag(
  args: string[],
  flag: string,
  fallback: number
): number {
  const rawValue = readFlagValue(args, flag);
  if (rawValue === undefined) return fallback;

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${flag} debe ser un entero positivo.`);
  }

  return value;
}

function parseCliOptions(): CliOptions {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage:
  OPENAI_API_KEY=sk-... pnpm content:generate [options]

Options:
  --phrases <n>             Number of practice phrases. Default: ${DEFAULT_COUNTS.phrases}
  --words <n>               Number of classic words. Default: ${DEFAULT_COUNTS.words}
  --characters <n>          Number of letters/symbols. Default: ${DEFAULT_COUNTS.characters}
  --scroll-paragraphs <n>   Number of scroll paragraphs. Default: ${DEFAULT_COUNTS.scrollParagraphs}
  --model <model>           OpenAI model. Default: ${DEFAULT_MODEL}
  --dry-run                 Generate and validate, but do not update Convex.
  --prod                    Update the production Convex deployment.
  --deployment-name <name>  Update a specific Convex deployment.
  --preview-name <name>     Update a specific Convex preview deployment.
`);
    process.exit(0);
  }

  return {
    model: readFlagValue(args, "--model") ?? DEFAULT_MODEL,
    phrases: readNumberFlag(args, "--phrases", DEFAULT_COUNTS.phrases),
    words: readNumberFlag(args, "--words", DEFAULT_COUNTS.words),
    characters: readNumberFlag(args, "--characters", DEFAULT_COUNTS.characters),
    scrollParagraphs: readNumberFlag(
      args,
      "--scroll-paragraphs",
      DEFAULT_COUNTS.scrollParagraphs
    ),
    dryRun: args.includes("--dry-run"),
    prod: args.includes("--prod"),
    deploymentName: readFlagValue(args, "--deployment-name"),
    previewName: readFlagValue(args, "--preview-name"),
  };
}

function overgenerateCount(targetCount: number) {
  return Math.ceil(targetCount * OVERGENERATION_MULTIPLIER);
}

function buildPracticeJsonSchema(count: number) {
  return {
    name: "practice_typing_content",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["phrases"],
      properties: {
        phrases: {
          type: "array",
          description: "Spanish typing practice phrases, 8 to 16 words each.",
          minItems: count,
          maxItems: count,
          items: { type: "string" },
        },
      },
    },
  };
}

function buildClassicJsonSchema(wordCount: number, characterCount: number) {
  return {
    name: "classic_typing_content",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["words", "characters"],
      properties: {
        words: {
          type: "array",
          description: "Spanish-friendly single typing words, one token each.",
          minItems: wordCount,
          maxItems: wordCount,
          items: { type: "string" },
        },
        characters: {
          type: "array",
          description:
            "Single-character keyboard entries for letters, numbers, and symbols.",
          minItems: characterCount,
          maxItems: characterCount,
          items: { type: "string" },
        },
      },
    },
  };
}

function buildScrollJsonSchema(count: number) {
  return {
    name: "scroll_typing_content",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["scrollParagraphs"],
      properties: {
        scrollParagraphs: {
          type: "array",
          description: "Long Spanish scroll-mode paragraphs, 75 to 120 words each.",
          minItems: count,
          maxItems: count,
          items: { type: "string" },
        },
      },
    },
  };
}

function buildSharedPromptHeader() {
  return [
    "Genera contenido original en español para un juego de typing llamado typewars.io.",
    "No copies citas, letras de canciones, nombres de personajes, marcas, textos famosos ni fragmentos reconocibles.",
    "Todo debe ser apto para menores, dinámico, claro y variado.",
    "El contenido se usará directamente como snapshots de partidas competitivas y práctica.",
    "Evita duplicados dentro de la misma respuesta.",
  ];
}

function buildPracticePrompt(count: number, targetCount: number) {
  return [
    ...buildSharedPromptHeader(),
    "",
    `Genera exactamente ${count} frases candidatas para aceptar ${targetCount} frases de práctica.`,
    "- Cada frase debe tener entre 8 y 16 palabras.",
    "- Sin punto final, comillas, saltos de línea ni dos frases unidas por punto.",
    "- Deben sonar energéticas y naturales, no como placeholders.",
    "- Varía temas: ciudad, concentración, velocidad, exploración, entrenamiento y humor ligero.",
    "",
    "Devuelve únicamente el JSON que cumple el schema.",
  ].join("\n");
}

function buildClassicPrompt(
  wordCount: number,
  targetWordCount: number,
  characterCount: number
) {
  return [
    ...buildSharedPromptHeader(),
    "",
    `Genera exactamente ${wordCount} palabras candidatas para aceptar ${targetWordCount} palabras clásicas.`,
    "- Cada palabra debe ser una sola palabra.",
    "- Usa minúsculas, sin espacios, sin guiones, sin URLs y sin puntuación.",
    "- Mezcla palabras cortas, medias y largas.",
    "- Evita palabras inventadas raras, nombres propios y extranjerismos innecesarios.",
    "",
    `Genera exactamente ${characterCount} caracteres para rounds de letras y símbolos.`,
    "- Cada caracter debe ser exactamente un caracter visible de teclado.",
    "- Incluye letras minúsculas, números y símbolos comunes.",
    "- No uses espacios, emojis, caracteres invisibles, acentos combinados ni strings de varios caracteres.",
    "",
    "Devuelve únicamente el JSON que cumple el schema.",
  ].join("\n");
}

function buildScrollPrompt(count: number, targetCount: number) {
  return [
    ...buildSharedPromptHeader(),
    "",
    `Genera exactamente ${count} párrafos candidatos para aceptar ${targetCount} párrafos de scroll.`,
    "- Cada párrafo debe tener entre 75 y 120 palabras.",
    "- Usa una sola string por párrafo, sin saltos de línea.",
    "- Estilo aventura, tecnología, entrenamiento mental, ciudad, exploración o humor ligero.",
    "- Evita nombres propios famosos, referencias protegidas y comillas.",
    "",
    "Devuelve únicamente el JSON que cumple el schema.",
  ].join("\n");
}

function normalizeTextList(items: string[]) {
  return items
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function normalizeWordList(items: string[]) {
  return normalizeTextList(items)
    .map((item) => item.toLocaleLowerCase("es-CO"))
    .filter((item) => !/\s/.test(item));
}

function normalizeCharacterList(items: string[]) {
  return items
    .map((item) => item.trim())
    .filter((item) => Array.from(item).length === 1);
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function takeExpectedItems(
  key: ContentPoolKey,
  items: string[],
  expectedCount: number
) {
  const acceptedItems = items.slice(0, expectedCount);
  if (acceptedItems.length !== expectedCount) {
    throw new Error(
      `OpenAI genero ${items.length} items validos y unicos para ${key}; se esperaban ${expectedCount}. Vuelve a correr el script.`
    );
  }

  return acceptedItems;
}

function parseOpenAiJson(content: string, section: OpenAiContentSection) {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(
      `OpenAI devolvio JSON invalido para ${section}. Vuelve a correr el script. Detalle: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function requestOpenAiStructuredContent(
  options: CliOptions,
  section: OpenAiContentSection,
  prompt: string,
  jsonSchema: unknown,
  maxTokens: number
): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta OPENAI_API_KEY en el entorno.");
  }

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      temperature: 0.9,
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content:
            "Eres un generador de contenido original para juegos de typing. Cumple exactamente el schema y devuelve solamente JSON valido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: jsonSchema,
      },
    }),
  });

  const payload = (await response.json()) as any;
  if (!response.ok) {
    throw new Error(
      `OpenAI respondio ${response.status}: ${JSON.stringify(payload)}`
    );
  }

  const message = payload.choices?.[0]?.message;
  if (message?.refusal) {
    throw new Error(`OpenAI rechazo la solicitud: ${message.refusal}`);
  }

  const content = message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI no devolvio contenido JSON parseable.");
  }

  return parseOpenAiJson(content, section);
}

async function generateContent(
  logger: StageLogger,
  options: CliOptions
): Promise<GeneratedTypingContent> {
  const phraseCandidateCount = overgenerateCount(options.phrases);
  const wordCandidateCount = overgenerateCount(options.words);
  const scrollCandidateCount = overgenerateCount(options.scrollParagraphs);
  logger.start("Calling 3 OpenAI Chat Completions in parallel");
  let practicePayload: unknown;
  let classicPayload: unknown;
  let scrollPayload: unknown;

  try {
    [practicePayload, classicPayload, scrollPayload] = await Promise.all([
      requestOpenAiStructuredContent(
        options,
        "practice",
        buildPracticePrompt(phraseCandidateCount, options.phrases),
        buildPracticeJsonSchema(phraseCandidateCount),
        6_000
      ),
      requestOpenAiStructuredContent(
        options,
        "classic",
        buildClassicPrompt(
          wordCandidateCount,
          options.words,
          options.characters
        ),
        buildClassicJsonSchema(wordCandidateCount, options.characters),
        8_000
      ),
      requestOpenAiStructuredContent(
        options,
        "scroll",
        buildScrollPrompt(scrollCandidateCount, options.scrollParagraphs),
        buildScrollJsonSchema(scrollCandidateCount),
        16_000
      ),
    ]);
    logger.succeed("Received 3 structured OpenAI responses");
  } catch (error) {
    logger.fail("Failed calling 3 OpenAI Chat Completions in parallel");
    throw error;
  }

  const practice = practiceResponseSchema.parse(practicePayload);
  const classic = classicResponseSchema.parse(classicPayload);
  const scroll = scrollResponseSchema.parse(scrollPayload);
  const phrases = takeExpectedItems(
    "phrases",
    unique(normalizeTextList(practice.phrases)),
    options.phrases
  );
  const words = takeExpectedItems(
    "words",
    unique(normalizeWordList(classic.words)),
    options.words
  );
  const characters = takeExpectedItems(
    "characters",
    unique(normalizeCharacterList(classic.characters)),
    options.characters
  );
  const scrollParagraphs = takeExpectedItems(
    "scrollParagraphs",
    unique(normalizeTextList(scroll.scrollParagraphs)),
    options.scrollParagraphs
  );

  return {
    runId: new Date().toISOString().replace(/[:.]/g, "-"),
    phrases,
    words,
    characters,
    scrollParagraphs,
  };
}

function runCommand(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    const outputChunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];

    child.stdout?.on("data", (chunk: Buffer) => {
      outputChunks.push(chunk);
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      errorChunks.push(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      const output = Buffer.concat(outputChunks).toString("utf8").trim();
      const errorOutput = Buffer.concat(errorChunks).toString("utf8").trim();

      if (code === 0) {
        resolve(output);
      } else {
        reject(
          new Error(
            [
              `${command} exec convex run typingContent:replaceGeneratedContent salio con codigo ${code}`,
              output && `stdout:\n${output}`,
              errorOutput && `stderr:\n${errorOutput}`,
            ]
              .filter(Boolean)
              .join("\n\n")
          )
        );
      }
    });
  });
}

async function replaceConvexContent(
  content: GeneratedTypingContent,
  options: CliOptions
) {
  const args = [
    "exec",
    "convex",
    "run",
    "typingContent:replaceGeneratedContent",
    "--push",
  ];

  if (options.prod) args.push("--prod");
  if (options.deploymentName) {
    args.push("--deployment-name", options.deploymentName);
  }
  if (options.previewName) {
    args.push("--preview-name", options.previewName);
  }

  args.push(JSON.stringify(content));
  return await runCommand("pnpm", args);
}

async function main() {
  const logger = new StageLogger();
  const options = parseCliOptions();
  logger.info(
    `Generating typing content with ${options.model}: ${options.phrases} phrases, ${options.words} words, ${options.characters} characters, ${options.scrollParagraphs} scroll paragraphs.`
  );
  logger.info(`Convex target: ${summarizeTarget(options)}.`);

  const envResult = await runStage(logger, "Loading local environment", () =>
    loadLocalEnv()
  );
  if (envResult.loaded) {
    logger.info(`Loaded .env.local (${envResult.loadedKeys} new keys).`);
  } else {
    logger.info(".env.local not found; using current shell environment.");
  }

  const content = await generateContent(logger, options);
  logger.info(
    `Validated ${content.phrases.length} phrases, ${content.words.length} words, ${content.characters.length} characters, ${content.scrollParagraphs.length} scroll paragraphs.`
  );
  const summary = {
    runId: content.runId,
    phrases: content.phrases.length,
    words: content.words.length,
    characters: content.characters.length,
    scrollParagraphs: content.scrollParagraphs.length,
  };

  logger.info(`Generated typing content run ${summary.runId}.`);

  if (options.dryRun) {
    logger.info("Dry run enabled; Convex was not updated.");
    return;
  }

  await runStage(
    logger,
    "Replacing active Convex typing content",
    () => replaceConvexContent(content, options),
    (result) => `Convex typing content replaced: ${result || "ok"}`
  );
  logger.info("Done. The next matches will use the new active content.");
}

main().catch((error) => {
  if (process.stdout.isTTY) {
    process.stdout.write(`\r\x1b[K`);
  }
  console.error(error);
  process.exit(1);
});
