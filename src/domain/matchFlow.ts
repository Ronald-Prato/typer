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
