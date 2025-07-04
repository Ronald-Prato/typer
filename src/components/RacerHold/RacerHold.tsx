"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Text } from "../Typography";

interface RacerHoldProps {
  holds: { word: string; number: number }[];
  onSuccess?: (data?: { errors: number; timeMs: number }) => void;
  className?: string;
  hideBullets?: boolean;
}

export function RacerHold({
  holds,
  onSuccess,
  className = "",
  hideBullets = false,
}: RacerHoldProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [errors, setErrors] = useState<number[]>([]);
  const [isKeyPressed, setIsKeyPressed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [completedWords, setCompletedWords] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalErrors, setTotalErrors] = useState(0);
  const totalErrorsRef = useRef(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const keyListenerRef = useRef<boolean>(false);

  const currentWord = holds[currentWordIndex] || "";

  // Auto focus input
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && !isComplete) {
        inputRef.current.focus();
      }
    };

    // Focus immediately and with a small delay to ensure it works
    focusInput();
    const timeoutId = setTimeout(focusInput, 100);

    return () => clearTimeout(timeoutId);
  }, [isComplete, currentWordIndex]);

  // Start timer when first key is pressed
  useEffect(() => {
    if (isKeyPressed && !startTime) {
      setStartTime(Date.now());
    }
  }, [isKeyPressed, startTime]);

  // Maintain focus
  useEffect(() => {
    const handleFocusOut = () => {
      setTimeout(() => {
        if (inputRef.current && !isComplete) {
          inputRef.current.focus();
        }
      }, 10);
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener("blur", handleFocusOut);
      return () => input.removeEventListener("blur", handleFocusOut);
    }
  }, [isComplete]);

  // Keyboard event listeners for number holding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle the specific required key
      if (e.key === currentWord.number.toString() && !e.repeat) {
        console.log("Required key pressed:", currentWord.number); // Debug log
        e.preventDefault(); // Prevent default behavior for the number key
        setIsKeyPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Only handle the specific required key
      if (e.key === currentWord.number.toString()) {
        console.log("Required key released:", currentWord.number); // Debug log
        e.preventDefault(); // Prevent default behavior for the number key
        setIsKeyPressed(false);
        // Reset word when key is released
        if (userInput.length > 0) {
          setUserInput("");
          setErrors([]);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("keyup", handleKeyUp, { capture: true });

    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("keyup", handleKeyUp, { capture: true });
    };
  }, [currentWord.number, userInput.length]);

  // Check for word completion
  useEffect(() => {
    if (userInput === currentWord.word && userInput.length > 0) {
      // Word completed successfully
      setCompletedWords((prev) => prev + 1);
      totalErrorsRef.current += errors.length;

      setTimeout(() => {
        if (currentWordIndex + 1 >= holds.length) {
          // All words completed
          setIsComplete(true);
          if (onSuccess && startTime) {
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            onSuccess({
              errors: totalErrorsRef.current,
              timeMs: totalTime,
            });
          } else {
            onSuccess?.();
          }
        } else {
          // Move to next word and reset key press state
          setCurrentWordIndex((prev) => prev + 1);
          setIsKeyPressed(false); // Reset key press when changing words
          setUserInput(""); // Reset input for the new word
          setErrors([]); // Reset errors for the new word
        }
      }, 500);
    }
  }, [
    userInput,
    currentWord,
    currentWordIndex,
    holds.length,
    onSuccess,
    startTime,
  ]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComplete) return;

    console.log("Input change:", e.target.value, "Key pressed:", isKeyPressed); // Debug log

    if (!isKeyPressed) {
      console.log("Key not pressed, ignoring input"); // Debug log
      return;
    }

    const value = e.target.value;

    // Only allow typing if we haven't exceeded the word length
    if (value.length <= currentWord.word.length) {
      console.log("Setting user input:", value); // Debug log
      setUserInput(value);

      // Check for errors
      if (value.length > 0) {
        const lastCharIndex = value.length - 1;
        const lastChar = value[lastCharIndex];
        const expectedChar = currentWord.word[lastCharIndex];

        if (lastChar !== expectedChar) {
          setErrors((prev) => [...prev, lastCharIndex]);
        }
      }
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
    if (inputRef.current && !isComplete) {
      inputRef.current.focus();
    }
  };

  const renderCurrentWord = () => {
    return currentWord.word.split("").map((char, index) => {
      let colorClass = "";
      let displayChar = char;

      if (index < userInput.length) {
        // User has typed this character
        if (userInput[index] === char) {
          // Correct character - orange-red gradient arcade style
          colorClass =
            "font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg shadow-orange-500/50";
        } else {
          // Incorrect character - white arcade style
          colorClass =
            "text-white font-bold drop-shadow-md shadow-white/50 animate-pulse";
          displayChar = userInput[index];
        }
      } else if (index === userInput.length && isKeyPressed) {
        // Current character to type - orange cursor
        colorClass =
          "text-orange-500 bg-orange-500/20 animate-ping drop-shadow-lg shadow-orange-500/60";
      } else {
        // Not yet typed - dim arcade style
        colorClass = "text-gray-500 drop-shadow-sm";
      }

      return (
        <Text
          key={index}
          variant="h4"
          className={`font-mono inline transform transition-all duration-200 ${colorClass}`}
        >
          {displayChar}
        </Text>
      );
    });
  };

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`flex flex-col items-center justify-center space-y-6 ${className}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="flex flex-col items-center space-y-2"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.05, duration: 0.1 }}
            className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
          >
            <CheckIcon className="w-5 h-5 text-white" />
          </motion.div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.1 }}
          >
            <Text variant="h6" className="text-green-500 font-bold">
              ¡Completado!
            </Text>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-8 ${className}`}
      onClick={handleContainerClick}
    >
      {/* Word Progress Indicator */}
      {!hideBullets && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center"
        >
          <div className="flex space-x-1">
            {Array.from({ length: holds.length }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isComplete || index < completedWords
                    ? "bg-orange-500" // Completed words
                    : index === completedWords
                      ? "bg-orange-500" // Current word
                      : "bg-gray-600" // Remaining words
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Game Box */}
      <motion.div
        key={currentWordIndex}
        initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.6, ease: "backOut" }}
        className="relative"
      >
        {/* Arcade Box */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-4 border-gray-600 p-4 shadow-2xl w-fit min-w-[200px] h-fit">
          {/* Neon Border Effect */}
          <div className="absolute inset-0 rounded-2xl border-2 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.3)] animate-pulse" />

          {/* Number Display */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: isKeyPressed ? 1.1 : 1,
                opacity: isKeyPressed ? 1 : 0.5,
                boxShadow: isKeyPressed
                  ? "0 0 30px rgba(249, 115, 22, 0.5)"
                  : "0 0 10px rgba(249, 115, 22, 0.1)",
              }}
              transition={{ duration: 0.1 }}
              className={`rounded-sm px-4 flex items-center justify-center font-bold text-md border transition-all duration-200 ${
                isKeyPressed
                  ? "bg-orange-500 text-white border-orange-400"
                  : "bg-gray-800 border-gray-100 opacity-50"
              }`}
            >
              {currentWord.number}
            </motion.div>
            <Text variant="caption" className="text-gray-400 opacity-50">
              MANTÉN
            </Text>
          </div>

          {/* Word Display */}
          <div className="text-left mt-2 flex items-center justify-start">
            <div className="leading-relaxed">{renderCurrentWord()}</div>
          </div>

          {/* Status Indicator */}
          {/* <div className="text-center">
            <AnimatePresence mode="wait">
              {!isKeyPressed ? (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Text
                    variant="body2"
                    className="text-orange-400 animate-pulse"
                  >
                    Presiona y mantén el número {requiredKey}
                  </Text>
                </motion.div>
              ) : (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Text variant="body2" className="text-orange-500">
                    ¡Perfecto! Ahora escribe la palabra
                  </Text>
                </motion.div>
              )}
            </AnimatePresence>
          </div> */}
        </div>
      </motion.div>

      {/* Hidden input for capturing keystrokes */}
      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className="absolute opacity-0 w-0 h-0 border-0 outline-none"
        style={{ left: "-9999px" }}
        autoComplete="off"
        spellCheck="false"
        tabIndex={-1}
      />
    </div>
  );
}
