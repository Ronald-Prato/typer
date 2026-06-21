export interface PracticeScrollProgress {
  currentIndex: number;
  completed: boolean;
  failed: boolean;
}

export const PRACTICE_SCROLL_SPEED_PX_PER_SECOND = 12.8;
export const PRACTICE_SCROLL_SPEED_INCREMENT_PX_PER_SECOND = 0.4;

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

export interface ScrollWordBlock {
  text: string;
  startIndex: number;
  endIndex: number;
  width: number;
  completed: boolean;
}

export interface CompetitiveScrollProgress {
  currentIndex: number;
  typedWords: number;
  failed: boolean;
  completed: boolean;
  startedAt: number;
  finishedAt?: number;
  errors: number;
}

export function normalizeCompetitiveScrollProgress({
  currentIndex,
  errors,
  failed = false,
  now,
  previousProgress,
  startedAt,
  text,
}: {
  currentIndex: number;
  errors: number;
  failed?: boolean;
  now: number;
  previousProgress?: CompetitiveScrollProgress;
  startedAt?: number;
  text: string;
}): CompetitiveScrollProgress {
  const safeIndex = Math.max(0, Math.min(Math.floor(currentIndex), text.length));
  const safeErrors = Math.max(0, Math.floor(errors));
  const completed = safeIndex >= text.length && text.length > 0;
  const isFinished = completed || failed;

  return {
    currentIndex: safeIndex,
    typedWords: countCompletedPracticeScrollWords(text, safeIndex),
    failed,
    completed,
    startedAt: previousProgress?.startedAt ?? startedAt ?? now,
    finishedAt: isFinished ? (previousProgress?.finishedAt ?? now) : undefined,
    errors: safeErrors,
  };
}

export function getCompetitiveScrollWinner<TPlayerId extends string>({
  playerIds,
  progressByPlayerId,
}: {
  playerIds: TPlayerId[];
  progressByPlayerId: Partial<Record<TPlayerId, CompetitiveScrollProgress>>;
}): TPlayerId | null {
  const completedPlayer = playerIds.find(
    (playerId) => progressByPlayerId[playerId]?.completed
  );
  if (completedPlayer) return completedPlayer;

  const activePlayers = playerIds.filter(
    (playerId) => !progressByPlayerId[playerId]?.failed
  );

  if (activePlayers.length === 1) {
    return activePlayers[0];
  }

  return null;
}

export function hasCompetitiveScrollStartSignal({
  progressByPlayerId,
  scrollStartedAt,
}: {
  progressByPlayerId?: Partial<Record<string, CompetitiveScrollProgress>>;
  scrollStartedAt?: number;
}): boolean {
  if (typeof scrollStartedAt === "number" && Number.isFinite(scrollStartedAt)) {
    return true;
  }

  return Object.values(progressByPlayerId ?? {}).some(
    (playerProgress) =>
      typeof playerProgress?.startedAt === "number" &&
      Number.isFinite(playerProgress.startedAt)
  );
}

export function getScrollMinimapWordBlocks(
  text: string,
  currentIndex: number
): ScrollWordBlock[] {
  return [...text.matchAll(/\S+/g)].map((match) => {
    const word = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + word.length;

    return {
      text: word,
      startIndex,
      endIndex,
      width: Math.max(10, Math.min(56, word.length * 4)),
      completed: currentIndex >= endIndex,
    };
  });
}

export function getBotScrollIndex({
  charsPerSecond,
  now,
  startedAt,
  textLength,
}: {
  charsPerSecond: number;
  now: number;
  startedAt: number;
  textLength: number;
}): number {
  const elapsedSeconds = Math.max(0, (now - startedAt) / 1000);
  const safeSpeed =
    Number.isFinite(charsPerSecond) && charsPerSecond > 0 ? charsPerSecond : 0;

  return Math.min(textLength, Math.floor(elapsedSeconds * safeSpeed));
}

export function getCompetitiveScrollTravelPx({
  baseSpeedPxPerSecond,
  completedLineCount,
  finishedAt,
  now,
  speedIncrementPxPerSecond = 1,
  startedAt,
}: {
  baseSpeedPxPerSecond: number;
  completedLineCount: number;
  finishedAt?: number;
  now: number;
  speedIncrementPxPerSecond?: number;
  startedAt?: number;
}): number {
  if (startedAt === undefined) {
    return 0;
  }

  const endTime = finishedAt ?? now;
  const elapsedSeconds = Math.max(0, (endTime - startedAt) / 1000);
  const scrollSpeedPxPerSecond = getPracticeScrollSpeedPxPerSecond({
    baseSpeedPxPerSecond,
    completedLineCount,
    speedIncrementPxPerSecond,
  });

  return elapsedSeconds * scrollSpeedPxPerSecond;
}

export function getNextPracticeScrollTravelPx({
  currentTravelPx,
  elapsedMs,
  speedPxPerSecond,
}: {
  currentTravelPx: number;
  elapsedMs: number;
  speedPxPerSecond: number;
}): number {
  const safeCurrentTravelPx =
    Number.isFinite(currentTravelPx) && currentTravelPx > 0
      ? currentTravelPx
      : 0;
  const safeElapsedMs =
    Number.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs : 0;
  const safeSpeedPxPerSecond =
    Number.isFinite(speedPxPerSecond) && speedPxPerSecond > 0
      ? speedPxPerSecond
      : 0;

  return safeCurrentTravelPx + (safeElapsedMs / 1000) * safeSpeedPxPerSecond;
}

export function hasCompetitiveScrollLineFailed({
  currentIndex,
  lines,
  travelPx,
  config,
}: {
  currentIndex: number;
  lines: PracticeScrollLine[];
  travelPx: number;
  config: Pick<
    PracticeScrollFailureConfig,
    "dangerLinePx" | "lineHeightPx" | "startOffsetPx"
  >;
}): boolean {
  const crossedLine = getPracticeScrollCrossedLine(travelPx, config);
  if (crossedLine < 0) return false;

  const line = lines[crossedLine];
  if (!line) return false;

  return currentIndex < line.endIndex;
}

export function getPracticeScrollText(paragraphs: string[]): string {
  return paragraphs
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join(" ");
}

export function getRandomizedPracticeScrollText(
  paragraphs: string[],
  random: () => number = Math.random
): string {
  return getPracticeScrollText(
    getRandomizedPracticeScrollParagraphs(paragraphs, random)
  );
}

export function getRandomizedPracticeScrollParagraphs(
  paragraphs: string[],
  random: () => number = Math.random
): string[] {
  const shuffledParagraphs = paragraphs
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  for (let index = shuffledParagraphs.length - 1; index > 0; index -= 1) {
    const randomValue = random();
    const safeRandom = Number.isFinite(randomValue) ? randomValue : 0;
    const boundedRandom = Math.min(Math.max(safeRandom, 0), 0.999999);
    const swapIndex = Math.floor(boundedRandom * (index + 1));
    const currentParagraph = shuffledParagraphs[index];

    shuffledParagraphs[index] = shuffledParagraphs[swapIndex];
    shuffledParagraphs[swapIndex] = currentParagraph;
  }

  return shuffledParagraphs;
}

export function getRandomizedPracticeScrollParagraphsAfterPrevious({
  paragraphs,
  previousFirstParagraph,
  random = Math.random,
}: {
  paragraphs: string[];
  previousFirstParagraph?: string;
  random?: () => number;
}): string[] {
  const cleanedParagraphs = paragraphs
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (cleanedParagraphs.length <= 1) {
    return cleanedParagraphs;
  }

  const previousIndex =
    previousFirstParagraph === undefined
      ? undefined
      : cleanedParagraphs.indexOf(previousFirstParagraph.trim());
  const firstIndex = getRandomPracticeScrollParagraphIndex({
    paragraphCount: cleanedParagraphs.length,
    previousIndex:
      previousIndex !== undefined && previousIndex >= 0
        ? previousIndex
        : undefined,
    random,
  });
  const firstParagraph = cleanedParagraphs[firstIndex];
  const remainingParagraphs = getRandomizedPracticeScrollParagraphs(
    cleanedParagraphs.filter((_, index) => index !== firstIndex),
    random
  );

  return [firstParagraph, ...remainingParagraphs];
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
  const wordsPerLine = 3;

  if (words.length === 0) {
    return text ? [{ text, startIndex: 0, endIndex: text.length }] : [];
  }

  const lines: PracticeScrollLine[] = [];
  let wordIndex = 0;

  while (wordIndex < words.length) {
    const firstWord = words[wordIndex];
    const lastWord =
      words[Math.min(words.length - 1, wordIndex + wordsPerLine - 1)];
    const startIndex = firstWord.index;
    const endIndex = lastWord.index + lastWord[0].length;

    lines.push({
      text: text.slice(startIndex, endIndex),
      startIndex,
      endIndex,
    });

    wordIndex += wordsPerLine;
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

export function hasPracticeScrollLineReachedDangerLine({
  currentIndex,
  lines,
  travelPx,
  config,
}: {
  currentIndex: number;
  lines: PracticeScrollLine[];
  travelPx: number;
  config: Pick<
    PracticeScrollFailureConfig,
    "dangerLinePx" | "lineHeightPx" | "startOffsetPx"
  >;
}): boolean {
  if (config.lineHeightPx <= 0) {
    return false;
  }

  return lines.some((line, index) => {
    const lineCenterY =
      config.startOffsetPx - travelPx + index * config.lineHeightPx +
      config.lineHeightPx / 2;

    return currentIndex < line.endIndex && lineCenterY < config.dangerLinePx;
  });
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
