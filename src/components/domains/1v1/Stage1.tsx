"use client";

import { useEffect } from "react";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { MatchIntroOverlay } from "@/components/domains/match/MatchIntroOverlay";
import { useReducedMotion } from "@/motion";
import { useMatchStageFlow } from "./useMatchStageFlow";
import { ActiveMatchView, FinishedMatchView } from "./Stage1Views";

interface Stage1Props {
  onStageCompleted: () => void;
}

export const Stage1 = (_props: Stage1Props) => {
  const {
    canContinue,
    gameData,
    handleFinishGame,
    handleLeaveActiveGame,
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
  } = useMatchStageFlow();
  const shouldReduceMotion = useReducedMotion();

  useGlobalShortcut({
    scope: "match",
    key: "k",
    modifier: "primary",
    enabled: isGameFinished,
    onShortcut: handleFinishGame,
  });

  useGlobalShortcut({
    scope: "match",
    key: "x",
    modifier: "primary",
    enabled: !isGameFinished,
    onShortcut: handleLeaveActiveGame,
  });

  useGlobalShortcut({
    scope: "match",
    key: "Enter",
    enabled: isIntroPlaying && canContinue && !isGameFinished,
    onShortcut: handleNextStep,
  });

  useEffect(() => {
    syncStepFromProgress();
  }, [ownProgress, syncStepFromProgress]);

  if (isGameFinished) {
    return (
      <FinishedMatchView
        isWinner={Boolean(ownUser && gameData?.game?.winner === ownUser._id)}
        isPending={isPending}
        metrics={ownProgress}
        onFinishGame={handleFinishGame}
      />
    );
  }

  return (
    <>
      <MatchIntroOverlay
        countdownValue={introState.countdownValue}
        isVisible={Boolean(
          gameData?.game && !isGameFinished && introState.phase !== "playing"
        )}
        opponent={gameData?.opponent}
        ownUser={ownUser}
        phase={introState.phase}
        shouldReduceMotion={Boolean(shouldReduceMotion)}
      />
      <ActiveMatchView
        canContinue={canContinue}
        holds={memoHolds}
        isPlayable={isIntroPlaying}
        isWinnerSet={Boolean(gameData?.game?.winner)}
        lettersAndSymbols={memoLettersAndSymbols}
        phrase={gameData?.game?.phrase || ""}
        step={step}
        words={memoWords}
        onLeaveActiveGame={handleLeaveActiveGame}
        onNextStep={handleNextStep}
        onRacerCompleted={handleRacerCompleted}
        onRacerHoldSuccess={handleRacerHoldSuccess}
      />
    </>
  );
};
