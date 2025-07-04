"use client";

import { motion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Text } from "../Typography";
import { useRacerWords } from "@/hooks/useRacerWords";

interface RacerWordsProps {
  words: string[];
  className?: string;
  hideStats?: boolean;
  hideBullets?: boolean;
  onCompleted?: (data: { errors: number; timeMs: number }) => void;
}

export function RacerWords({
  words,
  onCompleted,
  className = "",
  hideStats = false,
  hideBullets = false,
}: RacerWordsProps) {
  const {
    userInput,
    errors,
    startTime,
    currentTime,
    inputRef,
    containerRef,
    handleInputChange,
    handleKeyDown,
    handlePaste,
    handleContainerClick,
    accuracy,
    formatTime,
    getTextVariant,
    currentWordIndex,
    currentWord,
    totalWords,
    allWordsCompleted,
    isComplete,
  } = useRacerWords({ words, onCompleted });

  const renderText = () => {
    const textVariant = getTextVariant();

    return currentWord.split("").map((char, index) => {
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
        // Current character to type - cursor with improved visibility
        colorClass =
          "text-gray-300 bg-gray-600/70 animate-pulse drop-shadow-lg shadow-gray-400/60 backdrop-blur-sm";
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

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-8 ${className}`}
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
            {Array.from({ length: totalWords }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  allWordsCompleted || index < currentWordIndex
                    ? "bg-green-500" // Completed words
                    : index === currentWordIndex
                      ? "bg-orange-500" // Current word
                      : "bg-gray-600" // Remaining words
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}

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
          {allWordsCompleted ? (
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
          ) : currentWord ? (
            renderText()
          ) : (
            <Text variant="body1" className="text-gray-500">
              Cargando palabras...
            </Text>
          )}
        </div>

        {/* Hidden input for capturing keystrokes */}
        <input
          ref={inputRef}
          type="text"
          disabled={isComplete || allWordsCompleted}
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
      {!hideStats && (
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
          <div className="flex flex-col justify-center min-w-[80px]">
            <Text variant="h6" className="text-blue-500 font-bold">
              {currentWordIndex + 1}/{totalWords}
            </Text>
            <Text variant="body2" className="text-gray-400">
              Palabras
            </Text>
          </div>
        </motion.div>
      )}
    </div>
  );
}
