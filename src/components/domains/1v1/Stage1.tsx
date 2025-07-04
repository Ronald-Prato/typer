"use client";

import { Racer } from "@/components/Racer";
import { RacerHold } from "@/components/RacerHold";
import { Button } from "@/components/ui/button";
import {
  useState,
  useEffect,
  useRef,
  useTransition,
  useMemo,
  useCallback,
} from "react";
import { motion } from "framer-motion";
import { RacerWords } from "@/components/RacerWords";
import { Text } from "@/components/Typography";
import { api } from "../../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { MatchProgress } from "./MatchProgress";
import { GameMetrics } from "@/components/GameMetrics";
import { useRouter } from "next/navigation";
import { Modal, type ModalRefProps } from "@/components/Modal/Modal";
import {
  calculateWPM,
  calculateAccuracy,
  getCharacterCount,
  getCharacterCountFromWords,
  getCharacterCountFromHolds,
} from "@/utils/metrics";
import { finishGame } from "../../../../convex/game";
import {
  ArrowRightEndOnRectangleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface Stage1Props {
  onStageCompleted: () => void;
}

export const Stage1 = ({ onStageCompleted }: Stage1Props) => {
  const router = useRouter();
  const [step, setStep] = useState<"1" | "2" | "3" | "4">("1");
  const [isPending, startTransition] = useTransition();
  const [canContinue, setCanContinue] = useState(false);
  const [currentStepMetrics, setCurrentStepMetrics] = useState<{
    errors: number;
    timeMs: number;
  } | null>(null);

  const modalRef = useRef<ModalRefProps>(null);

  const ownUser = useQuery(api.user.getOwnUser);
  const gameData = useQuery(api.game.getGameData);
  const setStepDone = useMutation(api.game.setStepDone);
  const finishGame = useMutation(api.game.finishGame);

  const ownProgress = gameData?.game?.progress?.[ownUser?._id!];

  // Check if game is finished
  const isGameFinished = !!gameData?.game?.winner;

  // Listen for Enter key for game progression and keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Detect OS more reliably
      const isMacOS =
        typeof window !== "undefined" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmdOrCtrl = isMacOS ? event.metaKey : event.ctrlKey;

      // Handle Cmd/Ctrl+K for statistics modal
      if (event.key === "j" && isCmdOrCtrl && isGameFinished) {
        event.preventDefault();
        event.stopPropagation();
        modalRef.current?.openModal();
        return;
      }

      // Handle Cmd/Ctrl+Enter for navigation to home
      if (event.key === "k" && isCmdOrCtrl && isGameFinished) {
        event.preventDefault();
        event.stopPropagation();
        handleFinishGame();
        return;
      }

      // Handle Cmd/Ctrl+X for abandoning game
      if (event.key === "x" && isCmdOrCtrl) {
        event.preventDefault();
        event.stopPropagation();
        handleFinishGame();
        return;
      }

      // Handle regular Enter for game progression (only when game is not finished)
      if (event.key === "Enter" && canContinue && !isGameFinished) {
        event.preventDefault(); // Prevent default enter navigation
        // Move to next step
        handleNextStep();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [canContinue, onStageCompleted, step, isGameFinished, router]);

  useEffect(() => {
    if (!ownProgress) return;

    if (ownProgress?.lettersAndSymbolsDone) {
      setStep("4");
    } else if (ownProgress?.wordsDone) {
      setStep("3");
    } else if (ownProgress?.phraseDone) {
      setStep("2");
    }
  }, [ownProgress]);

  const handleRacerCompleted = useCallback(
    (data: { errors: number; timeMs: number }) => {
      setCurrentStepMetrics(data);
      setCanContinue(true);
    },
    []
  );

  const handleRacerHoldSuccess = useCallback(
    (data?: { errors: number; timeMs: number }) => {
      // Use actual metrics from RacerHold if provided, otherwise use defaults
      if (data) {
        setCurrentStepMetrics(data);
      } else {
        // Fallback to default values if no metrics provided
        const holds = gameData?.game?.holds || [];
        const totalChars = getCharacterCountFromHolds(holds);
        const defaultMetrics = { errors: 0, timeMs: 5000 }; // Default values
        setCurrentStepMetrics(defaultMetrics);
      }
      setCanContinue(true);
    },
    [gameData?.game?.holds]
  );

  const handleNextStep = () => {
    if (!currentStepMetrics) return;

    if (step === "1") {
      setStep("2");
      // Calculate metrics for phrase step
      const phrase = gameData?.game?.phrase || "";
      const totalChars = getCharacterCount(phrase);
      const wpm = calculateWPM(totalChars, currentStepMetrics.timeMs);
      const accuracy = calculateAccuracy(totalChars, currentStepMetrics.errors);

      void setStepDone({
        step: "phrase",
        metrics: {
          errors: currentStepMetrics.errors,
          timeMs: currentStepMetrics.timeMs,
          accuracy,
          wpm,
        },
      });
      setCanContinue(false); // Reset for next step
      setCurrentStepMetrics(null);
    } else if (step === "2") {
      setStep("3");
      // Calculate metrics for words step
      const words = gameData?.game?.words || [];
      const totalChars = getCharacterCountFromWords(words);
      const wpm = calculateWPM(totalChars, currentStepMetrics.timeMs);
      const accuracy = calculateAccuracy(totalChars, currentStepMetrics.errors);

      void setStepDone({
        step: "words",
        metrics: {
          errors: currentStepMetrics.errors,
          timeMs: currentStepMetrics.timeMs,
          accuracy,
          wpm,
        },
      });
      setCanContinue(false); // Reset for next step
      setCurrentStepMetrics(null);
    } else if (step === "3") {
      setStep("4");
      // Calculate metrics for lettersAndSymbols step
      const lettersAndSymbols = gameData?.game?.lettersAndSymbols || [];
      const totalChars = getCharacterCountFromWords(lettersAndSymbols);
      const wpm = calculateWPM(totalChars, currentStepMetrics.timeMs);
      const accuracy = calculateAccuracy(totalChars, currentStepMetrics.errors);

      void setStepDone({
        step: "lettersAndSymbols",
        metrics: {
          errors: currentStepMetrics.errors,
          timeMs: currentStepMetrics.timeMs,
          accuracy,
          wpm,
        },
      });
      setCanContinue(false); // Reset for next step
      setCurrentStepMetrics(null);
    } else if (step === "4") {
      // Calculate metrics for holds step
      const holds = gameData?.game?.holds || [];
      const totalChars = getCharacterCountFromHolds(holds);
      const wpm = calculateWPM(totalChars, currentStepMetrics.timeMs);
      const accuracy = calculateAccuracy(totalChars, currentStepMetrics.errors);

      void setStepDone({
        step: "holds",
        metrics: {
          errors: currentStepMetrics.errors,
          timeMs: currentStepMetrics.timeMs,
          accuracy,
          wpm,
        },
      });
      setCanContinue(false); // Reset for next step
      setCurrentStepMetrics(null);
    }
  };

  const handleFinishGame = useCallback(async () => {
    void finishGame();
    router.push("/home");
  }, [finishGame, router]);

  // Memoize arrays to prevent re-renders when bot progress changes
  const memoWords = useMemo(
    () => gameData?.game?.words || [],
    [gameData?.game?.words?.join(",")]
  );

  const memoLettersAndSymbols = useMemo(
    () => gameData?.game?.lettersAndSymbols || [],
    [gameData?.game?.lettersAndSymbols?.join(",")]
  );

  const memoHolds = useMemo(
    () => gameData?.game?.holds || [],
    [gameData?.game?.holds?.map((h) => `${h.word}-${h.number}`).join(",")]
  );

  // Memoize the game content to prevent re-renders when bot progress changes
  const gameContent = useMemo(() => {
    if (step === "1") {
      return (
        <Racer
          hideStats
          phrase={gameData?.game?.phrase || ""}
          withCompleteFeedback
          onCompleted={handleRacerCompleted}
        />
      );
    } else if (step === "2") {
      return (
        <RacerWords
          hideBullets
          words={memoWords}
          hideStats
          onCompleted={handleRacerCompleted}
        />
      );
    } else if (step === "3") {
      return (
        <RacerWords
          hideBullets
          hideStats
          words={memoLettersAndSymbols}
          onCompleted={handleRacerCompleted}
        />
      );
    } else if (step === "4" && !gameData?.game?.winner) {
      return (
        <RacerHold
          hideBullets
          holds={memoHolds}
          onSuccess={handleRacerHoldSuccess}
        />
      );
    }
    return null;
  }, [
    step,
    gameData?.game?.phrase,
    memoWords,
    memoLettersAndSymbols,
    memoHolds,
    gameData?.game?.winner,
    handleRacerCompleted,
    handleRacerHoldSuccess,
  ]);

  // If game is finished, show metrics instead of game components
  if (isGameFinished) {
    const metrics = ownProgress;
    return (
      <div className="w-full h-full flex flex-col items-center justify-start space-y-6">
        <MatchProgress />

        <div className="w-full h-full flex flex-col items-center justify-start space-y-6"></div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex items-center space-x-4 mt-6"
        >
          {/* Estadísticas Button - Glassmorphism */}
          <Button
            onClick={() => modalRef.current?.openModal()}
            className="w-48 py-3 relative bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <Text variant="body2" className="text-white font-bold">
                Estadísticas
              </Text>
              {/* Cmd/Ctrl + K Key */}
              <div
                className="w-12 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
                style={{
                  boxShadow:
                    "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                }}
              >
                {typeof window !== "undefined" &&
                navigator.platform.toUpperCase().indexOf("MAC") >= 0
                  ? "⌘ J"
                  : "Ctrl J"}
              </div>
            </div>
          </Button>

          {/* Continuar Button */}
          <Button
            onClick={handleFinishGame}
            disabled={isPending}
            className="w-48 py-3 relative"
          >
            <div className="flex items-center space-x-3">
              <Text variant="body2" className="text-white font-bold">
                Continuar
              </Text>
              {/* Cmd/Ctrl + Enter Key */}
              <div
                className="w-12 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
                style={{
                  boxShadow:
                    "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                }}
              >
                {typeof window !== "undefined" &&
                navigator.platform.toUpperCase().indexOf("MAC") >= 0
                  ? "⌘ K"
                  : "Ctrl K"}
              </div>
            </div>
          </Button>
        </motion.div>

        {/* Statistics Modal */}
        <Modal ref={modalRef} className="bg-gray-900 border border-gray-700">
          <Modal.Content>
            <GameMetrics
              phraseMetrics={metrics?.phraseMetrics}
              wordsMetrics={metrics?.wordsMetrics}
              lettersAndSymbolsMetrics={metrics?.lettersAndSymbolsMetrics}
              holdsMetrics={metrics?.holdsMetrics}
            />
          </Modal.Content>
          <Modal.Bottom>
            <div className="flex items-center justify-between space-x-4">
              <Button
                onClick={() => modalRef.current?.closeModal()}
                variant="outline"
                className="flex-1"
              >
                <div className="flex items-center space-x-4">
                  <Text variant="body2">Cerrar</Text>
                  {/* ESC Key */}
                  <div
                    className="w-12 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
                    style={{
                      boxShadow:
                        "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    ESC
                  </div>
                </div>
              </Button>
              <Button
                onClick={handleFinishGame}
                disabled={isPending}
                className="flex-1"
              >
                <div className="flex items-center space-x-4">
                  <Text variant="body2">Continuar</Text>
                  {/* Cmd/Ctrl + Enter Key */}
                  <div
                    className="w-12 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
                    style={{
                      boxShadow:
                        "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {typeof window !== "undefined" &&
                    navigator.platform.toUpperCase().indexOf("MAC") >= 0
                      ? "⌘ K"
                      : "Ctrl K"}
                  </div>
                </div>
              </Button>
            </div>
          </Modal.Bottom>
        </Modal>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-start space-y-6">
      <Button onClick={handleFinishGame}>
        <div className="flex items-center space-x-3">
          <ArrowRightOnRectangleIcon className="size-3 text-white" />
          <Text variant="body2" className="text-white font-bold">
            Abandonar
          </Text>
          {/* Cmd/Ctrl + X Key */}
          <div
            className="w-12 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
            style={{
              boxShadow:
                "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            {typeof window !== "undefined" &&
            navigator.platform.toUpperCase().indexOf("MAC") >= 0
              ? "⌘ X"
              : "Ctrl X"}
          </div>
        </div>
      </Button>

      <MatchProgress />

      {/* Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="mt-10"
      >
        {gameContent}
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
            {/* Enter Key */}
            <div
              className={`w-12 h-6 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border transition-all duration-100 ${
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
              ENTER
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
};
