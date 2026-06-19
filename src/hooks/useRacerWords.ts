import { useEffect, useState } from "react";
import {
  applyTypingSequenceInput,
  createTypingSequenceState,
  formatTypingTime,
  getTypingTextVariant,
  type TypingSequenceState,
} from "@/domain/typingEngine";
import { useTypingInputSession } from "./useTypingInputSession";

interface UseRacerWordsProps {
  words: string[];
  onCompleted?: (data: { errors: number; timeMs: number }) => void;
}

interface UseRacerWordsReturn {
  // States
  userInput: string;
  isActive: boolean;
  errors: number[];
  startTime: number | null;
  currentTime: number;
  hasCompleted: boolean;

  // Word mode specific states
  currentWordIndex: number;
  currentWord: string;
  totalWords: number;
  allWordsCompleted: boolean;

  // Refs
  inputRef: React.RefObject<HTMLInputElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;

  // Handlers
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  handleContainerClick: () => void;

  // Computed values
  accuracy: number;
  isComplete: boolean;

  // Helper functions
  formatTime: (timeMs: number) => string;
  getTextVariant: () => "h4" | "h5" | "h6";
}

export function useRacerWords({
  words,
  onCompleted,
}: UseRacerWordsProps): UseRacerWordsReturn {
  const [isActive, setIsActive] = useState(false);
  const [sequenceState, setSequenceState] = useState<TypingSequenceState>(() =>
    createTypingSequenceState(words)
  );

  const totalWords = words.length;
  const currentWord = sequenceState.current.target;
  const userInput = sequenceState.current.input;
  const errors = sequenceState.current.errors;
  const startTime = sequenceState.startedAt;
  const allWordsCompleted = sequenceState.hasCompleted;
  const {
    containerRef,
    currentTime,
    handleContainerClick,
    handleKeyDown,
    handlePaste,
    inputRef,
    isActive: sessionIsActive,
  } = useTypingInputSession({
    isComplete: allWordsCompleted,
    startTime,
    resetKey: words,
    getCompletionMetrics: () =>
      sequenceState.startedAt === null
        ? null
        : {
            errors: sequenceState.totalErrors,
            timeMs:
              (sequenceState.completedAt ?? Date.now()) -
              sequenceState.startedAt,
          },
    onCompleted,
  });

  useEffect(() => {
    setSequenceState(createTypingSequenceState(words));
  }, [words]);

  useEffect(() => {
    setIsActive(sessionIsActive);
  }, [sessionIsActive]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = e.target.value;

    // Don't allow changes if all words are completed
    if (allWordsCompleted) {
      return;
    }

    setSequenceState((state) =>
      applyTypingSequenceInput(state, value, Date.now())
    );
  };

  const getTextVariant = (): "h4" | "h5" | "h6" => {
    return getTypingTextVariant(currentWord);
  };

  const accuracy =
    currentWord.length > 0 && userInput.length > 0
      ? Math.round(
          ((currentWord.length - errors.length) / currentWord.length) * 100
        )
      : 100;

  const isComplete = allWordsCompleted;

  const formatTime = (timeMs: number) => {
    return formatTypingTime(timeMs);
  };

  return {
    // States
    userInput,
    isActive,
    errors,
    startTime,
    currentTime,
    hasCompleted: allWordsCompleted,

    // Word mode specific states
    currentWordIndex: sequenceState.currentIndex,
    currentWord,
    totalWords,
    allWordsCompleted,

    // Refs
    inputRef,
    containerRef,

    // Handlers
    handleInputChange,
    handleKeyDown,
    handlePaste,
    handleContainerClick,

    // Computed values
    accuracy,
    isComplete,

    // Helper functions
    formatTime,
    getTextVariant,
  };
}
