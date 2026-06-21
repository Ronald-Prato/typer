export interface HistoryMetric {
  errors: number;
  timeMs: number;
  accuracy?: number;
  wpm?: number;
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
  userId: string;
  players: string[];
  phrase: string;
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
  createdAt: number;
}

export interface HistoryOpponentSnapshot {
  userId: string;
  nickname: string;
  avatarSeed?: string;
  avatarUrl?: string;
}

export type HistoryFilter = "all" | "wins" | "losses" | "1v1" | "bot";

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
  progress: HistoryGame["progress"],
  userId: string
) {
  const allMetrics = getCompletedHistoryMetrics(progress, userId);
  if (allMetrics.length === 0) {
    return { timeMs: 0, errors: 0, accuracy: 0, wpm: 0 };
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
    getCompletedHistoryMetrics(game.progress, userId ?? game.userId)
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

export function getHistoryOpponent(
  game: HistoryGame
): HistoryOpponentSnapshot | undefined {
  return game.opponentSnapshot ?? game.botProfile;
}

export function formatHistoryTime(timeMs: number) {
  return `${(timeMs / 1000).toFixed(1)}s`;
}

export function formatHistoryWpm(wpm?: number) {
  if (!wpm) return "N/A";
  return `${Math.round(wpm)}`;
}

export function formatHistoryAccuracy(accuracy?: number) {
  if (!accuracy) return "N/A";
  return `${Math.round(accuracy)}%`;
}
