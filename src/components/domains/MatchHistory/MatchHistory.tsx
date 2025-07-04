"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Text } from "@/components/Typography";
import { GameMetrics } from "@/components/GameMetrics";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format, isThisYear } from "date-fns";
import { es } from "date-fns/locale";

interface GameHistoryItem {
  _id: string;
  _creationTime: number;
  userId: string;
  players: string[];
  phrase: string;
  words: string[];
  holds: Array<{ word: string; number: number }>;
  lettersAndSymbols: string[];
  playersAccepted: string[];
  winner?: string;
  language: "en" | "es";
  progress?: Record<
    string,
    {
      phraseDone?: boolean;
      wordsDone?: boolean;
      lettersAndSymbolsDone?: boolean;
      holdsDone?: boolean;
      phraseMetrics?: {
        errors: number;
        timeMs: number;
        accuracy?: number;
        wpm?: number;
      };
      wordsMetrics?: {
        errors: number;
        timeMs: number;
        accuracy?: number;
        wpm?: number;
      };
      lettersAndSymbolsMetrics?: {
        errors: number;
        timeMs: number;
        accuracy?: number;
        wpm?: number;
      };
      holdsMetrics?: {
        errors: number;
        timeMs: number;
        accuracy?: number;
        wpm?: number;
      };
    }
  >;
  createdAt: number;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);

  if (isThisYear(date)) {
    return format(date, "d MMM, h:mm a", { locale: es });
  } else {
    return format(date, "d MMM yyyy, h:mm a", { locale: es });
  }
};

const calculateAverageMetrics = (
  progress: GameHistoryItem["progress"],
  userId: string
) => {
  const userProgress = progress?.[userId];
  if (!userProgress) return { timeMs: 0, errors: 0, accuracy: 0, wpm: 0 };

  const allMetrics = [
    userProgress.phraseMetrics,
    userProgress.wordsMetrics,
    userProgress.lettersAndSymbolsMetrics,
    userProgress.holdsMetrics,
  ].filter(Boolean);

  if (allMetrics.length === 0)
    return { timeMs: 0, errors: 0, accuracy: 0, wpm: 0 };

  const totalTime = allMetrics.reduce((sum, m) => sum + (m?.timeMs || 0), 0);
  const totalErrors = allMetrics.reduce((sum, m) => sum + (m?.errors || 0), 0);
  const avgAccuracy = Math.round(
    allMetrics.reduce((sum, m) => sum + (m?.accuracy || 0), 0) /
      allMetrics.length
  );
  const avgWPM = Math.round(
    allMetrics.reduce((sum, m) => sum + (m?.wpm || 0), 0) / allMetrics.length
  );

  return {
    timeMs: totalTime,
    errors: totalErrors,
    accuracy: avgAccuracy,
    wpm: avgWPM,
  };
};

const formatTime = (timeMs: number) => {
  const seconds = timeMs / 1000;
  return `${seconds.toFixed(1)}s`;
};

const formatWPM = (wpm?: number) => {
  if (!wpm) return "N/A";
  return `${Math.round(wpm)}`;
};

const formatAccuracy = (accuracy?: number) => {
  if (!accuracy) return "N/A";
  return `${Math.round(accuracy)}%`;
};

export const MatchHistory = () => {
  const gameHistory = useQuery(api.history.getGameHistory);
  const currentUser = useQuery(api.user.getOwnUser);

  if (gameHistory === undefined) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Text variant="h5" className="text-center text-white font-medium">
            Historial de Partidas
          </Text>
        </motion.div>

        {/* Loading Skeletons */}
        {Array.from({ length: 5 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex space-x-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (gameHistory.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📊</div>
          <Text variant="h6" className="text-gray-400 mb-2">
            No hay partidas jugadas
          </Text>
          <Text variant="body2" className="text-gray-500">
            Completa tu primera partida para ver tu historial aquí
          </Text>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Text variant="h5" className="text-center text-white font-medium">
          Historial de Partidas
        </Text>
      </motion.div>

      <Accordion type="single" collapsible className="space-y-2">
        {gameHistory.map((game, index) => {
          const userId = currentUser?._id;
          if (!userId) return null;

          const isWinner = game.winner === userId;
          const avgMetrics = calculateAverageMetrics(game.progress, userId);

          return (
            <motion.div
              key={game._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <AccordionItem
                value={game._id}
                className="border border-gray-700 rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between w-full pr-4">
                    {/* Game Info */}
                    <div className="flex items-center space-x-4">
                      <div
                        className={`text-2xl ${isWinner ? "text-yellow-400" : "text-red-400"}`}
                      >
                        {isWinner ? "🏆" : "❌"}
                      </div>
                      <div className="text-left flex flex-col items-start">
                        <Text
                          variant="body2"
                          className={`font-semibold ${isWinner ? "text-yellow-100" : "text-red-100"}`}
                        >
                          {isWinner ? "VICTORIA" : "DERROTA"}
                        </Text>
                        <Text variant="caption" className="text-gray-400">
                          {formatDate(game._creationTime)}
                        </Text>
                      </div>
                    </div>

                    {/* Average Stats */}
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center flex flex-col items-center">
                        <Text variant="caption" className="text-gray-400">
                          Tiempo
                        </Text>
                        <Text
                          variant="body2"
                          className="text-white font-medium"
                        >
                          {formatTime(avgMetrics.timeMs)}
                        </Text>
                      </div>
                      <div className="text-center flex flex-col items-center">
                        <Text variant="caption" className="text-gray-400">
                          Errores
                        </Text>
                        <Text
                          variant="body2"
                          className="text-white font-medium"
                        >
                          {avgMetrics.errors}
                        </Text>
                      </div>
                      <div className="text-center flex flex-col items-center">
                        <Text variant="caption" className="text-gray-400">
                          Precisión
                        </Text>
                        <Text
                          variant="body2"
                          className="text-white font-medium"
                        >
                          {formatAccuracy(avgMetrics.accuracy)}
                        </Text>
                      </div>
                      <div className="text-center flex flex-col items-center">
                        <Text variant="caption" className="text-gray-400">
                          WPM
                        </Text>
                        <Text
                          variant="body2"
                          className="text-white font-medium"
                        >
                          {formatWPM(avgMetrics.wpm)}
                        </Text>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <GameMetrics
                    phraseMetrics={game.progress?.[userId]?.phraseMetrics}
                    wordsMetrics={game.progress?.[userId]?.wordsMetrics}
                    lettersAndSymbolsMetrics={
                      game.progress?.[userId]?.lettersAndSymbolsMetrics
                    }
                    holdsMetrics={game.progress?.[userId]?.holdsMetrics}
                    className="mt-4 max-w-full"
                  />
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          );
        })}
      </Accordion>
    </div>
  );
};
