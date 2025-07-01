import { useState, useEffect, useRef } from "react";

interface UseRacerProps {
  phrase?: string;
  onCompleted?: (data: { errors: number; timeMs: number }) => void;
}

interface UseRacerReturn {
  // States
  userInput: string;
  isActive: boolean;
  errors: number[];
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
  const [userInput, setUserInput] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [errors, setErrors] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const targetText = phrase || "";

  useEffect(() => {
    // Reset for new phrase
    setUserInput("");
    setErrors([]);
    setStartTime(null);
    setCurrentTime(0);
    setHasCompleted(false);

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
    }, 300); // Wait for animation to complete
  }, [phrase]);

  useEffect(() => {
    // Check if phrase is completed
    const isComplete =
      userInput.length === targetText.length && userInput === targetText;

    if (isComplete && !hasCompleted) {
      // Phrase completed - set completion state immediately
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
  }, [
    userInput,
    targetText,
    onCompleted,
    startTime,
    errors.length,
    hasCompleted,
  ]);

  useEffect(() => {
    // Focus input when component becomes active
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Effect to maintain focus
  useEffect(() => {
    if (inputRef.current && !hasCompleted) {
      // Use a shorter timeout to quickly refocus
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [hasCompleted]);

  // Effect to maintain focus always
  useEffect(() => {
    const handleFocusOut = () => {
      // Re-focus the input with small delay
      setTimeout(() => {
        if (inputRef.current && !hasCompleted) {
          inputRef.current.focus();
        }
      }, 10);
    };

    const handleClickAnywhere = () => {
      // Always focus the input when clicking anywhere
      if (inputRef.current && !hasCompleted) {
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
  }, [hasCompleted]);

  useEffect(() => {
    // Reset errors when target text changes
    if (userInput === "") {
      setErrors([]);
      return;
    }

    // Check for errors when user input changes
    if (userInput.length > 0 && targetText.length > 0) {
      const lastTypedIndex = userInput.length - 1;
      const lastTypedChar = userInput[lastTypedIndex];
      const expectedChar = targetText[lastTypedIndex];

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
  }, [userInput, targetText]);

  // Effect to start timer when first character is typed
  useEffect(() => {
    if (userInput.length === 1 && !startTime) {
      setStartTime(Date.now());
    }
  }, [userInput.length, startTime]);

  // Effect to manage timer - only depends on startTime and completion status
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
  }, [startTime]); // Only depend on startTime, not userInput or phrase

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

    // Don't allow changes if phrase is completed
    if (hasCompleted) {
      return;
    }

    // Only allow typing if we haven't exceeded the target text length
    if (value.length <= targetText.length) {
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
    // Don't activate if phrase is completed
    if (hasCompleted) {
      return;
    }

    setIsActive(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getTextVariant = (): "h4" | "h5" | "h6" => {
    if (targetText.split(" ").length <= 15) return "h4";
    if (targetText.split(" ").length <= 25) return "h5";
    return "h6";
  };

  const accuracy =
    targetText.length > 0 && userInput.length > 0
      ? Math.round(
          ((targetText.length - errors.length) / targetText.length) * 100
        )
      : 100;

  const isComplete =
    userInput.length === targetText.length && userInput === targetText;

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
