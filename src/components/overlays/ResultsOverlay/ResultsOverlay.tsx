"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Text } from "@/components/Typography";
import {
  TrophyIcon,
  ClockIcon,
  BoltIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useEffect } from "react";

interface RoundData {
  phrase: string;
  errors: number;
  timeMs: number;
  accuracy: number;
  wpm: number;
}

interface ResultsOverlayProps {
  isVisible: boolean;
  roundsData: RoundData[];
  onClose: () => void;
}

export function ResultsOverlay({
  isVisible,
  roundsData,
  onClose,
}: ResultsOverlayProps) {
  // Calculate statistics
  const totalRounds = roundsData.length;
  const totalTime = roundsData.reduce((sum, round) => sum + round.timeMs, 0);
  const averageTime = totalTime / totalRounds;
  const averageErrors =
    roundsData.reduce((sum, round) => sum + round.errors, 0) / totalRounds;
  const averageAccuracy =
    roundsData.reduce((sum, round) => sum + round.accuracy, 0) / totalRounds;
  const averageWpm =
    roundsData.reduce((sum, round) => sum + round.wpm, 0) / totalRounds;
  const bestTime = Math.min(...roundsData.map((round) => round.timeMs));
  const bestWpm = Math.max(...roundsData.map((round) => round.wpm));

  const formatTime = (timeMs: number) => {
    const seconds = Math.floor(timeMs / 1000);
    const milliseconds = Math.floor((timeMs % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, "0")}s`;
  };

  // Listen for Enter key
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-gray-950/80"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="relative bg-gradient-to-br from-gray-800/60 via-gray-900/40 to-black/60 backdrop-blur-2xl border-2 border-orange-500/30 rounded-3xl p-8 shadow-2xl max-w-2xl w-full mx-4"
            style={{
              boxShadow: `
                0 0 60px rgba(234, 88, 12, 0.3),
                0 32px 64px rgba(0, 0, 0, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2)
              `,
            }}
          >
            {/* Border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 rounded-3xl pointer-events-none" />

            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative z-10 text-center mb-8"
            >
              <Text
                variant="h5"
                className="font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-2xl"
              >
                PRÁCTICA COMPLETADA
              </Text>
            </motion.div>

            {/* Main WPM Display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="relative z-10 text-center mb-8 flex flex-col items-center"
            >
              <BoltIcon className="w-12 h-12 text-green-400" />
              <div className="flex items-end gap-2 ">
                <Text variant="h1" className="text-green-300 ">
                  {Math.round(averageWpm)}
                </Text>
                <Text
                  variant="h5"
                  className="text-green-400 font-bold pb-2 m-0"
                >
                  WPM
                </Text>
              </div>
            </motion.div>

            {/* Secondary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="relative z-10 grid grid-cols-3 gap-6 mb-8"
            >
              {/* Average Time */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <ClockIcon className="w-6 h-6 text-blue-400 mr-2" />
                  <Text variant="body2" className="text-blue-200 font-medium">
                    Tiempo
                  </Text>
                </div>
                <Text variant="h5" className="text-blue-300 font-bold">
                  {formatTime(averageTime)}
                </Text>
              </div>

              {/* Average Accuracy */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <SparklesIcon className="w-6 h-6 text-purple-400 mr-2" />
                  <Text variant="body2" className="text-purple-200 font-medium">
                    Precisión
                  </Text>
                </div>
                <Text variant="h5" className="text-purple-300 font-bold">
                  {Math.round(averageAccuracy)}%
                </Text>
              </div>

              {/* Average Errors */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Text variant="body2" className="text-red-400 font-bold mr-2">
                    ❌
                  </Text>
                  <Text variant="body2" className="text-red-200 font-medium">
                    Errores
                  </Text>
                </div>
                <Text variant="h5" className="text-red-300 font-bold ">
                  {Math.round(averageErrors)}
                </Text>
              </div>
            </motion.div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="relative z-10 w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black py-4 px-8 rounded-xl shadow-lg cursor-pointer"
              style={{
                boxShadow: "0 10px 25px rgba(234, 88, 12, 0.3)",
              }}
            >
              <div className="flex items-center justify-center space-x-3">
                <Text variant="h6" className="text-white font-black">
                  Continuar
                </Text>
                {/* Enter Key Icon */}
                <div className="bg-white/20 rounded-lg p-2 border border-white/30">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7h-2z" />
                  </svg>
                </div>
              </div>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
