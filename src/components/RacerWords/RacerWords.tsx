"use client";

import { motion } from "@/motion";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Text } from "../Typography";
import { TypingText } from "../TypingText";
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
            <TypingText
              targetText={currentWord}
              userInput={userInput}
              variant={getTextVariant()}
            />
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
