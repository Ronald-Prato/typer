"use client";

import {
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { ResultsOverlay } from "@/components/overlays/ResultsOverlay";
import { TYPOCOIN_REWARD_FOR_1V1_WIN } from "@/domain/currency";
import { getAverageBookPagesForWords } from "@/domain/practiceScroll";
import { formatTypingTime } from "@/domain/typingEngine";

type CompetitiveScrollResultsProps = {
  completedWords: number;
  elapsedMs: number;
  errors: number;
  isVisible: boolean;
  isWinner: boolean;
  onClose: () => void;
  opponentTypedWords: number;
  typedPercent: number;
};

export function CompetitiveScrollResults({
  completedWords,
  elapsedMs,
  errors,
  isVisible,
  isWinner,
  onClose,
  opponentTypedWords,
  typedPercent,
}: CompetitiveScrollResultsProps) {
  return (
    <ResultsOverlay
      isVisible={isVisible}
      roundsData={[]}
      onClose={onClose}
      title={isWinner ? "Victoria" : "Derrota"}
      description={
        isWinner
          ? "Le ganaste al scroll antes que tu rival."
          : "Tu rival sobrevivió mejor al scroll."
      }
      heroValue={String(completedWords)}
      heroSuffix="palabras"
      heroLabel="Texto escrito"
      heroIcon={<DocumentTextIcon className="size-8" />}
      closeLabel="Continuar"
      typocoinRewardAmount={isWinner ? TYPOCOIN_REWARD_FOR_1V1_WIN : undefined}
      shortcutDelayMs={!isWinner ? 500 : 0}
      tipTitle="Lectura de la partida"
      tip={`${completedWords} palabras equivalen a ${getAverageBookPagesForWords(completedWords)} páginas promedio de libro. Tu rival llegó a ${opponentTypedWords} palabras.`}
      showTipPanel
      levelLabel={isWinner ? "Victoria" : "Derrota"}
      levelProgress={typedPercent}
      stats={[
        {
          icon: <DocumentTextIcon className="size-5" />,
          label: "Palabras",
          value: String(completedWords),
          tone: "emerald",
        },
        {
          icon: <ClockIcon className="size-5" />,
          label: "Tiempo",
          value: formatTypingTime(elapsedMs),
          tone: "blue",
        },
        {
          icon: <ExclamationTriangleIcon className="size-5" />,
          label: "Errores",
          value: String(errors),
          tone: "rose",
        },
      ]}
    />
  );
}
