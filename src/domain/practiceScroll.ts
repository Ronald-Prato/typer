export interface PracticeScrollProgress {
  currentIndex: number;
  completed: boolean;
  failed: boolean;
}

export interface PracticeScrollFailureConfig {
  charsPerLine: number;
  lineHeightPx: number;
  startOffsetPx: number;
  dangerLinePx: number;
}

export interface PracticeScrollLine {
  text: string;
  startIndex: number;
  endIndex: number;
}

export interface PracticeScrollMeasuredLine extends PracticeScrollLine {
  topY: number;
  bottomY: number;
}

export function getPracticeScrollText(paragraphs: string[]): string {
  return paragraphs
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join(" ");
}

export function countCompletedPracticeScrollParagraphs(
  paragraphs: string[],
  currentIndex: number
): number {
  let completedParagraphs = 0;
  let nextParagraphEndIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();

    if (!trimmedParagraph) {
      continue;
    }

    nextParagraphEndIndex += trimmedParagraph.length;

    if (currentIndex < nextParagraphEndIndex) {
      return completedParagraphs;
    }

    completedParagraphs += 1;
    nextParagraphEndIndex += 1;
  }

  return completedParagraphs;
}

export function getRandomPracticeScrollParagraphIndex({
  paragraphCount,
  previousIndex,
  random = Math.random,
}: {
  paragraphCount: number;
  previousIndex?: number;
  random?: () => number;
}): number {
  if (paragraphCount <= 0) {
    return 0;
  }

  if (paragraphCount === 1) {
    return 0;
  }

  const randomValue = random();
  const safeRandom = Number.isFinite(randomValue) ? randomValue : 0;
  const boundedRandom = Math.min(Math.max(safeRandom, 0), 0.999999);
  let nextIndex = Math.floor(boundedRandom * paragraphCount);

  if (nextIndex === previousIndex) {
    nextIndex = (nextIndex + 1) % paragraphCount;
  }

  return nextIndex;
}

export function getPracticeScrollDangerLinePx(containerHeightPx: number): number {
  if (!Number.isFinite(containerHeightPx) || containerHeightPx <= 0) {
    return 0;
  }

  return containerHeightPx / 2;
}

export function getPracticeScrollProgress(
  target: string,
  input: string
): PracticeScrollProgress {
  let currentIndex = 0;

  while (
    currentIndex < input.length &&
    currentIndex < target.length &&
    input[currentIndex] === target[currentIndex]
  ) {
    currentIndex += 1;
  }

  return {
    currentIndex,
    completed: currentIndex === target.length,
    failed:
      input.length > currentIndex ||
      input.length > target.length ||
      (input.length > 0 && input[currentIndex - 1] !== target[currentIndex - 1]),
  };
}

export function getPracticeScrollCharacterLine(
  text: string,
  characterIndex: number,
  charsPerLine: number
): number {
  if (charsPerLine <= 0) {
    return 0;
  }

  const boundedIndex = Math.max(0, Math.min(characterIndex, text.length));
  let line = 0;
  let column = 0;

  for (let index = 0; index < boundedIndex; index += 1) {
    const char = text[index];

    if (char === "\n") {
      line += 1;
      column = 0;
      continue;
    }

    column += 1;
    if (column >= charsPerLine) {
      line += 1;
      column = 0;
    }
  }

  return line;
}

export function getPracticeScrollLines(
  text: string,
  charsPerLine: number
): PracticeScrollLine[] {
  if (charsPerLine <= 0) {
    return [{ text, startIndex: 0, endIndex: text.length }];
  }

  const lines: PracticeScrollLine[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = getPracticeScrollLineEndIndex(
      text,
      startIndex,
      charsPerLine
    );

    lines.push({
      text: text.slice(startIndex, endIndex),
      startIndex,
      endIndex,
    });

    startIndex = endIndex;
  }

  return lines;
}

export function getPracticeScrollWordLines(text: string): PracticeScrollLine[] {
  const words = [...text.matchAll(/\S+/g)];

  if (words.length === 0) {
    return text ? [{ text, startIndex: 0, endIndex: text.length }] : [];
  }

  const lines: PracticeScrollLine[] = [];
  let wordIndex = 0;

  while (wordIndex < words.length) {
    const firstWord = words[wordIndex];
    const wordsInLine =
      firstWord[0].replace(/[^\p{L}\p{N}]/gu, "").length % 2 === 0 ? 4 : 3;
    const lastWord =
      words[Math.min(words.length - 1, wordIndex + wordsInLine - 1)];
    const startIndex = firstWord.index;
    const endIndex = lastWord.index + lastWord[0].length;

    lines.push({
      text: text.slice(startIndex, endIndex),
      startIndex,
      endIndex,
    });

    wordIndex += wordsInLine;
  }

  return lines;
}

export function countCompletedPracticeScrollLines(
  lines: PracticeScrollLine[],
  currentIndex: number
): number {
  return lines.filter((line) => currentIndex >= line.endIndex).length;
}

export function getPracticeScrollSpeedPxPerSecond({
  baseSpeedPxPerSecond,
  completedLineCount,
  speedIncrementPxPerSecond = 1,
}: {
  baseSpeedPxPerSecond: number;
  completedLineCount: number;
  speedIncrementPxPerSecond?: number;
}): number {
  const safeBaseSpeed =
    Number.isFinite(baseSpeedPxPerSecond) && baseSpeedPxPerSecond > 0
      ? baseSpeedPxPerSecond
      : 0;
  const safeCompletedLineCount =
    Number.isFinite(completedLineCount) && completedLineCount > 0
      ? Math.floor(completedLineCount)
      : 0;
  const safeIncrement =
    Number.isFinite(speedIncrementPxPerSecond) && speedIncrementPxPerSecond > 0
      ? speedIncrementPxPerSecond
      : 0;

  return safeBaseSpeed + safeCompletedLineCount * safeIncrement;
}

export function shouldAdvancePracticeScroll({
  hasStartedTyping,
  isFinished,
}: {
  hasStartedTyping: boolean;
  isFinished: boolean;
}): boolean {
  return hasStartedTyping && !isFinished;
}

export function hasPracticeScrollMeasuredLineFailed({
  currentIndex,
  laserY,
  lines,
}: {
  currentIndex: number;
  laserY: number;
  lines: PracticeScrollMeasuredLine[];
}): boolean {
  return lines.some(
    (line) =>
      currentIndex < line.endIndex && (line.topY + line.bottomY) / 2 < laserY
  );
}

export function hasPracticeScrollReachedDangerLine(
  text: string,
  currentIndex: number,
  travelPx: number,
  config: PracticeScrollFailureConfig
): boolean {
  if (currentIndex >= text.length) {
    return false;
  }

  const crossedLine = getPracticeScrollCrossedLine(travelPx, config);

  if (crossedLine < 0) {
    return false;
  }

  const crossedLineStartIndex = getPracticeScrollLineStartIndex(
    text,
    crossedLine,
    config.charsPerLine
  );

  if (crossedLineStartIndex >= text.length) {
    return false;
  }

  const crossedLineEndIndex = getPracticeScrollLineEndIndex(
    text,
    crossedLineStartIndex,
    config.charsPerLine
  );

  return currentIndex < crossedLineEndIndex;
}

export function getPracticeScrollCrossedLine(
  travelPx: number,
  config: Pick<
    PracticeScrollFailureConfig,
    "dangerLinePx" | "lineHeightPx" | "startOffsetPx"
  >
): number {
  if (config.lineHeightPx <= 0) {
    return -1;
  }

  return Math.floor(
    (config.dangerLinePx - config.startOffsetPx + travelPx) /
      config.lineHeightPx
  );
}

export function getPracticeScrollLineStartIndex(
  text: string,
  line: number,
  charsPerLine: number
): number {
  if (line <= 0 || charsPerLine <= 0) {
    return 0;
  }

  for (let index = 0; index <= text.length; index += 1) {
    if (getPracticeScrollCharacterLine(text, index, charsPerLine) >= line) {
      return index;
    }
  }

  return text.length;
}

export function getPracticeScrollLineEndIndex(
  text: string,
  characterIndex: number,
  charsPerLine: number
): number {
  if (characterIndex >= text.length) {
    return text.length;
  }

  const targetLine = getPracticeScrollCharacterLine(
    text,
    characterIndex,
    charsPerLine
  );

  for (let index = characterIndex + 1; index <= text.length; index += 1) {
    if (
      index === text.length ||
      getPracticeScrollCharacterLine(text, index, charsPerLine) > targetLine
    ) {
      return index;
    }
  }

  return text.length;
}

export function hasCompletedPracticeScrollLine(
  text: string,
  currentIndex: number,
  charsPerLine: number
): boolean {
  return (
    currentIndex >=
    getPracticeScrollLineEndIndex(text, currentIndex, charsPerLine)
  );
}

export function countCompletedPracticeScrollWords(
  text: string,
  currentIndex: number
): number {
  const completedText = text.slice(0, Math.max(0, currentIndex)).trim();

  if (!completedText) {
    return 0;
  }

  return completedText.split(/\s+/).filter(Boolean).length;
}

export function getAverageBookPagesForWords(wordCount: number): string {
  return (wordCount / 250).toFixed(1);
}
