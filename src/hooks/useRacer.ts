import { useEffect, useState } from "react";
import {
  applyTypingInput,
  createTypingState,
  formatTypingTime,
  getTypingTextVariant,
  type TypingMistake,
  type TypingState,
} from "@/domain/typingEngine";
import { calculateAccuracy } from "@/utils/metrics";
import { useTypingInputSession } from "./useTypingInputSession";

interface UseRacerProps {
  phrase?: string;
  lockOnError?: boolean;
  onCompleted?: (data: { errors: number; timeMs: number }) => void;
}

interface UseRacerReturn {
  // States
  userInput: string;
  isActive: boolean;
  errors: number[];
  mistake: TypingMistake | null;
  startTime: number | null;
  currentTime: number;
  hasCompleted: boolean;

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

export function useRacer({
  phrase,
  onCompleted,
}: UseRacerProps): UseRacerReturn {
  const [isActive, setIsActive] = useState(false);
  const [typingState, setTypingState] = useState<TypingState>(() =>
    createTypingState(phrase || "")
  );

  const targetText = phrase || "";
  const userInput = typingState.input;
  const errors = typingState.errors;
  const mistake = typingState.mistake;
  const startTime = typingState.startedAt;
  const hasCompleted = typingState.hasCompleted;
  const {
    containerRef,
    currentTime,
    handleContainerClick,
    handleKeyDown: handleSessionKeyDown,
    handlePaste,
    inputRef,
    isActive: sessionIsActive,
  } = useTypingInputSession({
    isComplete: hasCompleted,
    startTime,
    resetKey: targetText,
    getCompletionMetrics: () =>
      typingState.startedAt === null
        ? null
        : {
            errors: typingState.errors.length,
            timeMs: typingState.elapsedMs,
          },
    onCompleted,
  });

  useEffect(() => {
    setTypingState(createTypingState(targetText));
  }, [targetText]);

  useEffect(() => {
    setIsActive(sessionIsActive);
  }, [sessionIsActive]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = e.target.value;

    // Don't allow changes if phrase is completed
    if (hasCompleted) {
      return;
    }

    // Only allow typing if we haven't exceeded the target text length
    setTypingState((state) => applyTypingInput(state, value, Date.now()));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    handleSessionKeyDown(event);
  };

  const getTextVariant = (): "h4" | "h5" | "h6" => {
    return getTypingTextVariant(targetText);
  };

  const accuracy =
    targetText.length > 0 && (userInput.length > 0 || errors.length > 0)
      ? calculateAccuracy(targetText.length, errors.length)
      : 100;

  const isComplete = typingState.hasCompleted;

  const formatTime = (timeMs: number) => {
    return formatTypingTime(timeMs);
  };

  return {
    // States
    userInput,
    isActive,
    errors,
    mistake,
    startTime,
    currentTime,
    hasCompleted,

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
