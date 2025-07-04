"use client";

import { useQuery } from "convex/react";
import { useWindowSize } from "react-use";
import ReactConfetti from "react-confetti";
import { Text } from "@/components/Typography";
import { api } from "../../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";

export const MatchProgress = () => {
  const { width, height } = useWindowSize();
  const gameData = useQuery(api.game.getGameData);
  const currentUser = useQuery(api.user.getOwnUser);

  // Check if game is finished
  const isGameFinished = !!gameData?.game?.winner;

  if (!gameData || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[100px]">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { game, opponent } = gameData;

  // Helper function to render avatar
  const renderAvatar = (user: any, size: string = "w-12 h-12") => {
    if (!user?.avatar) {
      return (
        <div
          className={`${size} rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-lg`}
        >
          {user?.nickname?.[0]?.toUpperCase() || "?"}
        </div>
      );
    }

    return (
      <div
        className={`${size} rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden flex items-center justify-center relative`}
      >
        <div
          dangerouslySetInnerHTML={{ __html: user.avatar }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: "scale(1)" }}
        />
      </div>
    );
  };

  // Get progress for current user
  const currentUserProgress = game?.progress?.[currentUser._id] || {};
  const opponentProgress = opponent?._id
    ? game?.progress?.[opponent._id] || {}
    : {};

  // Calculate progress for each player (0-3 steps)
  const getTotalProgress = (progress: any) => {
    const steps = [
      progress.phraseDone,
      progress.wordsDone,
      progress.lettersAndSymbolsDone,
      progress.holdsDone,
    ];
    return steps.filter(Boolean).length;
  };

  const currentUserSteps = getTotalProgress(currentUserProgress);
  const opponentSteps = getTotalProgress(opponentProgress);

  // Check if game is finished
  const isWinner = game?.winner === currentUser._id;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Victory/Defeat Message */}
      <AnimatePresence>
        {isGameFinished && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mb-4 flex justify-center"
          >
            <motion.div className="rounded-lg p-3 text-center max-w-md w-fit">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="text-2xl mb-1"
              >
                {isWinner ? "🏆" : "❌"}
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <Text
                  variant="subtitle2"
                  className={`font-bold text-white ${
                    isWinner ? "text-yellow-100" : "text-red-100"
                  }`}
                >
                  {isWinner ? "VICTORIA" : "DERROTA"}
                </Text>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isGameFinished && isWinner && (
        <ReactConfetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
          style={{
            top: 0,
            left: 0,
            position: "fixed",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Players Row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center justify-between mb-8"
      >
        {/* You */}
        <div className="flex flex-col items-center space-y-2">
          {renderAvatar(currentUser)}
          <Text variant="body2" className="text-white font-medium">
            {currentUser.nickname}
          </Text>
          <Text variant="caption" className="text-orange-400">
            {currentUserSteps}/4
          </Text>
        </div>

        {/* VS */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg px-4 py-2 rounded-full shadow-lg">
          VS
        </div>

        {/* Opponent */}
        <div className="flex flex-col items-center space-y-2">
          {renderAvatar(opponent)}
          <Text variant="body2" className="text-white font-medium">
            {opponent?.nickname || "Oponente"}
          </Text>
          <Text variant="caption" className="text-blue-400">
            {opponentSteps}/4
          </Text>
        </div>
      </motion.div>

      {/* Single Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="space-y-6"
      >
        {/* Progress Bar Container */}
        <div className="relative">
          {/* Background bar */}
          <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden">
            {/* Current user progress (left to center) */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentUserSteps / 4) * 50}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-l-full absolute left-0 top-0"
            />

            {/* Opponent progress (right to center) */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(opponentSteps / 4) * 50}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-4 bg-gradient-to-l from-blue-500 to-green-500 rounded-r-full absolute right-0 top-0"
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {/* Left side - Current user steps */}
            <div className="flex flex-1 justify-between pr-8">
              {["Frase", "Palabras", "Caracteres"].map((step, index) => {
                const isCompleted = currentUserSteps > index;
                return (
                  <motion.div
                    key={`user-${step}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="flex flex-col items-center space-y-2"
                  >
                    <motion.div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-orange-500 shadow-lg shadow-orange-500/50"
                          : "bg-gray-600"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      animate={
                        isCompleted
                          ? {
                              scale: [1, 1.1, 1],
                              boxShadow: [
                                "0 0 0 rgba(249, 115, 22, 0.5)",
                                "0 0 20px rgba(249, 115, 22, 0.8)",
                                "0 0 0 rgba(249, 115, 22, 0.5)",
                              ],
                            }
                          : {
                              boxShadow: [
                                "0 0 0 rgba(249, 115, 22, 0.5)",
                                "0 0 20px rgba(249, 115, 22, 0.8)",
                                "0 0 0 rgba(249, 115, 22, 0.5)",
                              ],
                            }
                      }
                      transition={{
                        duration: 2,
                        repeat: isCompleted ? Infinity : 0,
                      }}
                    >
                      {isCompleted && (
                        <motion.svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </motion.svg>
                      )}
                    </motion.div>
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    >
                      <Text variant="caption" className="text-gray-400 text-xs">
                        {step}
                      </Text>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Center - Final step */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col items-center space-y-2 px-4"
            >
              <motion.div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  currentUserSteps === 4 || opponentSteps === 4
                    ? "bg-gradient-to-r from-orange-500 to-blue-500 shadow-lg shadow-orange-500/50"
                    : "bg-gray-600"
                }`}
                whileHover={{ scale: 1.1 }}
                animate={
                  currentUserSteps === 4 || opponentSteps === 4
                    ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          "0 0 0 rgba(249, 115, 22, 0.5)",
                          "0 0 25px rgba(249, 115, 22, 0.8)",
                          "0 0 0 rgba(249, 115, 22, 0.5)",
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat:
                    currentUserSteps === 4 || opponentSteps === 4
                      ? Infinity
                      : 0,
                }}
              >
                {(currentUserSteps === 4 || opponentSteps === 4) && (
                  <motion.svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </motion.svg>
                )}
              </motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <Text
                  variant="caption"
                  className="text-white text-xs font-medium"
                >
                  Holds
                </Text>
              </motion.div>
            </motion.div>

            {/* Right side - Opponent steps */}
            <div className="flex flex-1 justify-between pl-8">
              {["Caracteres", "Palabras", "Frase"].map((step, index) => {
                // Map visual index to actual progress index
                // Visual: ["Caracteres", "Palabras", "Frase"] -> [0, 1, 2]
                // Actual: [phraseDone, wordsDone, lettersAndSymbolsDone, holdsDone] -> [0, 1, 2, 3]
                // So "Frase" (visual index 2) maps to phraseDone (progress index 0)
                // "Palabras" (visual index 1) maps to wordsDone (progress index 1)
                // "Caracteres" (visual index 0) maps to lettersAndSymbolsDone (progress index 2)
                const progressIndex =
                  step === "Frase" ? 0 : step === "Palabras" ? 1 : 2;
                const isCompleted = opponentSteps > progressIndex;

                return (
                  <motion.div
                    key={`opponent-${step}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="flex flex-col items-center space-y-2"
                  >
                    <motion.div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-blue-500 shadow-lg shadow-blue-500/50"
                          : "bg-gray-600"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      animate={
                        isCompleted
                          ? {
                              scale: [1, 1.1, 1],
                              boxShadow: [
                                "0 0 0 rgba(59, 130, 246, 0.5)",
                                "0 0 20px rgba(59, 130, 246, 0.8)",
                                "0 0 0 rgba(59, 130, 246, 0.5)",
                              ],
                            }
                          : {}
                      }
                      transition={{
                        duration: 2,
                        repeat: isCompleted ? Infinity : 0,
                      }}
                    >
                      {isCompleted && (
                        <motion.svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </motion.svg>
                      )}
                    </motion.div>
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    >
                      <Text variant="caption" className="text-gray-400 text-xs">
                        {step}
                      </Text>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
