"use client";

import {
  BookOpenIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { ResultsOverlay } from "@/components/overlays/ResultsOverlay";
import { formatTypingTime } from "@/domain/typingEngine";

type PracticeScrollResultsProps = {
  averageBookPages: string;
  completedWords: number;
  elapsedMs: number;
  failed: boolean;
  isVisible: boolean;
  onBackToModes: () => void;
  onRestart: () => void;
  typedPercent: number;
};

export function PracticeScrollResults({
  averageBookPages,
  completedWords,
  elapsedMs,
  failed,
  isVisible,
  onBackToModes,
  onRestart,
  typedPercent,
}: PracticeScrollResultsProps) {
  return (
    <ResultsOverlay
      isVisible={isVisible}
      roundsData={[]}
      onClose={onBackToModes}
      onRestart={onRestart}
      title={failed ? "La línea te alcanzó" : "Scroll completado"}
      description={
        failed
          ? "Llegaste hasta aquí antes de que el texto tocara el límite."
          : "Buen ritmo. Le ganaste al scroll."
      }
      heroValue={String(completedWords)}
      heroSuffix="palabras"
      heroLabel="Texto escrito"
      heroIcon={<DocumentTextIcon className="size-8" />}
      restartLabel="Reintentar"
      restartShortcut="Tab"
      shortcutDelayMs={failed ? 500 : 0}
      tipTitle="Lectura del intento"
      tip={`${completedWords} palabras equivalen a ${averageBookPages} páginas promedio de libro.`}
      showTipPanel={!failed}
      levelLabel={failed ? "Interrumpido" : "Completado"}
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
          icon: <BookOpenIcon className="size-5" />,
          label: "Páginas",
          value: averageBookPages,
          tone: "violet",
        },
      ]}
    />
  );
}
