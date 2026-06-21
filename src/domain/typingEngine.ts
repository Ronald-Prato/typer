export type TypingTextVariant = "h4" | "h5" | "h6";

export interface TypingMetrics {
  errors: number;
  timeMs: number;
}

export interface TypingState {
  target: string;
  input: string;
  errors: number[];
  startedAt: number | null;
  completedAt: number | null;
  hasCompleted: boolean;
  elapsedMs: number;
}

export interface HoldTarget {
  word: string;
  number: number;
}

export interface HoldTypingState {
  holds: HoldTarget[];
  currentIndex: number;
  input: string;
  errors: number[];
  totalErrors: number;
  completedWords: number;
  isRequiredKeyPressed: boolean;
  startedAt: number | null;
  completedAt: number | null;
  hasCompleted: boolean;
  elapsedMs: number;
}

export interface KeyboardLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

export function getTypingSequenceContentKey(targets: string[]): string {
  return JSON.stringify(targets);
}

export function getHoldTypingContentKey(holds: HoldTarget[]): string {
  return JSON.stringify(holds.map((hold) => [hold.word, hold.number]));
}

export function createTypingState(target: string): TypingState {
  return {
    target,
    input: "",
    errors: [],
    startedAt: null,
    completedAt: null,
    hasCompleted: false,
    elapsedMs: 0,
  };
}

export function applyTypingInput(
  state: TypingState,
  nextInput: string,
  now: number
): TypingState {
  if (state.hasCompleted || nextInput.length > state.target.length) {
    return state;
  }

  const startedAt =
    state.startedAt ?? (nextInput.length > 0 ? now : state.startedAt);
  const errors = nextErrorsForInput(state, nextInput);
  const hasCompleted =
    nextInput.length === state.target.length && nextInput === state.target;
  const completedAt = hasCompleted ? state.completedAt ?? now : null;

  return {
    ...state,
    input: nextInput,
    errors,
    startedAt,
    completedAt,
    hasCompleted,
    elapsedMs: startedAt ? (completedAt ?? now) - startedAt : 0,
  };
}

export function resetTypingTarget(target: string): TypingState {
  return createTypingState(target);
}

export interface TypingSequenceState {
  targets: string[];
  currentIndex: number;
  current: TypingState;
  totalErrors: number;
  startedAt: number | null;
  completedAt: number | null;
  hasCompleted: boolean;
}

export function createTypingSequenceState(
  targets: string[]
): TypingSequenceState {
  return {
    targets,
    currentIndex: 0,
    current: createTypingState(targets[0] ?? ""),
    totalErrors: 0,
    startedAt: null,
    completedAt: null,
    hasCompleted: targets.length === 0,
  };
}

export function applyTypingSequenceInput(
  state: TypingSequenceState,
  nextInput: string,
  now: number
): TypingSequenceState {
  if (state.hasCompleted) return state;

  const current = applyTypingInput(state.current, nextInput, now);
  const startedAt = state.startedAt ?? current.startedAt;

  if (!current.hasCompleted) {
    return { ...state, current, startedAt };
  }

  const totalErrors = state.totalErrors + current.errors.length;
  const nextIndex = state.currentIndex + 1;

  if (nextIndex >= state.targets.length) {
    return {
      ...state,
      current,
      totalErrors,
      startedAt,
      completedAt: current.completedAt,
      hasCompleted: true,
    };
  }

  return {
    ...state,
    currentIndex: nextIndex,
    current: createTypingState(state.targets[nextIndex] ?? ""),
    totalErrors,
    startedAt,
  };
}

export function createHoldTypingState(holds: HoldTarget[]): HoldTypingState {
  return {
    holds,
    currentIndex: 0,
    input: "",
    errors: [],
    totalErrors: 0,
    completedWords: 0,
    isRequiredKeyPressed: false,
    startedAt: null,
    completedAt: null,
    hasCompleted: holds.length === 0,
    elapsedMs: 0,
  };
}

export function pressHoldKey(
  state: HoldTypingState,
  key: string,
  now: number
): HoldTypingState {
  const current = getCurrentHold(state);
  if (!current || state.hasCompleted || key !== String(current.number)) {
    return state;
  }

  return {
    ...state,
    isRequiredKeyPressed: true,
    startedAt: state.startedAt ?? now,
  };
}

export function releaseHoldKey(
  state: HoldTypingState,
  key: string
): HoldTypingState {
  const current = getCurrentHold(state);
  if (!current || key !== String(current.number)) {
    return state;
  }

  return {
    ...state,
    input: "",
    errors: [],
    isRequiredKeyPressed: false,
  };
}

export function applyHoldInput(
  state: HoldTypingState,
  nextInput: string,
  now: number
): HoldTypingState {
  const current = getCurrentHold(state);
  if (
    !current ||
    state.hasCompleted ||
    !state.isRequiredKeyPressed ||
    nextInput.length > current.word.length
  ) {
    return state;
  }

  const errors = nextErrorsForTarget(
    current.word,
    state.input,
    state.errors,
    nextInput
  );

  if (nextInput !== current.word) {
    return { ...state, input: nextInput, errors };
  }

  const totalErrors = state.totalErrors + errors.length;
  const nextIndex = state.currentIndex + 1;
  const completedWords = state.completedWords + 1;

  if (nextIndex >= state.holds.length) {
    const startedAt = state.startedAt ?? now;
    return {
      ...state,
      input: nextInput,
      errors,
      totalErrors,
      completedWords,
      completedAt: now,
      hasCompleted: true,
      elapsedMs: now - startedAt,
    };
  }

  return {
    ...state,
    currentIndex: nextIndex,
    input: "",
    errors: [],
    totalErrors,
    completedWords,
    isRequiredKeyPressed: false,
  };
}

export function getCurrentHold(state: HoldTypingState): HoldTarget | null {
  return state.holds[state.currentIndex] ?? null;
}

export function isCopyPasteShortcut(event: KeyboardLike): boolean {
  return (
    Boolean(event.ctrlKey || event.metaKey) &&
    ["c", "v", "x"].includes(event.key.toLowerCase())
  );
}

export function formatTypingTime(timeMs: number): string {
  const seconds = Math.floor(timeMs / 1000);
  const milliseconds = Math.floor((timeMs % 1000) / 10);
  return `${seconds}.${milliseconds.toString().padStart(2, "0")}s`;
}

export function getTypingTextVariant(text: string): TypingTextVariant {
  const wordCount = text.split(" ").length;
  if (wordCount <= 15) return "h4";
  if (wordCount <= 25) return "h5";
  return "h6";
}

function nextErrorsForInput(
  state: TypingState,
  nextInput: string
): number[] {
  return nextErrorsForTarget(
    state.target,
    state.input,
    state.errors,
    nextInput
  );
}

function nextErrorsForTarget(
  target: string,
  previousInput: string,
  previousErrors: number[],
  nextInput: string
): number[] {
  if (nextInput.length <= previousInput.length || nextInput.length === 0) {
    return previousErrors;
  }

  const index = nextInput.length - 1;
  if (nextInput[index] === target[index] || previousErrors.includes(index)) {
    return previousErrors;
  }

  return [...previousErrors, index];
}
