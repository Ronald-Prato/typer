"use client";

import { motion } from "@/motion";
import {
  ArrowRightOnRectangleIcon,
  BoltIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Racer } from "@/components/Racer";
import { RacerHold } from "@/components/RacerHold";
import { RacerWords } from "@/components/RacerWords";
import { ResultsOverlay } from "@/components/overlays/ResultsOverlay";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/Typography";
import { formatTypingTime } from "@/domain/typingEngine";
import { MatchProgress } from "./MatchProgress";
import {
  summarizeClassicMatchMetrics,
  type ClassicMatchProgressMetrics,
  type MatchStageStep,
  type RawTypingMetrics,
} from "@/domain/matchFlow";

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
  isWinner: boolean;
  isPending: boolean;
  metrics?: ClassicMatchProgressMetrics;
  onFinishGame: () => void;
}

interface ActiveMatchViewProps extends StageGameContentProps {
  canContinue: boolean;
  isPlayable: boolean;
  onLeaveActiveGame: () => void;
  onNextStep: () => void;
}

export function PlatformKeyHint({ mac, other }: { mac: string; other: string }) {
  const label =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0
      ? mac
      : other;

  return (
    <div
      className="flex h-6 w-12 items-center justify-center rounded border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-xs font-black text-[var(--tw-home-muted)] backdrop-blur-sm"
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
  isWinner,
  isPending,
  metrics,
  onFinishGame,
}: FinishedMatchViewProps) {
  const summary = summarizeClassicMatchMetrics(metrics);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-6">
      <MatchProgress />

      <ResultsOverlay
        closeLabel={isPending ? "Guardando..." : "Continuar"}
        description={
          isWinner
            ? "Cerraste el circuito clásico antes que tu rival."
            : "Tu rival completó el circuito clásico primero."
        }
        heroIcon={<BoltIcon className="size-8" />}
        heroLabel="Velocidad promedio"
        heroSuffix="WPM"
        heroValue={String(summary.averageWpm)}
        isVisible
        levelLabel={`${summary.completedStages}/${summary.stageCount} etapas`}
        levelProgress={(summary.completedStages / summary.stageCount) * 100}
        onClose={onFinishGame}
        roundsData={[]}
        shortcutDelayMs={!isWinner ? 500 : 0}
        showTipPanel
        stats={[
          {
            icon: <ClockIcon className="size-5" />,
            label: "Tiempo",
            value: formatTypingTime(summary.totalTimeMs),
            tone: "blue",
          },
          {
            icon: <SparklesIcon className="size-5" />,
            label: "Precisión",
            value: `${summary.averageAccuracy}%`,
            tone: "violet",
          },
          {
            icon: <ExclamationTriangleIcon className="size-5" />,
            label: "Errores",
            value: String(summary.totalErrors),
            tone: "rose",
          },
        ]}
        tip={`${summary.completedStages} de ${summary.stageCount} etapas registradas. Presiona Enter para continuar.`}
        tipTitle="Resumen de la partida"
        title={isWinner ? "Victoria" : "Derrota"}
      />
    </div>
  );
}

export function ActiveMatchView({
  canContinue,
  isPlayable,
  onLeaveActiveGame,
  onNextStep,
  ...contentProps
}: ActiveMatchViewProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-6">
      <button
        type="button"
        onClick={onLeaveActiveGame}
        className="absolute left-10 top-28 z-20 rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] px-4 py-2 text-sm font-black text-[var(--tw-home-fg)] shadow-[var(--tw-home-shadow)] transition-colors hover:border-orange-500/45 hover:text-orange-500"
      >
        <div className="flex items-center space-x-3">
          <ArrowRightOnRectangleIcon className="size-3" />
          <Text variant="body2" className="font-bold text-inherit">
            Abandonar
          </Text>
          <PlatformKeyHint mac="⌘ X" other="Ctrl X" />
        </div>
      </button>

      <MatchProgress />

      <motion.div
        key={contentProps.step}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="mt-10"
      >
        {isPlayable ? <StageGameContent {...contentProps} /> : null}
      </motion.div>

      <div className="mt-4">
        <Button
          disabled={!isPlayable || !canContinue}
          onClick={onNextStep}
          className="relative w-[20rem] overflow-hidden shadow-[0_14px_34px_rgba(249,115,22,0.22)] disabled:border disabled:border-[var(--tw-home-border)] disabled:bg-[var(--tw-home-panel)] disabled:bg-none disabled:text-[var(--tw-home-muted)] disabled:shadow-none"
        >
          <div className="flex items-center space-x-4 relative z-10">
            <Text variant="body1">Avanzar</Text>
            <div
              className={`flex h-6 w-12 items-center justify-center rounded border text-xs font-black backdrop-blur-sm transition-colors ${
                canContinue
                  ? "border-white/25 bg-white/18 text-white"
                  : "border-[var(--tw-home-border)] bg-[var(--tw-home-bg)] text-[var(--tw-home-muted)]"
              }`}
            >
              ENTER
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}
