"use client";

import { useState, useEffect } from "react";
import { Text, Racer, PracticeOverlay, ResultsOverlay } from "@/components";
import { Button, KeyIndicator } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { practiceAtom } from "@/states/practice.states";
import { useAtomValue, useSetAtom } from "jotai/react";
import { getShuffledPhrases } from "@/lib/utils";

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
  const [showResultsOverlay, setShowResultsOverlay] = useState(false);

  const practiceSet = useAtomValue(practiceAtom);
  const setPractice = useSetAtom(practiceAtom);

  const createPractice = useMutation(api.practice.addPractice);

  // Initialize practice state when component loads
  useEffect(() => {
    // Only initialize if practiceSet is empty or doesn't exist
    if (!practiceSet?.phrases || practiceSet.phrases.length === 0) {
      setPractice({
        phrases: getShuffledPhrases().map((phrase) => phrase) as string[],
      });
    }
  }, [practiceSet?.phrases, setPractice]);

  const currentPhrase = practiceSet?.phrases?.[currentRound - 1];

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
      if (currentRound < (practiceSet?.phrases?.length || 0)) {
        setCurrentRound((prev) => prev + 1);
        setShowCompleted(false);
      } else {
        // Practice completed - show results overlay
        setShowCompleted(false);
        setShowResultsOverlay(true);

        // Only save to database if user is signed in
        if (isSignedIn) {
          // Calculate averages from all rounds (same as ResultsOverlay)
          const allRounds = [...roundsData, roundData]; // Include current round
          const totalRounds = allRounds.length;
          const totalTime = allRounds.reduce(
            (sum, round) => sum + round.timeMs,
            0
          );
          const averageTime = totalTime / totalRounds;
          const averageAccuracy =
            allRounds.reduce((sum, round) => sum + round.accuracy, 0) /
            totalRounds;
          const averageWpm =
            allRounds.reduce((sum, round) => sum + round.wpm, 0) / totalRounds;
          const averageErrors =
            allRounds.reduce((sum, round) => sum + round.errors, 0) /
            totalRounds;

          createPractice({
            wpm: Math.round(averageWpm), // Same as displayed in ResultsOverlay
            accuracy: averageAccuracy / 100, // Same as displayed in ResultsOverlay
            time: averageTime / (1000 * 60), // Convert to minutes for DB
            errors: Math.round(averageErrors), // Same as displayed in ResultsOverlay
          });
        }
      }
    }, 700); // Show completion for 0.4 seconds + 300ms delay
  };

  const handleCloseResults = () => {
    setShowResultsOverlay(false);
    // Redirect back to home or reset practice
    router.push("/home");
  };

  return (
    <div className="h-full bg-gray-950 text-white flex flex-col items-center justify-start p-8">
      {/* Results Overlay */}
      <ResultsOverlay
        isVisible={showResultsOverlay}
        roundsData={roundsData}
        onClose={handleCloseResults}
      />

      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <Button
          shortcut="Cmd+J"
          onClick={() => router.push("/home")}
          onShortcutPress={() => router.push("/home")}
          className="py-2 relative bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <ChevronLeftIcon className="size-1" />
            <Text variant="caption" className="text-white font-bold">
              Volver
            </Text>
            <KeyIndicator size="sm" shortcut="Cmd+J" />
          </div>
        </Button>
      </div>

      <div className="text-center mt-12 mb-8 flex flex-col items-center">
        <Text
          variant="h5"
          className="font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
        >
          Práctica
        </Text>
        <Text variant="body1" className="text-gray-400 mt-2">
          {currentRound} / {practiceSet?.phrases?.length || 0}
        </Text>
      </div>

      {/* Container for Racer with overlays */}
      <div className="relative w-full">
        {currentPhrase ? (
          <Racer
            className="w-full"
            phrase={currentPhrase}
            onCompleted={handleCompleted}
          />
        ) : (
          <div className="w-full h-32 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

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
                    {currentRound < (practiceSet?.phrases?.length || 0)
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
