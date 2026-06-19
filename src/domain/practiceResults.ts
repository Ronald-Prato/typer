export interface PracticeRoundResult {
  errors: number;
  timeMs: number;
  accuracy: number;
  wpm: number;
}

export interface PracticeResultsSummary {
  totalRounds: number;
  averageTimeMs: number;
  averageErrors: number;
  averageAccuracy: number;
  averageWpm: number;
  roundedErrors: number;
  roundedAccuracy: number;
  roundedWpm: number;
  levelLabel: string;
  levelProgress: number;
  tip: string;
}

export function formatPracticeTime(timeMs: number) {
  if (!Number.isFinite(timeMs) || timeMs <= 0) {
    return "0.00s";
  }

  const seconds = Math.floor(timeMs / 1000);
  const milliseconds = Math.floor((timeMs % 1000) / 10);
  return `${seconds}.${milliseconds.toString().padStart(2, "0")}s`;
}

export function getPracticeResultTip({
  accuracy,
  errors,
  wpm,
}: {
  accuracy: number;
  errors: number;
  wpm: number;
}) {
  if (accuracy >= 98 && errors <= 1 && wpm >= 70) {
    return "Ritmo brutal y precisión limpia. Mantén esa cadencia.";
  }

  if (accuracy >= 95 && errors <= 3) {
    return "Tu precisión está sólida; reduce errores para subir de nivel.";
  }

  if (wpm >= 70 && accuracy < 92) {
    return "Vas muy rápido. Baja un poco el ritmo y protege la precisión.";
  }

  if (errors >= 6) {
    return "Hay varios tropiezos. Prioriza escribir limpio antes de acelerar.";
  }

  if (wpm < 35) {
    return "Buen control. Ahora intenta sostener un ritmo un poco más constante.";
  }

  if (accuracy < 85) {
    return "Enfócate en mirar una palabra adelante y corregir menos sobre la marcha.";
  }

  return "Buen avance. Sigue practicando para convertir el ritmo en consistencia.";
}

function getPracticeLevel(wpm: number) {
  if (wpm >= 80) return { label: "Avanzado", progress: 100 };
  if (wpm >= 60) return { label: "Rápido", progress: 78 };
  if (wpm >= 40) return { label: "En progreso", progress: 56 };
  return { label: "Calentando", progress: 34 };
}

export function summarizePracticeResults(
  rounds: PracticeRoundResult[]
): PracticeResultsSummary {
  const totalRounds = rounds.length;

  if (totalRounds === 0) {
    const level = getPracticeLevel(0);

    return {
      totalRounds,
      averageTimeMs: 0,
      averageErrors: 0,
      averageAccuracy: 0,
      averageWpm: 0,
      roundedErrors: 0,
      roundedAccuracy: 0,
      roundedWpm: 0,
      levelLabel: level.label,
      levelProgress: level.progress,
      tip: getPracticeResultTip({ accuracy: 0, errors: 0, wpm: 0 }),
    };
  }

  const averageTimeMs =
    rounds.reduce((sum, round) => sum + round.timeMs, 0) / totalRounds;
  const averageErrors =
    rounds.reduce((sum, round) => sum + round.errors, 0) / totalRounds;
  const averageAccuracy =
    rounds.reduce((sum, round) => sum + round.accuracy, 0) / totalRounds;
  const averageWpm =
    rounds.reduce((sum, round) => sum + round.wpm, 0) / totalRounds;
  const roundedErrors = Math.round(averageErrors);
  const roundedAccuracy = Math.round(averageAccuracy);
  const roundedWpm = Math.round(averageWpm);
  const level = getPracticeLevel(roundedWpm);

  return {
    totalRounds,
    averageTimeMs,
    averageErrors,
    averageAccuracy,
    averageWpm,
    roundedErrors,
    roundedAccuracy,
    roundedWpm,
    levelLabel: level.label,
    levelProgress: level.progress,
    tip: getPracticeResultTip({
      accuracy: roundedAccuracy,
      errors: roundedErrors,
      wpm: roundedWpm,
    }),
  };
}
