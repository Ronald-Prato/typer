"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePendingMatchExitGuard } from "@/hooks/usePendingMatchExitGuard";
import {
  deriveStepFromProgress,
  getNextStepSubmission,
  type MatchStageStep,
  type RawTypingMetrics,
} from "@/domain/matchFlow";
import {
  COMPETITIVE_SCROLL_COUNTDOWN_MS,
  COMPETITIVE_SCROLL_VERSUS_INTRO_MS,
  getCompetitiveScrollIntroState,
} from "@/domain/practiceScroll";

const CLASSIC_MATCH_START_DELAY_MS =
  COMPETITIVE_SCROLL_VERSUS_INTRO_MS + COMPETITIVE_SCROLL_COUNTDOWN_MS;

export function useMatchStageFlow() {
  const router = useRouter();
  const [step, setStep] = useState<MatchStageStep>("1");
  const [isPending] = useTransition();
  const [canContinue, setCanContinue] = useState(false);
  const [currentStepMetrics, setCurrentStepMetrics] =
    useState<RawTypingMetrics | null>(null);
  const [introNow, setIntroNow] = useState(() => Date.now());
  const [classicStartedAt, setClassicStartedAt] = useState<
    number | undefined
  >();

  const ownUser = useCurrentUser();
  const gameData = useQuery(api.game.getGameData);
  const setStepDone = useMutation(api.game.setStepDone);
  const finishGame = useMutation(api.game.finishGame);

  const game = gameData?.game;
  const gameId = game?._id;
  const gameMode = game?.mode;
  const gameWinner = game?.winner;
  const ownProgress = ownUser
    ? game?.progress?.[ownUser._id]
    : undefined;
  const isGameFinished = Boolean(gameWinner);
  const introState = useMemo(
    () =>
      getCompetitiveScrollIntroState({
        now: introNow,
        startedAt: classicStartedAt,
      }),
    [classicStartedAt, introNow]
  );
  const isIntroPlaying = introState.phase === "playing";

  const gameWords = game?.words;
  const gameLettersAndSymbols = game?.lettersAndSymbols;
  const gameHolds = game?.holds;

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

  useEffect(() => {
    if (!gameId || gameMode === "scroll" || gameWinner) {
      setClassicStartedAt(undefined);
      return;
    }

    setClassicStartedAt((currentStartedAt) =>
      currentStartedAt ?? Date.now() + CLASSIC_MATCH_START_DELAY_MS
    );
  }, [gameId, gameMode, gameWinner]);

  useEffect(() => {
    if (!game || isGameFinished || isIntroPlaying) return;

    const intervalId = window.setInterval(() => {
      setIntroNow(Date.now());
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [game, isGameFinished, isIntroPlaying]);

  const handleNextStep = useCallback(() => {
    if (!currentStepMetrics) return;

    const submission = getNextStepSubmission({
      step,
      metrics: currentStepMetrics,
      content: {
        phrase: game?.phrase || "",
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
    game?.phrase,
    memoHolds,
    memoLettersAndSymbols,
    memoWords,
    setStepDone,
    step,
  ]);

  const handleFinishGame = useCallback(async () => {
    await finishGame();
    router.push("/home");
  }, [finishGame, router]);

  const handleConfirmedExit = useCallback(async () => {
    await finishGame();
  }, [finishGame]);

  const { confirmAndExitToHome } = usePendingMatchExitGuard({
    activeGame: ownUser?.activeGame,
    isFinished: isGameFinished,
    onConfirmExit: handleConfirmedExit,
  });

  return {
    canContinue,
    currentStepMetrics,
    gameData,
    handleFinishGame,
    handleLeaveActiveGame: confirmAndExitToHome,
    handleNextStep,
    handleRacerCompleted,
    handleRacerHoldSuccess,
    isGameFinished,
    isIntroPlaying,
    isPending,
    introState,
    memoHolds,
    memoLettersAndSymbols,
    memoWords,
    ownProgress,
    ownUser,
    step,
    syncStepFromProgress,
  };
}
