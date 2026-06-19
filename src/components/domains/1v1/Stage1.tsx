"use client";

import { useEffect, useRef } from "react";
import { ModalRefProps } from "@/components/Modal/Modal";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { useMatchStageFlow } from "./useMatchStageFlow";
import { ActiveMatchView, FinishedMatchView } from "./Stage1Views";

interface Stage1Props {
  onStageCompleted: () => void;
}

export const Stage1 = (_props: Stage1Props) => {
  const modalRef = useRef<ModalRefProps>(null);
  const {
    canContinue,
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
    step,
    syncStepFromProgress,
  } = useMatchStageFlow();

  useGlobalShortcut({
    scope: "match",
    key: "j",
    modifier: "primary",
    enabled: isGameFinished,
    onShortcut: () => modalRef.current?.openModal(),
  });

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
    onShortcut: handleFinishGame,
  });

  useGlobalShortcut({
    scope: "match",
    key: "Enter",
    enabled: canContinue && !isGameFinished,
    onShortcut: handleNextStep,
  });

  useEffect(() => {
    syncStepFromProgress();
  }, [ownProgress, syncStepFromProgress]);

  if (isGameFinished) {
    return (
      <FinishedMatchView
        isPending={isPending}
        metrics={ownProgress}
        modalRef={modalRef}
        onFinishGame={handleFinishGame}
      />
    );
  }

  return (
    <ActiveMatchView
      canContinue={canContinue}
      holds={memoHolds}
      isWinnerSet={Boolean(gameData?.game?.winner)}
      lettersAndSymbols={memoLettersAndSymbols}
      phrase={gameData?.game?.phrase || ""}
      step={step}
      words={memoWords}
      onFinishGame={handleFinishGame}
      onNextStep={handleNextStep}
      onRacerCompleted={handleRacerCompleted}
      onRacerHoldSuccess={handleRacerHoldSuccess}
    />
  );
};
