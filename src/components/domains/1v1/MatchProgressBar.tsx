"use client";

import { motion } from "@/motion";
import { Text } from "@/components/Typography";
import { getOpponentProgressIndex } from "@/domain/matchProgress";

function ProgressStepMarker({
  colorClass,
  delay,
  isCompleted,
  label,
}: {
  colorClass: string;
  delay: number;
  isCompleted: boolean;
  label: string;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col items-center space-y-2"
    >
      <motion.div
        className={`w-5 h-5 rounded-full flex items-center justify-center ${
          isCompleted ? colorClass : "bg-gray-600"
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
            : {}
        }
        transition={{ duration: 2, repeat: isCompleted ? Infinity : 0 }}
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
        transition={{ duration: 0.3, delay: delay + 0.1 }}
      >
        <Text variant="caption" className="text-gray-400 text-xs">
          {label}
        </Text>
      </motion.div>
    </motion.div>
  );
}

function FinalStepMarker({
  currentUserSteps,
  opponentSteps,
}: {
  currentUserSteps: number;
  opponentSteps: number;
}) {
  const isCompleted = currentUserSteps === 4 || opponentSteps === 4;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="flex flex-col items-center space-y-2 px-4"
    >
      <motion.div
        className={`w-6 h-6 rounded-full flex items-center justify-center ${
          isCompleted
            ? "bg-gradient-to-r from-orange-500 to-blue-500 shadow-lg shadow-orange-500/50"
            : "bg-gray-600"
        }`}
        whileHover={{ scale: 1.1 }}
        animate={
          isCompleted
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
        transition={{ duration: 2, repeat: isCompleted ? Infinity : 0 }}
      >
        {isCompleted && (
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
      <Text variant="caption" className="text-white text-xs font-medium">
        Holds
      </Text>
    </motion.div>
  );
}

export function MatchProgressBar({
  currentUserSteps,
  opponentSteps,
}: {
  currentUserSteps: number;
  opponentSteps: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="space-y-6"
    >
      <div className="relative">
        <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentUserSteps / 4) * 50}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-l-full absolute left-0 top-0"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(opponentSteps / 4) * 50}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-4 bg-gradient-to-l from-blue-500 to-green-500 rounded-r-full absolute right-0 top-0"
          />
        </div>

        <div className="flex justify-between mt-4">
          <div className="flex flex-1 justify-between pr-8">
            {["Frase", "Palabras", "Caracteres"].map((step, index) => (
              <ProgressStepMarker
                key={`user-${step}`}
                colorClass="bg-orange-500 shadow-lg shadow-orange-500/50"
                delay={0.3 + index * 0.1}
                isCompleted={currentUserSteps > index}
                label={step}
              />
            ))}
          </div>

          <FinalStepMarker
            currentUserSteps={currentUserSteps}
            opponentSteps={opponentSteps}
          />

          <div className="flex flex-1 justify-between pl-8">
            {["Caracteres", "Palabras", "Frase"].map((step, index) => (
              <ProgressStepMarker
                key={`opponent-${step}`}
                colorClass="bg-blue-500 shadow-lg shadow-blue-500/50"
                delay={0.3 + index * 0.1}
                isCompleted={opponentSteps > getOpponentProgressIndex(step)}
                label={step}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
