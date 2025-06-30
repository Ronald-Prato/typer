"use client";

import { useState } from "react";
import { Text, Racer, PracticeOverlay, ResultsOverlay } from "@/components";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

const practiceSet = [
  "El tiempo es oro, pero la experiencia vale más",
  // "La práctica hace al maestro en cualquier disciplina",
  // "Cada día es una nueva oportunidad para mejorar",
  // "La perseverancia es la clave del éxito verdadero",
  // "Los sueños se hacen realidad con trabajo constante",
  // "El conocimiento es poder cuando se aplica correctamente",
  // "La paciencia es una virtud que pocos cultivan",
  // "El esfuerzo continuo supera cualquier talento natural",
  // "La dedicación transforma obstáculos en oportunidades",
  // "El aprendizaje nunca termina para quien busca crecer",
];

interface RoundData {
  phrase: string;
  errors: number;
  timeMs: number;
  accuracy: number;
  wpm: number;
}

export default function PracticePage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [currentRound, setCurrentRound] = useState(1);
  const [roundsData, setRoundsData] = useState<RoundData[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showStartOverlay, setShowStartOverlay] = useState(true);
  const [showResultsOverlay, setShowResultsOverlay] = useState(false);

  const createPractice = useMutation(api.practice.addPractice);

  const currentPhrase = practiceSet[currentRound - 1];

  const handleCompleted = (data: { errors: number; timeMs: number }) => {
    const phrase = currentPhrase;
    const accuracy = Math.round(
      ((phrase.length - data.errors) / phrase.length) * 100
    );
    const timeInMinutes = data.timeMs / (1000 * 60);
    const wordsTyped = phrase.split(" ").length;
    const wpm = Math.round(wordsTyped / timeInMinutes);

    const roundData: RoundData = {
      phrase,
      errors: data.errors,
      timeMs: data.timeMs,
      accuracy,
      wpm,
    };

    // Save round data
    setRoundsData((prev) => [...prev, roundData]);

    // Show completion overlay
    setShowCompleted(true);

    // After animation, move to next round or finish practice
    setTimeout(() => {
      if (currentRound < practiceSet.length) {
        setCurrentRound((prev) => prev + 1);
        setShowCompleted(false);
      } else {
        // Practice completed - show results overlay
        setShowCompleted(false);
        setShowResultsOverlay(true);

        // Only save to database if user is signed in
        if (isSignedIn) {
          createPractice({
            wpm: wpm,
            accuracy: accuracy,
            time: timeInMinutes,
          });
        }
      }
    }, 700); // Show completion for 0.4 seconds + 300ms delay
  };

  const handleStartPractice = () => {
    setShowStartOverlay(false);
  };

  const handleCloseResults = () => {
    setShowResultsOverlay(false);
    // Redirect back to home or reset practice
    router.push("/home");
  };

  return (
    <div className="h-full bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      {/* Practice Start Overlay */}
      <PracticeOverlay
        isVisible={showStartOverlay}
        onStart={handleStartPractice}
      />

      {/* Results Overlay */}
      <ResultsOverlay
        isVisible={showResultsOverlay}
        roundsData={roundsData}
        onClose={handleCloseResults}
      />

      <button
        onClick={() => router.push("/home")}
        className="cursor-pointer absolute top-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors duration-200 text-gray-300 hover:text-white"
      >
        <ChevronLeftIcon className="size-4" />
        <Text variant="body2" className="font-medium">
          Volver
        </Text>
      </button>

      <div className="text-center mb-8 flex flex-col items-center">
        <Text
          variant="h5"
          className="font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
        >
          Práctica
        </Text>
        <Text variant="body1" className="text-gray-400 mt-2">
          {currentRound} / {practiceSet.length}
        </Text>
      </div>

      {/* Container for Racer with completion overlay */}
      <div className="relative w-full">
        <Racer
          className="w-full"
          phrase={currentPhrase}
          onCompleted={handleCompleted}
        />

        {/* Completion Overlay */}
        <AnimatePresence>
          {showCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-gray-900/20 rounded-lg z-10"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{
                  duration: 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="flex flex-col items-center space-y-4"
              >
                {/* Animated Check Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeOut",
                    delay: 0.05,
                  }}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-lg"
                >
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.15,
                      ease: "easeOut",
                      delay: 0.1,
                    }}
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                </motion.div>

                {/* Completion Text */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.15,
                    ease: "easeOut",
                    delay: 0.15,
                  }}
                >
                  <Text
                    variant="h6"
                    className="font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent"
                  >
                    {currentRound < practiceSet.length
                      ? "¡Completado!"
                      : "¡Práctica terminada!"}
                  </Text>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
