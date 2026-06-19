"use client";

import { motion } from "@/motion";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { Racer } from "@/components/Racer";
import { RacerHold } from "@/components/RacerHold";
import { RacerWords } from "@/components/RacerWords";
import { GameMetrics } from "@/components/GameMetrics";
import { Modal, type ModalRefProps } from "@/components/Modal/Modal";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/Typography";
import { MatchProgress } from "./MatchProgress";
import type { MatchStageStep, RawTypingMetrics } from "@/domain/matchFlow";

interface StageGameContentProps {
  holds: { word: string; number: number }[];
  isWinnerSet?: boolean;
  lettersAndSymbols: string[];
  phrase: string;
  step: MatchStageStep;
  words: string[];
  onRacerCompleted: (data: RawTypingMetrics) => void;
  onRacerHoldSuccess: (data?: RawTypingMetrics) => void;
}

interface FinishedMatchViewProps {
  isPending: boolean;
  metrics?: {
    phraseMetrics?: RawTypingMetrics;
    wordsMetrics?: RawTypingMetrics;
    lettersAndSymbolsMetrics?: RawTypingMetrics;
    holdsMetrics?: RawTypingMetrics;
  };
  modalRef: React.RefObject<ModalRefProps | null>;
  onFinishGame: () => void;
}

interface ActiveMatchViewProps extends StageGameContentProps {
  canContinue: boolean;
  onFinishGame: () => void;
  onNextStep: () => void;
}

function PlatformKeyHint({ mac, other }: { mac: string; other: string }) {
  const label =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0
      ? mac
      : other;

  return (
    <div
      className="w-12 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
      style={{
        boxShadow:
          "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      {label}
    </div>
  );
}

export function StageGameContent({
  holds,
  isWinnerSet,
  lettersAndSymbols,
  phrase,
  step,
  words,
  onRacerCompleted,
  onRacerHoldSuccess,
}: StageGameContentProps) {
  if (step === "1") {
    return (
      <Racer
        hideStats
        phrase={phrase}
        withCompleteFeedback
        onCompleted={onRacerCompleted}
      />
    );
  }

  if (step === "2") {
    return (
      <RacerWords
        hideBullets
        words={words}
        hideStats
        onCompleted={onRacerCompleted}
      />
    );
  }

  if (step === "3") {
    return (
      <RacerWords
        hideBullets
        hideStats
        words={lettersAndSymbols}
        onCompleted={onRacerCompleted}
      />
    );
  }

  if (step === "4" && !isWinnerSet) {
    return (
      <RacerHold
        hideBullets
        holds={holds}
        onSuccess={onRacerHoldSuccess}
      />
    );
  }

  return null;
}

export function FinishedMatchView({
  isPending,
  metrics,
  modalRef,
  onFinishGame,
}: FinishedMatchViewProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-start space-y-6">
      <MatchProgress />

      <div className="w-full h-full flex flex-col items-center justify-start space-y-6"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex items-center space-x-4 mt-6"
      >
        <Button
          onClick={() => modalRef.current?.openModal()}
          className="w-48 py-3 relative bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-200"
        >
          <div className="flex items-center space-x-3">
            <Text variant="body2" className="text-white font-bold">
              Estadísticas
            </Text>
            <PlatformKeyHint mac="⌘ J" other="Ctrl J" />
          </div>
        </Button>

        <Button
          onClick={onFinishGame}
          disabled={isPending}
          className="w-48 py-3 relative"
        >
          <div className="flex items-center space-x-3">
            <Text variant="body2" className="text-white font-bold">
              Continuar
            </Text>
            <PlatformKeyHint mac="⌘ K" other="Ctrl K" />
          </div>
        </Button>
      </motion.div>

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
                <PlatformKeyHint mac="ESC" other="ESC" />
              </div>
            </Button>
            <Button
              onClick={onFinishGame}
              disabled={isPending}
              className="flex-1"
            >
              <div className="flex items-center space-x-4">
                <Text variant="body2">Continuar</Text>
                <PlatformKeyHint mac="⌘ K" other="Ctrl K" />
              </div>
            </Button>
          </div>
        </Modal.Bottom>
      </Modal>
    </div>
  );
}

export function ActiveMatchView({
  canContinue,
  onFinishGame,
  onNextStep,
  ...contentProps
}: ActiveMatchViewProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-start space-y-6">
      <Button onClick={onFinishGame}>
        <div className="flex items-center space-x-3">
          <ArrowRightOnRectangleIcon className="size-3 text-white" />
          <Text variant="body2" className="text-white font-bold">
            Abandonar
          </Text>
          <PlatformKeyHint mac="⌘ X" other="Ctrl X" />
        </div>
      </Button>

      <MatchProgress />

      <motion.div
        key={contentProps.step}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="mt-10"
      >
        <StageGameContent {...contentProps} />
      </motion.div>

      <div className="mt-4">
        <Button
          disabled={!canContinue}
          onClick={onNextStep}
          className={`w-[20rem] relative overflow-hidden ${
            canContinue ? "animate-pulse shadow-xl shadow-orange-500/50" : ""
          }`}
        >
          {canContinue && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_500ms_ease-in-out_infinite]" />
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-lg opacity-75 blur-sm animate-pulse" />
            </>
          )}

          <div className="flex items-center space-x-4 relative z-10">
            <Text variant="body1">Avanzar</Text>
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
}
