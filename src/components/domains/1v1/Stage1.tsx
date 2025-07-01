"use client";

import { Racer } from "@/components/Racer";
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
  const [step, setStep] = useState<"1" | "2" | "3">("1");
  const [canContinue, setCanContinue] = useState(false);

  // Initialize with first items to avoid hydration mismatch
  const [words, setWords] = useState(practiceWords.slice(0, 5));
  const [lettersAndSymbols, setLettersAndSymbols] = useState(
    practiceLettersAndSymbols.slice(0, 5)
  );
  const [phrase, setPhrase] = useState(practicePhrases[0]);

  // Randomize content only on client side after hydration
  useEffect(() => {
    setWords(practiceWords.sort(() => Math.random() - 0.5).slice(0, 5));
    setLettersAndSymbols(
      practiceLettersAndSymbols.sort(() => Math.random() - 0.5).slice(0, 5)
    );
    setPhrase(practicePhrases.sort(() => Math.random() - 0.5)[0]);
  }, []);

  // Listen for Tab key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Tab" && canContinue) {
        event.preventDefault(); // Prevent default tab navigation
        if (step === "3") {
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

  const handleNextStep = () => {
    if (step === "1") {
      setStep("2");
      setCanContinue(false); // Reset for next step
    } else if (step === "2") {
      setStep("3");
      setCanContinue(false); // Reset for next step
    } else if (step === "3") {
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
        ) : (
          <RacerWords
            hideStats
            words={lettersAndSymbols}
            onCompleted={handleRacerCompleted}
          />
        )}
      </motion.div>

      {/* Button */}
      <div className="mt-4">
        <Button
          disabled={!canContinue}
          onClick={handleNextStep}
          className="w-[20rem]"
        >
          <div className="flex items-center space-x-4">
            <Text variant="body1">Avanzar</Text>
            {/* Tab Key */}
            <div
              className="w-8 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
              style={{
                boxShadow:
                  "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
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
