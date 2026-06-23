import {
  calculateAccuracy,
  calculateWPM,
  getCharacterCount,
  getCharacterCountFromHolds,
  getCharacterCountFromWords,
} from "@/utils/metrics";

export type MatchStageStep = "1" | "2" | "3" | "4";
export type MatchBackendStep =
  | "phrase"
  | "words"
  | "lettersAndSymbols"
  | "holds";

export interface RawTypingMetrics {
  errors: number;
  timeMs: number;
}

export interface ClassicMatchMetrics extends RawTypingMetrics {
  accuracy?: number;
  wpm?: number;
}

export interface ClassicMatchProgressMetrics {
  phraseMetrics?: ClassicMatchMetrics;
  wordsMetrics?: ClassicMatchMetrics;
  lettersAndSymbolsMetrics?: ClassicMatchMetrics;
  holdsMetrics?: ClassicMatchMetrics;
}

export interface MatchStepMetrics extends RawTypingMetrics {
  accuracy: number;
  wpm: number;
}

export interface MatchContent {
  phrase?: string;
  words?: string[];
  lettersAndSymbols?: string[];
  holds?: { word: string; number: number }[];
}

export interface MatchProgressFlags {
  phraseDone?: boolean;
  wordsDone?: boolean;
  lettersAndSymbolsDone?: boolean;
  holdsDone?: boolean;
}

export interface MatchStepSubmission {
  nextStep: MatchStageStep | null;
  payload: {
    step: MatchBackendStep;
    metrics: MatchStepMetrics;
  };
}

export function getAcceptedMatchRoute(mode: string | null | undefined) {
  return mode === "scroll" ? "/scroll" : "/1v1";
}

export function isAcceptedMatchReadyToEnter({
  activeGame,
  players,
  playersAccepted,
  status,
}: {
  activeGame?: string | null;
  players?: string[] | null;
  playersAccepted?: string[] | null;
  status?: string | null;
}) {
  if (!activeGame) return false;
  if (status !== "game_found" && status !== "in_game") return false;
  if (!players?.length || !playersAccepted?.length) return false;

  return players.every((playerId) => playersAccepted.includes(playerId));
}

export function getMatchAcceptCountdownSeconds({
  acceptDeadlineAt,
  now,
}: {
  acceptDeadlineAt?: number | null;
  now: number;
}) {
  if (acceptDeadlineAt === undefined || acceptDeadlineAt === null) return null;
  if (!Number.isFinite(acceptDeadlineAt)) return null;

  return Math.max(0, Math.ceil((acceptDeadlineAt - now) / 1000));
}

export function deriveStepFromProgress(
  progress?: MatchProgressFlags | null
): MatchStageStep {
  if (progress?.lettersAndSymbolsDone) return "4";
  if (progress?.wordsDone) return "3";
  if (progress?.phraseDone) return "2";
  return "1";
}

export function getNextStepSubmission({
  step,
  metrics,
  content,
}: {
  step: MatchStageStep;
  metrics: RawTypingMetrics;
  content: MatchContent;
}): MatchStepSubmission {
  const backendStep = getBackendStep(step);
  const characterCount = getStepCharacterCount(step, content);

  return {
    nextStep: getNextStageStep(step),
    payload: {
      step: backendStep,
      metrics: {
        errors: metrics.errors,
        timeMs: metrics.timeMs,
        accuracy: calculateAccuracy(characterCount, metrics.errors),
        wpm: calculateWPM(characterCount, metrics.timeMs),
      },
    },
  };
}

export function summarizeClassicMatchMetrics(
  progress?: ClassicMatchProgressMetrics | null
) {
  const stageMetrics = [
    progress?.phraseMetrics,
    progress?.wordsMetrics,
    progress?.lettersAndSymbolsMetrics,
    progress?.holdsMetrics,
  ].filter((metrics): metrics is ClassicMatchMetrics => Boolean(metrics));

  const totalTimeMs = stageMetrics.reduce(
    (total, metrics) => total + metrics.timeMs,
    0
  );
  const totalErrors = stageMetrics.reduce(
    (total, metrics) => total + metrics.errors,
    0
  );
  const averageAccuracy =
    stageMetrics.length > 0
      ? Math.round(
          stageMetrics.reduce(
            (total, metrics) => total + (metrics.accuracy ?? 0),
            0
          ) / stageMetrics.length
        )
      : 0;
  const averageWpm =
    stageMetrics.length > 0
      ? Math.round(
          stageMetrics.reduce((total, metrics) => total + (metrics.wpm ?? 0), 0) /
            stageMetrics.length
        )
      : 0;

  return {
    averageAccuracy,
    averageWpm,
    completedStages: stageMetrics.length,
    stageCount: 4,
    totalErrors,
    totalTimeMs,
  };
}

function getBackendStep(step: MatchStageStep): MatchBackendStep {
  if (step === "1") return "phrase";
  if (step === "2") return "words";
  if (step === "3") return "lettersAndSymbols";
  return "holds";
}

function getNextStageStep(step: MatchStageStep): MatchStageStep | null {
  if (step === "1") return "2";
  if (step === "2") return "3";
  if (step === "3") return "4";
  return null;
}

function getStepCharacterCount(
  step: MatchStageStep,
  content: MatchContent
): number {
  if (step === "1") return getCharacterCount(content.phrase ?? "");
  if (step === "2") return getCharacterCountFromWords(content.words ?? []);
  if (step === "3") {
    return getCharacterCountFromWords(content.lettersAndSymbols ?? []);
  }
  return getCharacterCountFromHolds(content.holds ?? []);
}
