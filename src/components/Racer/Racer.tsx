"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Text } from "../Typography";

interface RacerProps {
  className?: string;
  phrase: string;
  onCompleted?: (data: { errors: number; timeMs: number }) => void;
}

export function Racer({ className = "", phrase, onCompleted }: RacerProps) {
  const [userInput, setUserInput] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [errors, setErrors] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    // Check if completed and call onCompleted with data
    const isComplete =
      userInput.length === phrase.length && userInput === phrase;
    if (isComplete && onCompleted && startTime && !hasCompleted) {
      // Mark as completed first to prevent duplicate calls
      setHasCompleted(true);

      // Clear timer first to get final time
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      onCompleted({
        errors: errors.length,
        timeMs: totalTime,
      });
    }
  }, [userInput, phrase, onCompleted, startTime, errors.length, hasCompleted]);

  useEffect(() => {
    // Focus input when component becomes active
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    // Check for errors when user input changes
    if (userInput.length > 0 && phrase.length > 0) {
      const lastTypedIndex = userInput.length - 1;
      const lastTypedChar = userInput[lastTypedIndex];
      const expectedChar = phrase[lastTypedIndex];

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
  }, [userInput, phrase]);

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

    // Only allow typing if we haven't exceeded the target phrase length
    if (value.length <= phrase.length) {
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
    setIsActive(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getTextVariant = () => {
    if (phrase.split(" ").length <= 15) return "h4";
    if (phrase.split(" ").length <= 25) return "h5";
    return "h6";
  };

  const renderText = () => {
    const textVariant = getTextVariant();

    return phrase.split("").map((char, index) => {
      let colorClass = "";
      let displayChar = char;

      if (index < userInput.length) {
        // User has typed this character
        if (userInput[index] === char) {
          // Correct character - gradient with 3D effect
          colorClass =
            "font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg shadow-orange-500/50";
        } else {
          // Incorrect character - show what user typed in gray-200 with clay effect
          colorClass =
            "text-gray-200 font-bold drop-shadow-md shadow-gray-400/30";
          displayChar = userInput[index];
          // Make spaces visible when they're incorrect
          if (displayChar === " ") {
            displayChar = "␣"; // Use a visible space symbol
          }
        }
      } else if (index === userInput.length) {
        // Current character to type - cursor with glow
        colorClass =
          "text-gray-400 bg-gray-700/50 animate-pulse drop-shadow-lg shadow-gray-400/50 backdrop-blur-sm";
      } else {
        // Not yet typed - sunken clay effect
        colorClass = "text-gray-500 drop-shadow-sm shadow-gray-600/20";
      }

      return (
        <Text
          key={index}
          variant={textVariant as "h4" | "h5" | "h6"}
          className={`font-mono inline transform transition-all duration-200 hover:scale-105 ${colorClass}`}
        >
          {displayChar}
        </Text>
      );
    });
  };

  const accuracy =
    phrase.length > 0 && userInput.length > 0
      ? Math.round(((phrase.length - errors.length) / phrase.length) * 100)
      : 100;

  const isComplete = userInput.length === phrase.length && userInput === phrase;

  const formatTime = (timeMs: number) => {
    const seconds = Math.floor(timeMs / 1000);
    const milliseconds = Math.floor((timeMs % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, "0")}s`;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-8 ${className}`}
    >
      {/* Floating text area with enhanced glass effect */}
      <motion.div
        ref={containerRef}
        onClick={handleContainerClick}
        initial={{
          opacity: 0,
          scale: 0.5,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="relative cursor-text flex items-center justify-center w-full max-w-4xl"
        style={{
          minHeight: "200px",
          height: "200px",
        }}
      >
        <div className="text-center leading-relaxed break-words p-12 w-full">
          {phrase ? (
            renderText()
          ) : (
            <Text variant="body1" className="text-gray-500">
              Cargando frase...
            </Text>
          )}
        </div>

        {/* Hidden input for capturing keystrokes */}
        <input
          ref={inputRef}
          type="text"
          disabled={isComplete}
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="absolute opacity-0 pointer-events-none"
          autoComplete="off"
          spellCheck="false"
        />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
        className="flex space-x-8 text-center"
        style={{
          minHeight: "60px",
          height: "60px",
        }}
      >
        <div className="flex flex-col justify-center min-w-[80px]">
          <Text variant="h6" className="text-orange-500 font-bold">
            {userInput.length}{" "}
          </Text>
          <Text variant="body2" className="text-gray-400">
            Caracteres
          </Text>
        </div>
        <div className="flex flex-col justify-center min-w-[80px]">
          <Text variant="h6" className="text-orange-500 font-bold">
            {accuracy}%{" "}
          </Text>
          <Text variant="body2" className="text-gray-400">
            Precisión
          </Text>
        </div>
        <div className="flex flex-col justify-center min-w-[80px]">
          <Text variant="h6" className="text-red-400 font-bold">
            {userInput.length > 0 ? errors.length : 0}{" "}
          </Text>
          <Text variant="body2" className="text-gray-400">
            Errores
          </Text>
        </div>
        <div className="flex flex-col justify-center min-w-[120px]">
          <Text
            variant="h6"
            className={
              isComplete
                ? "text-green-500"
                : startTime
                  ? "text-blue-400"
                  : "text-gray-500"
            }
          >
            {isComplete
              ? "¡Completado!"
              : startTime
                ? formatTime(currentTime)
                : "0.00s"}
          </Text>
          <Text variant="body2" className="text-gray-400">
            Tiempo
          </Text>
        </div>
      </motion.div>
    </div>
  );
}
