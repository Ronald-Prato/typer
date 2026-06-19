"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  deriveStepFromProgress,
  getNextStepSubmission,
  type MatchStageStep,
  type RawTypingMetrics,
} from "@/domain/matchFlow";

export function useMatchStageFlow() {
  const router = useRouter();
  const [step, setStep] = useState<MatchStageStep>("1");
  const [isPending] = useTransition();
  const [canContinue, setCanContinue] = useState(false);
  const [currentStepMetrics, setCurrentStepMetrics] =
    useState<RawTypingMetrics | null>(null);

  const ownUser = useCurrentUser();
  const gameData = useQuery(api.game.getGameData);
  const setStepDone = useMutation(api.game.setStepDone);
  const finishGame = useMutation(api.game.finishGame);

  const ownProgress = ownUser
    ? gameData?.game?.progress?.[ownUser._id]
    : undefined;
  const isGameFinished = Boolean(gameData?.game?.winner);

  const gameWords = gameData?.game?.words;
  const gameLettersAndSymbols = gameData?.game?.lettersAndSymbols;
  const gameHolds = gameData?.game?.holds;

  const memoWords = useMemo(() => gameWords || [], [gameWords]);

  const memoLettersAndSymbols = useMemo(
    () => gameLettersAndSymbols || [],
    [gameLettersAndSymbols]
  );

  const memoHolds = useMemo(() => gameHolds || [], [gameHolds]);

  const handleRacerCompleted = useCallback((data: RawTypingMetrics) => {
    setCurrentStepMetrics(data);
    setCanContinue(true);
  }, []);

  const handleRacerHoldSuccess = useCallback(
    (data?: RawTypingMetrics) => {
      setCurrentStepMetrics(data ?? { errors: 0, timeMs: 5000 });
      setCanContinue(true);
    },
    []
  );

  const syncStepFromProgress = useCallback(() => {
    setStep(deriveStepFromProgress(ownProgress));
  }, [ownProgress]);

  const handleNextStep = useCallback(() => {
    if (!currentStepMetrics) return;

    const submission = getNextStepSubmission({
      step,
      metrics: currentStepMetrics,
      content: {
        phrase: gameData?.game?.phrase || "",
        words: memoWords,
        lettersAndSymbols: memoLettersAndSymbols,
        holds: memoHolds,
      },
    });

    if (submission.nextStep) {
      setStep(submission.nextStep);
    }

    void setStepDone(submission.payload);
    setCanContinue(false);
    setCurrentStepMetrics(null);
  }, [
    currentStepMetrics,
    gameData?.game?.phrase,
    memoHolds,
    memoLettersAndSymbols,
    memoWords,
    setStepDone,
    step,
  ]);

  const handleFinishGame = useCallback(async () => {
    void finishGame();
    router.push("/home");
  }, [finishGame, router]);

  return {
    canContinue,
    currentStepMetrics,
    gameData,
    handleFinishGame,
    handleNextStep,
    handleRacerCompleted,
    handleRacerHoldSuccess,
    isGameFinished,
    isPending,
    memoHolds,
    memoLettersAndSymbols,
    memoWords,
    ownProgress,
    ownUser,
    step,
    syncStepFromProgress,
  };
}
