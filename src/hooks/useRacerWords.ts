import { useState, useEffect, useRef } from "react";

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
  const [userInput, setUserInput] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [errors, setErrors] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [allWordsCompleted, setAllWordsCompleted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalWords = words.length;
  const currentWord = words[currentWordIndex] || "";

  useEffect(() => {
    // Reset for new words
    setUserInput("");
    setErrors([]);
    setStartTime(null);
    setCurrentTime(0);
    setHasCompleted(false);
    setCurrentWordIndex(0);
    setAllWordsCompleted(false);

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Auto focus on mount
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        setIsActive(true);
      }
    }, 300);
  }, [words]);

  useEffect(() => {
    // Check if current word is completed
    const isCurrentComplete =
      userInput.length === currentWord.length && userInput === currentWord;

    if (isCurrentComplete && !allWordsCompleted) {
      if (currentWordIndex < totalWords - 1) {
        // Move to next word
        setTimeout(() => {
          setCurrentWordIndex((prev) => prev + 1);
          setUserInput("");
        }, 150);
      } else {
        // All done - set completion state immediately
        setAllWordsCompleted(true);
        setHasCompleted(true);

        // Call onCompleted if provided
        if (onCompleted && startTime) {
          // Clear timer first to get final time
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          const endTime = Date.now();
          const totalTime = endTime - startTime;

          // Small delay to allow state to update
          setTimeout(() => {
            onCompleted({
              errors: errors.length,
              timeMs: totalTime,
            });
          }, 100);
        }
      }
    }
  }, [
    userInput,
    currentWord,
    currentWordIndex,
    totalWords,
    onCompleted,
    startTime,
    errors.length,
    hasCompleted,
    allWordsCompleted,
  ]);

  useEffect(() => {
    // Focus input when component becomes active
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Effect to maintain focus when changing words
  useEffect(() => {
    if (inputRef.current && !hasCompleted && !allWordsCompleted) {
      // Use a shorter timeout to quickly refocus after word change
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [currentWordIndex, hasCompleted, allWordsCompleted]);

  // Effect to maintain focus always
  useEffect(() => {
    const handleFocusOut = () => {
      // Re-focus the input immediately for word changes
      setTimeout(() => {
        if (inputRef.current && !hasCompleted && !allWordsCompleted) {
          inputRef.current.focus();
        }
      }, 5);
    };

    const handleClickAnywhere = () => {
      // Always focus the input when clicking anywhere
      if (inputRef.current && !hasCompleted && !allWordsCompleted) {
        inputRef.current.focus();
      }
    };

    // Add event listeners to maintain focus
    if (inputRef.current) {
      inputRef.current.addEventListener("blur", handleFocusOut);
    }

    document.addEventListener("click", handleClickAnywhere);
    document.addEventListener("mousedown", handleClickAnywhere);

    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener("blur", handleFocusOut);
      }
      document.removeEventListener("click", handleClickAnywhere);
      document.removeEventListener("mousedown", handleClickAnywhere);
    };
  }, [hasCompleted, allWordsCompleted]);

  useEffect(() => {
    // Reset errors when target text changes
    if (userInput === "") {
      setErrors([]);
      return;
    }

    // Check for errors when user input changes
    if (userInput.length > 0 && currentWord.length > 0) {
      const lastTypedIndex = userInput.length - 1;
      const lastTypedChar = userInput[lastTypedIndex];
      const expectedChar = currentWord[lastTypedIndex];

      // If this is a new character (input got longer) and it's wrong
      if (lastTypedChar !== expectedChar) {
        // Check if we haven't already recorded this error for this position
        const previousInput = userInput.slice(0, -1);
        if (previousInput.length === lastTypedIndex) {
          // This is a new character, record the error
          setErrors((prev) => [...prev, 1]);
        }
      }
    }
  }, [userInput, currentWord]);

  // Effect to start timer when first character is typed
  useEffect(() => {
    if (userInput.length === 1 && !startTime) {
      setStartTime(Date.now());
    }
  }, [userInput.length, startTime]);

  // Effect to manage timer
  useEffect(() => {
    if (!startTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      setCurrentTime(elapsed);
    };

    // Start the timer
    timerRef.current = setInterval(updateTimer, 100);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [startTime]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = e.target.value;

    // Don't allow changes if all words are completed
    if (allWordsCompleted) {
      return;
    }

    // Only allow typing if we haven't exceeded the current word length
    if (value.length <= currentWord.length) {
      setUserInput(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent copy/paste operations
    if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x")) {
      e.preventDefault();
      return;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleContainerClick = () => {
    // Don't activate if all words are completed
    if (allWordsCompleted) {
      return;
    }

    setIsActive(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getTextVariant = (): "h4" | "h5" | "h6" => {
    if (currentWord.split(" ").length <= 15) return "h4";
    if (currentWord.split(" ").length <= 25) return "h5";
    return "h6";
  };

  const accuracy =
    currentWord.length > 0 && userInput.length > 0
      ? Math.round(
          ((currentWord.length - errors.length) / currentWord.length) * 100
        )
      : 100;

  const isComplete = allWordsCompleted;

  const formatTime = (timeMs: number) => {
    const seconds = Math.floor(timeMs / 1000);
    const milliseconds = Math.floor((timeMs % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, "0")}s`;
  };

  return {
    // States
    userInput,
    isActive,
    errors,
    startTime,
    currentTime,
    hasCompleted,

    // Word mode specific states
    currentWordIndex,
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
