import { describe, expect, it } from "vitest";
import {
  formatPracticeTime,
  getPracticeResultTip,
  summarizePracticeResults,
} from "./practiceResults";

describe("practiceResults", () => {
  it("summarizes average practice metrics and level", () => {
    expect(
      summarizePracticeResults([
        { errors: 2, timeMs: 10_000, accuracy: 96, wpm: 70 },
        { errors: 4, timeMs: 12_000, accuracy: 94, wpm: 66 },
      ])
    ).toMatchObject({
      totalRounds: 2,
      averageTimeMs: 11_000,
      roundedErrors: 3,
      roundedAccuracy: 95,
      roundedWpm: 68,
      levelLabel: "Rápido",
      levelProgress: 78,
      tip: "Tu precisión está sólida; reduce errores para subir de nivel.",
    });
  });

  it("returns a safe empty summary", () => {
    expect(summarizePracticeResults([])).toMatchObject({
      totalRounds: 0,
      roundedErrors: 0,
      roundedAccuracy: 0,
      roundedWpm: 0,
      levelLabel: "Calentando",
    });
  });

  it("selects tips from accuracy, errors, and speed", () => {
    expect(getPracticeResultTip({ accuracy: 99, errors: 0, wpm: 82 })).toBe(
      "Ritmo brutal y precisión limpia. Mantén esa cadencia."
    );
    expect(getPracticeResultTip({ accuracy: 90, errors: 2, wpm: 74 })).toBe(
      "Vas muy rápido. Baja un poco el ritmo y protege la precisión."
    );
    expect(getPracticeResultTip({ accuracy: 94, errors: 7, wpm: 45 })).toBe(
      "Hay varios tropiezos. Prioriza escribir limpio antes de acelerar."
    );
    expect(getPracticeResultTip({ accuracy: 96, errors: 2, wpm: 28 })).toBe(
      "Tu precisión está sólida; reduce errores para subir de nivel."
    );
  });

  it("formats practice time consistently", () => {
    expect(formatPracticeTime(10_680)).toBe("10.68s");
    expect(formatPracticeTime(0)).toBe("0.00s");
  });
});
