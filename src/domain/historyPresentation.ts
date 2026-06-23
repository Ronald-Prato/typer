import {
  calculateAccuracy,
  calculateWPM,
  getCharacterCount,
  getCharacterCountFromHolds,
  getCharacterCountFromWords,
} from "@/utils/metrics";

export interface HistoryMetric {
  errors: number;
  timeMs: number;
  accuracy?: number;
  wpm?: number;
}

export interface HistoryScrollProgress {
  currentIndex: number;
  typedWords: number;
  failed: boolean;
  completed: boolean;
  startedAt: number;
  finishedAt?: number;
  errors: number;
}

export interface HistoryProgress {
  phraseMetrics?: HistoryMetric;
  wordsMetrics?: HistoryMetric;
  lettersAndSymbolsMetrics?: HistoryMetric;
  holdsMetrics?: HistoryMetric;
}

export interface HistoryGame {
  _id: string;
  _creationTime: number;
  mode?: "classic" | "scroll";
  userId: string;
  players: string[];
  phrase: string;
  scrollText?: string;
  words: string[];
  holds: Array<{ word: string; number: number }>;
  lettersAndSymbols: string[];
  playersAccepted: string[];
  winner?: string;
  againstBot?: boolean;
  botProfile?: HistoryOpponentSnapshot;
  opponentSnapshot?: HistoryOpponentSnapshot;
  language: "en" | "es";
  progress?: Record<string, HistoryProgress>;
  scrollStartedAt?: number;
  scrollProgress?: Record<string, HistoryScrollProgress>;
  createdAt: number;
}

export interface HistoryOpponentSnapshot {
  userId: string;
  nickname: string;
  avatarSeed?: string;
  avatarUrl?: string;
  highestPracticeWpm?: number;
}

export type HistoryFilter = "all" | "wins" | "losses" | "1v1" | "bot";

export const MATCH_HISTORY_PAGE_SIZE = 5;

export const historyFilters: Array<{ key: HistoryFilter; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "wins", label: "Victorias" },
  { key: "losses", label: "Derrotas" },
  { key: "1v1", label: "1v1" },
  { key: "bot", label: "Bot" },
];

export const historyStageLabels: Array<{
  key: keyof Pick<
    HistoryProgress,
    | "phraseMetrics"
    | "wordsMetrics"
    | "lettersAndSymbolsMetrics"
    | "holdsMetrics"
  >;
  label: string;
}> = [
  { key: "phraseMetrics", label: "Frase" },
  { key: "wordsMetrics", label: "Palabras" },
  { key: "lettersAndSymbolsMetrics", label: "Símbolos" },
  { key: "holdsMetrics", label: "Holds" },
];

export interface HistoryDisplayStat {
  label: string;
  value: string | number;
  emphasis?: boolean;
}

export interface HistoryStageDisplay {
  label: string;
  stats: HistoryDisplayStat[];
}

export function getCompletedHistoryMetrics(
  progress: HistoryGame["progress"],
  userId: string
): HistoryMetric[] {
  const userProgress = progress?.[userId];
  if (!userProgress) return [];

  return [
    userProgress.phraseMetrics,
    userProgress.wordsMetrics,
    userProgress.lettersAndSymbolsMetrics,
    userProgress.holdsMetrics,
  ].filter((metric): metric is HistoryMetric => Boolean(metric));
}

export function calculateHistoryAverageMetrics(
  gameOrProgress: HistoryGame | HistoryGame["progress"],
  userId: string
) {
  if (isHistoryGame(gameOrProgress)) {
    return calculateMetricsAverage(
      getCompletedHistoryMetricsForGame(gameOrProgress, userId)
    );
  }

  return calculateMetricsAverage(
    getCompletedHistoryMetrics(gameOrProgress, userId)
  );
}

function calculateMetricsAverage(allMetrics: HistoryMetric[]) {
  if (allMetrics.length === 0) {
    return { timeMs: 0, errors: 0, accuracy: undefined, wpm: undefined };
  }

  const timeMs = allMetrics.reduce((sum, metric) => sum + metric.timeMs, 0);
  const errors = allMetrics.reduce((sum, metric) => sum + metric.errors, 0);
  const accuracy = Math.round(
    allMetrics.reduce((sum, metric) => sum + (metric.accuracy ?? 0), 0) /
      allMetrics.length
  );
  const wpm = Math.round(
    allMetrics.reduce((sum, metric) => sum + (metric.wpm ?? 0), 0) /
      allMetrics.length
  );

  return { timeMs, errors, accuracy, wpm };
}

function calculateScrollHistoryMetrics(
  game: HistoryGame,
  userId: string
): HistoryMetric | null {
  if (game.mode !== "scroll") return null;

  const progress = game.scrollProgress?.[userId];
  if (!progress) return null;

  const finishedAt = progress.finishedAt ?? game.createdAt;
  const timeMs = Math.max(0, finishedAt - progress.startedAt);
  const typedCharacters = Math.max(0, Math.floor(progress.currentIndex));
  const attemptedCharacters = typedCharacters + Math.max(0, progress.errors);

  return {
    timeMs,
    errors: progress.errors,
    accuracy: calculateAccuracy(attemptedCharacters, progress.errors),
    wpm: calculateWPM(typedCharacters, timeMs),
  };
}

export function filterHistoryGames(
  games: HistoryGame[],
  filter: HistoryFilter,
  userId?: string
) {
  return games.filter((game) => {
    const historyUserId = userId ?? game.userId;
    const isWinner = game.winner === historyUserId;

    if (filter === "wins") return isWinner;
    if (filter === "losses") return !isWinner;
    if (filter === "1v1") return !game.againstBot;
    if (filter === "bot") return Boolean(game.againstBot);

    return true;
  });
}

export function summarizeHistoryPage(
  games: HistoryGame[],
  userId?: string
) {
  if (games.length === 0) {
    return {
      total: 0,
      winRate: 0,
      averageWpm: 0,
      averageAccuracy: 0,
    };
  }

  const wins = games.filter((game) => game.winner === (userId ?? game.userId)).length;
  const allMetrics = games.flatMap((game) =>
    getCompletedHistoryMetricsForGame(game, userId ?? game.userId)
  );

  const averageWpm =
    allMetrics.length > 0
      ? Math.round(
          allMetrics.reduce((sum, metric) => sum + (metric.wpm ?? 0), 0) /
            allMetrics.length
        )
      : 0;
  const averageAccuracy =
    allMetrics.length > 0
      ? Math.round(
          allMetrics.reduce(
            (sum, metric) => sum + (metric.accuracy ?? 0),
            0
          ) / allMetrics.length
        )
      : 0;

  return {
    total: games.length,
    winRate: Math.round((wins / games.length) * 100),
    averageWpm,
    averageAccuracy,
  };
}

export function getHistoryPageCount(totalItems: number, pageSize: number) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const safeTotalItems = Math.max(0, Math.floor(totalItems));

  return Math.max(1, Math.ceil(safeTotalItems / safePageSize));
}

export function clampHistoryPage({
  page,
  pageCount,
}: {
  page: number;
  pageCount: number;
}) {
  const safePageCount = Math.max(1, Math.floor(pageCount));
  const safePage = Number.isFinite(page) ? Math.floor(page) : 1;

  return Math.min(safePageCount, Math.max(1, safePage));
}

export function getHistoryPageItems<TItem>({
  items,
  page,
  pageSize,
}: {
  items: TItem[];
  page: number;
  pageSize: number;
}) {
  const pageCount = getHistoryPageCount(items.length, pageSize);
  const currentPage = clampHistoryPage({ page, pageCount });
  const startIndex = (currentPage - 1) * Math.max(1, Math.floor(pageSize));

  return items.slice(startIndex, startIndex + Math.max(1, Math.floor(pageSize)));
}

export function getHistoryPaginationPages({
  currentPage,
  hasMore,
  loadedItems,
  pageSize,
}: {
  currentPage: number;
  hasMore: boolean;
  loadedItems: number;
  pageSize: number;
}) {
  const loadedPageCount = getHistoryPageCount(loadedItems, pageSize);
  const knownPageCount = hasMore ? loadedPageCount + 1 : loadedPageCount;
  const pageCount = Math.max(1, knownPageCount);
  const safeCurrentPage = clampHistoryPage({ page: currentPage, pageCount });

  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set([
    1,
    pageCount,
    safeCurrentPage - 1,
    safeCurrentPage,
    safeCurrentPage + 1,
  ]);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((a, b) => a - b);
}

export function isHistoryPageLoaded({
  loadedItems,
  page,
  pageSize,
}: {
  loadedItems: number;
  page: number;
  pageSize: number;
}) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const safePage = Math.max(1, Math.floor(page));

  return loadedItems > (safePage - 1) * safePageSize;
}

export function getHistoryPrimaryStats(
  game: HistoryGame,
  userId: string
): HistoryDisplayStat[] {
  const metrics = calculateHistoryAverageMetrics(game, userId);

  if (game.mode === "scroll") {
    const progress = game.scrollProgress?.[userId];

    return [
      { label: "WPM", value: formatHistoryWpm(metrics.wpm), emphasis: true },
      { label: "Palabras", value: progress?.typedWords ?? 0 },
      { label: "Errores", value: metrics.errors },
      { label: "Estado", value: getScrollHistoryStatus(progress) },
    ];
  }

  return [
    { label: "WPM", value: formatHistoryWpm(metrics.wpm), emphasis: true },
    { label: "Tiempo", value: formatHistoryTime(metrics.timeMs) },
    { label: "Errores", value: metrics.errors },
    { label: "Precisión", value: formatHistoryAccuracy(metrics.accuracy) },
  ];
}

export function getHistoryStageStats(
  game: HistoryGame,
  userId: string
): HistoryStageDisplay[] {
  if (game.mode === "scroll") {
    const metrics = calculateHistoryAverageMetrics(game, userId);

    return [
      {
        label: "Scroll",
        stats: [
          { label: "WPM", value: formatHistoryWpm(metrics.wpm), emphasis: true },
          { label: "Tiempo", value: formatHistoryTime(metrics.timeMs) },
          { label: "Precisión", value: formatHistoryAccuracy(metrics.accuracy) },
          { label: "Errores", value: metrics.errors },
        ],
      },
    ];
  }

  return historyStageLabels.map((stage) => {
    const metrics = getHistoryStageMetric(game, userId, stage.key);

    return {
      label: stage.label,
      stats: metrics
        ? [
            {
              label: "WPM",
              value: formatHistoryWpm(metrics.wpm),
              emphasis: true,
            },
            { label: "Tiempo", value: formatHistoryTime(metrics.timeMs) },
            { label: "Errores", value: metrics.errors },
            {
              label: "Precisión",
              value: formatHistoryAccuracy(metrics.accuracy),
            },
          ]
        : [],
    };
  });
}

export function getHistoryOpponent(
  game: HistoryGame
): HistoryOpponentSnapshot | undefined {
  return game.opponentSnapshot ?? game.botProfile;
}

export function formatHistoryTime(timeMs: number) {
  return `${(timeMs / 1000).toFixed(1)}s`;
}

export function formatHistoryWpm(wpm?: number) {
  if (wpm === undefined) return "N/A";
  return `${Math.round(wpm)}`;
}

export function formatHistoryAccuracy(accuracy?: number) {
  if (accuracy === undefined) return "N/A";
  return `${Math.round(accuracy)}%`;
}

function getCompletedHistoryMetricsForGame(
  game: HistoryGame,
  userId: string
): HistoryMetric[] {
  const scrollMetrics = calculateScrollHistoryMetrics(game, userId);
  if (scrollMetrics) return [scrollMetrics];

  return historyStageLabels
    .map((stage) => getHistoryStageMetric(game, userId, stage.key))
    .filter((metric): metric is HistoryMetric => Boolean(metric));
}

function getHistoryStageMetric(
  game: HistoryGame,
  userId: string,
  stage: (typeof historyStageLabels)[number]["key"]
): HistoryMetric | undefined {
  const metrics = game.progress?.[userId]?.[stage];
  if (!metrics) return undefined;

  const characterCount = getHistoryStageCharacterCount(game, stage);

  return {
    ...metrics,
    accuracy:
      metrics.accuracy ?? calculateAccuracy(characterCount, metrics.errors),
    wpm: metrics.wpm ?? calculateWPM(characterCount, metrics.timeMs),
  };
}

function getHistoryStageCharacterCount(
  game: HistoryGame,
  stage: (typeof historyStageLabels)[number]["key"]
) {
  if (stage === "phraseMetrics") return getCharacterCount(game.phrase);
  if (stage === "wordsMetrics") return getCharacterCountFromWords(game.words);
  if (stage === "lettersAndSymbolsMetrics") {
    return getCharacterCountFromWords(game.lettersAndSymbols);
  }

  return getCharacterCountFromHolds(game.holds);
}

function getScrollHistoryStatus(progress?: HistoryScrollProgress) {
  if (!progress) return "Sin datos";
  if (progress.completed) return "Completado";
  if (progress.failed) return "Falló";
  return "Rival terminó";
}

function isHistoryGame(
  gameOrProgress: HistoryGame | HistoryGame["progress"]
): gameOrProgress is HistoryGame {
  return (
    Boolean(gameOrProgress) &&
    typeof gameOrProgress === "object" &&
    "_id" in gameOrProgress
  );
}
