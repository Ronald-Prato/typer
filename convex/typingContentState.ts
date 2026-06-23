import { getRandomizedPracticeScrollText } from "../src/domain/practiceScroll";

export const typingContentKinds = [
  "practicePhrase",
  "classicWord",
  "classicCharacter",
  "scrollParagraph",
] as const;

export type TypingContentKind = (typeof typingContentKinds)[number];

export type TypingContentSeed = {
  practicePhrases: readonly string[];
  practiceLettersAndSymbols: readonly string[];
  practiceWords: readonly string[];
  practiceScrollParagraphs: readonly string[];
};

export type TypingContentSeedRow = {
  kind: TypingContentKind;
  text: string;
  language: "es";
  sortOrder: number;
  sourceKey: string;
};

export type TypingContentPool = {
  practicePhrase: string[];
  classicWord: string[];
  classicCharacter: string[];
  scrollParagraph: string[];
};

export type MatchTypingContent = {
  phrase: string;
  scrollText?: string;
  words: string[];
  lettersAndSymbols: string[];
  holdsWords: Array<{ word: string; number: number }>;
};

export type GameMode = "classic" | "scroll";

const seedGroups = [
  {
    source: "practicePhrases",
    kind: "practicePhrase",
  },
  {
    source: "practiceWords",
    kind: "classicWord",
  },
  {
    source: "practiceLettersAndSymbols",
    kind: "classicCharacter",
  },
  {
    source: "practiceScrollParagraphs",
    kind: "scrollParagraph",
  },
] as const;

export const emptyTypingContentPool = (): TypingContentPool => ({
  practicePhrase: [],
  classicWord: [],
  classicCharacter: [],
  scrollParagraph: [],
});

export function buildTypingContentSeedRows(
  seed: TypingContentSeed
): TypingContentSeedRow[] {
  return seedGroups.flatMap(({ source, kind }) =>
    seed[source].map((rawText, index) => ({
      kind,
      text: rawText.trim(),
      language: "es" as const,
      sortOrder: index,
      sourceKey: `${kind}:${String(index + 1).padStart(4, "0")}`,
    }))
  );
}

export function getActiveTypingContentPool(
  rows: Array<{
    kind: TypingContentKind;
    text: string;
    sortOrder: number;
    active?: boolean;
  }>
): TypingContentPool {
  const pool = emptyTypingContentPool();

  rows
    .filter((row) => row.active !== false && row.text.trim().length > 0)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((row) => {
      pool[row.kind].push(row.text.trim());
    });

  return pool;
}

export function assertTypingContentAvailable(
  pool: TypingContentPool,
  mode: GameMode
) {
  const missing: string[] = [];

  if (pool.practicePhrase.length === 0) missing.push("frases");
  if (pool.classicWord.length === 0) missing.push("palabras");
  if (pool.classicCharacter.length === 0) missing.push("caracteres");
  if (mode === "scroll" && pool.scrollParagraph.length === 0) {
    missing.push("parrafos scroll");
  }

  if (missing.length > 0) {
    throw new Error(
      `El contenido de typing no esta disponible en Convex: faltan ${missing.join(
        ", "
      )}. Ejecuta migrations:seedTypingContent.`
    );
  }
}

function pickRandomItem<T>(
  items: T[],
  random: () => number,
  label: string
): T {
  if (items.length === 0) {
    throw new Error(`No hay contenido disponible para ${label}.`);
  }

  const randomValue = random();
  const safeRandom = Number.isFinite(randomValue) ? randomValue : 0;
  const boundedRandom = Math.min(Math.max(safeRandom, 0), 0.999999);
  return items[Math.floor(boundedRandom * items.length)];
}

function pickRandomItems<T>(
  items: T[],
  count: number,
  random: () => number,
  label: string
): T[] {
  return Array.from({ length: count }, () =>
    pickRandomItem(items, random, label)
  );
}

export function buildMatchTypingContent(
  pool: TypingContentPool,
  mode: GameMode,
  random: () => number = Math.random
): MatchTypingContent {
  assertTypingContentAvailable(pool, mode);

  const words = pickRandomItems(pool.classicWord, 6, random, "palabras");
  const lettersAndSymbols = pickRandomItems(
    pool.classicCharacter,
    6,
    random,
    "caracteres"
  );
  const holdsWords = pickRandomItems(pool.classicWord, 6, random, "holds").map(
    (word) => ({
      word,
      number: Math.floor(random() * 10),
    })
  );
  const scrollText =
    mode === "scroll"
      ? getRandomizedPracticeScrollText(pool.scrollParagraph, random)
      : undefined;

  if (mode === "scroll" && !scrollText) {
    throw new Error(
      "El contenido de typing no esta disponible en Convex: faltan parrafos scroll. Ejecuta migrations:seedTypingContent."
    );
  }

  return {
    phrase: pickRandomItem(pool.practicePhrase, random, "frases"),
    scrollText,
    words,
    lettersAndSymbols,
    holdsWords,
  };
}
