"use client";

import { Racer } from "@/components/Racer";
import { RacerHold } from "@/components/RacerHold";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { RacerWords } from "@/components/RacerWords";
import { Text } from "@/components/Typography";
import {
  practiceLettersAndSymbols,
  practicePhrases,
  practiceWords,
} from "@/constants";

interface Stage1Props {
  onStageCompleted: () => void;
}

export const Stage1 = ({ onStageCompleted }: Stage1Props) => {
  const [step, setStep] = useState<"1" | "2" | "3" | "4" | "5" | "6">("1");
  const [canContinue, setCanContinue] = useState(false);

  // Initialize with first items to avoid hydration mismatch
  const [phrase, setPhrase] = useState(practicePhrases[0]);
  const [words, setWords] = useState(practiceWords.slice(0, 5));
  const [lettersAndSymbols, setLettersAndSymbols] = useState(
    practiceLettersAndSymbols.slice(0, 5)
  );
  const [holdWords, setHoldWords] = useState(practiceWords.slice(5, 10));
  const [words2, setWords2] = useState(practiceWords.slice(10, 15));
  const [lettersAndSymbols2, setLettersAndSymbols2] = useState(
    practiceLettersAndSymbols.slice(5, 10)
  );

  // Randomize content only on client side after hydration
  useEffect(() => {
    const shuffledWords = practiceWords.sort(() => Math.random() - 0.5);
    const shuffledLetters = practiceLettersAndSymbols.sort(
      () => Math.random() - 0.5
    );
    const shuffledPhrases = practicePhrases.sort(() => Math.random() - 0.5);

    setPhrase(shuffledPhrases[0]);
    setWords(shuffledWords.slice(0, 5));
    setLettersAndSymbols(shuffledLetters.slice(0, 5));
    setHoldWords(shuffledWords.slice(5, 10));
    setWords2(shuffledWords.slice(10, 15));
    setLettersAndSymbols2(shuffledLetters.slice(5, 10));
  }, []);

  // Listen for Tab key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Tab" && canContinue) {
        event.preventDefault(); // Prevent default tab navigation
        if (step === "6") {
          // Only complete stage on final step
          onStageCompleted();
        } else {
          // Move to next step
          handleNextStep();
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [canContinue, onStageCompleted, step]);

  const handleRacerCompleted = (data: { errors: number; timeMs: number }) => {
    setCanContinue(true);
  };

  const handleRacerHoldSuccess = () => {
    setCanContinue(true);
  };

  const handleNextStep = () => {
    if (step === "1") {
      setStep("2");
      setCanContinue(false); // Reset for next step
    } else if (step === "2") {
      setStep("3");
      setCanContinue(false); // Reset for next step
    } else if (step === "3") {
      setStep("4");
      setCanContinue(false); // Reset for next step
    } else if (step === "4") {
      setStep("5");
      setCanContinue(false); // Reset for next step
    } else if (step === "5") {
      setStep("6");
      setCanContinue(false); // Reset for next step
    } else if (step === "6") {
      onStageCompleted();
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
      {/* Step Title */}

      {/* Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {step === "1" ? (
          <Racer
            hideStats
            phrase={phrase}
            withCompleteFeedback
            onCompleted={handleRacerCompleted}
          />
        ) : step === "2" ? (
          <RacerWords
            words={words}
            hideStats
            onCompleted={handleRacerCompleted}
          />
        ) : step === "3" ? (
          <RacerWords
            hideStats
            words={lettersAndSymbols}
            onCompleted={handleRacerCompleted}
          />
        ) : step === "4" ? (
          <RacerHold words={holdWords} onSuccess={handleRacerHoldSuccess} />
        ) : step === "5" ? (
          <RacerWords
            words={words2}
            hideStats
            onCompleted={handleRacerCompleted}
          />
        ) : (
          <RacerWords
            hideStats
            words={lettersAndSymbols2}
            onCompleted={handleRacerCompleted}
          />
        )}
      </motion.div>

      {/* Button */}
      <div className="mt-4">
        <Button
          disabled={!canContinue}
          onClick={handleNextStep}
          className={`w-[20rem] relative overflow-hidden ${
            canContinue ? "animate-pulse shadow-xl shadow-orange-500/50" : ""
          }`}
        >
          {/* Animated background lights when enabled */}
          {canContinue && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_500ms_ease-in-out_infinite]" />
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-lg opacity-75 blur-sm animate-pulse" />
            </>
          )}

          <div className="flex items-center space-x-4 relative z-10">
            <Text variant="body1">Avanzar</Text>
            {/* Tab Key */}
            <div
              className={`w-8 h-6 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border transition-all duration-100 ${
                canContinue
                  ? "bg-orange-500/80 border-orange-400 shadow-lg shadow-orange-500/90 animate-pulse"
                  : "bg-white/20 border-white/30"
              }`}
              style={{
                boxShadow: canContinue
                  ? "0 0 15px rgba(249, 115, 22, 0.8)"
                  : "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              TAB
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
};
