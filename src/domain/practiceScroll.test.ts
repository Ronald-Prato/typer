import { describe, expect, it } from "vitest";
import {
  countCompletedPracticeScrollParagraphs,
  countCompletedPracticeScrollLines,
  countCompletedPracticeScrollWords,
  getAverageBookPagesForWords,
  getBotScrollIndex,
  getCompetitiveScrollTravelPx,
  getCompetitiveScrollWinner,
  getNextPracticeScrollTravelPx,
  getPracticeScrollCharacterLine,
  getPracticeScrollCrossedLine,
  getPracticeScrollDangerLinePx,
  getPracticeScrollLineEndIndex,
  getPracticeScrollLines,
  getPracticeScrollLineStartIndex,
  getPracticeScrollProgress,
  getPracticeScrollText,
  getPracticeScrollSpeedPxPerSecond,
  getPracticeScrollWordLines,
  getRandomizedPracticeScrollText,
  getRandomizedPracticeScrollParagraphsAfterPrevious,
  getRandomizedPracticeScrollParagraphs,
  getRandomPracticeScrollParagraphIndex,
  getScrollMinimapWordBlocks,
  hasCompetitiveScrollStartSignal,
  hasCompetitiveScrollLineFailed,
  hasPracticeScrollLineReachedDangerLine,
  hasPracticeScrollMeasuredLineFailed,
  hasPracticeScrollReachedDangerLine,
  normalizeCompetitiveScrollProgress,
  PRACTICE_SCROLL_SPEED_INCREMENT_PX_PER_SECOND,
  PRACTICE_SCROLL_SPEED_PX_PER_SECOND,
  shouldAdvancePracticeScroll,
} from "./practiceScroll";

describe("practiceScroll", () => {
  it("advances only through the correct typed prefix", () => {
    expect(getPracticeScrollProgress("luz naranja", "luz")).toEqual({
      currentIndex: 3,
      completed: false,
      failed: false,
    });

    expect(getPracticeScrollProgress("luz naranja", "lux")).toEqual({
      currentIndex: 2,
      completed: false,
      failed: true,
    });
  });

  it("marks the paragraph complete when every character matches", () => {
    expect(getPracticeScrollProgress("fin", "fin")).toEqual({
      currentIndex: 3,
      completed: true,
      failed: false,
    });
  });

  it("builds one continuous scroll target from every available paragraph", () => {
    expect(
      getPracticeScrollText(["  Primer texto.  ", "", "Segundo texto."])
    ).toBe("Primer texto. Segundo texto.");
  });

  it("builds a continuous scroll target from randomized paragraph order", () => {
    const randomValues = [0.8, 0, 0.4];

    expect(
      getRandomizedPracticeScrollText(
        ["Primero.", "Segundo.", "Tercero.", "Cuarto."],
        () => randomValues.shift() ?? 0
      )
    ).toBe("Segundo. Tercero. Primero. Cuarto.");
  });

  it("randomizes the first scroll paragraph and the remaining paragraph order", () => {
    const paragraphs = ["Primero.", "Segundo.", "Tercero.", "Cuarto."];
    const randomValues = [0.8, 0, 0.4];

    expect(
      getRandomizedPracticeScrollParagraphs(paragraphs, () =>
        randomValues.shift() ?? 0
      )
    ).toEqual(["Segundo.", "Tercero.", "Primero.", "Cuarto."]);
    expect(paragraphs).toEqual(["Primero.", "Segundo.", "Tercero.", "Cuarto."]);
  });

  it("removes empty scroll paragraphs before randomizing", () => {
    expect(
      getRandomizedPracticeScrollParagraphs(
        ["  Primero.  ", "", "Segundo."],
        () => 0
      )
    ).toEqual(["Segundo.", "Primero."]);
  });

  it("starts a new randomized scroll run with a different first paragraph when possible", () => {
    expect(
      getRandomizedPracticeScrollParagraphsAfterPrevious({
        paragraphs: ["Primero.", "Segundo.", "Tercero."],
        previousFirstParagraph: "Primero.",
        random: () => 0,
      })
    ).toEqual(["Segundo.", "Tercero.", "Primero."]);
  });

  it("counts completed paragraphs inside the continuous scroll target", () => {
    const paragraphs = ["Primer texto.", "Segundo texto.", "", "Tercero."];

    expect(countCompletedPracticeScrollParagraphs(paragraphs, 0)).toBe(0);
    expect(countCompletedPracticeScrollParagraphs(paragraphs, 12)).toBe(0);
    expect(countCompletedPracticeScrollParagraphs(paragraphs, 13)).toBe(1);
    expect(countCompletedPracticeScrollParagraphs(paragraphs, 27)).toBe(1);
    expect(countCompletedPracticeScrollParagraphs(paragraphs, 28)).toBe(2);
    expect(countCompletedPracticeScrollParagraphs(paragraphs, 37)).toBe(3);
  });

  it("places the danger line in the middle of the scroll container", () => {
    expect(getPracticeScrollDangerLinePx(560)).toBe(280);
    expect(getPracticeScrollDangerLinePx(0)).toBe(0);
    expect(getPracticeScrollDangerLinePx(Number.NaN)).toBe(0);
  });

  it("estimates wrapped lines with explicit line breaks and bounded indexes", () => {
    expect(getPracticeScrollCharacterLine("abcd efgh", 0, 4)).toBe(0);
    expect(getPracticeScrollCharacterLine("abcd efgh", 4, 4)).toBe(1);
    expect(getPracticeScrollCharacterLine("ab\ncd", 3, 4)).toBe(1);
    expect(getPracticeScrollCharacterLine("abcd", 99, 2)).toBe(2);
  });

  it("fails only when the full pending line has not been completed before crossing the centered danger line", () => {
    const config = {
      charsPerLine: 5,
      lineHeightPx: 40,
      startOffsetPx: 220,
      dangerLinePx: getPracticeScrollDangerLinePx(96),
    };

    expect(getPracticeScrollLineEndIndex("uno dos tres", 0, 5)).toBe(5);

    expect(
      hasPracticeScrollReachedDangerLine("uno dos tres", 0, 150, config)
    ).toBe(false);
    expect(
      hasPracticeScrollReachedDangerLine("uno dos tres", 4, 172, config)
    ).toBe(true);
    expect(
      hasPracticeScrollReachedDangerLine("uno dos tres", 5, 172, config)
    ).toBe(false);
    expect(
      hasPracticeScrollReachedDangerLine("uno dos tres", 5, 212, config)
    ).toBe(true);
    expect(
      hasPracticeScrollReachedDangerLine("uno dos tres", 13, 300, config)
    ).toBe(false);
  });

  it("allows completed lines to pass the danger line without failing", () => {
    const config = {
      charsPerLine: 5,
      lineHeightPx: 40,
      startOffsetPx: 220,
      dangerLinePx: getPracticeScrollDangerLinePx(96),
    };
    const text = "aaaaabbbbbcccccddddd";
    const threeCompletedLinesIndex = 15;

    expect(getPracticeScrollLineStartIndex(text, 0, 5)).toBe(0);
    expect(getPracticeScrollLineStartIndex(text, 3, 5)).toBe(15);
    expect(getPracticeScrollCrossedLine(172, config)).toBe(0);
    expect(getPracticeScrollCrossedLine(252, config)).toBe(2);
    expect(getPracticeScrollCrossedLine(292, config)).toBe(3);

    expect(
      hasPracticeScrollReachedDangerLine(
        text,
        threeCompletedLinesIndex,
        172,
        config
      )
    ).toBe(false);
    expect(
      hasPracticeScrollReachedDangerLine(
        text,
        threeCompletedLinesIndex,
        252,
        config
      )
    ).toBe(false);
    expect(
      hasPracticeScrollReachedDangerLine(
        text,
        threeCompletedLinesIndex,
        292,
        config
      )
    ).toBe(true);
  });

  it("uses measured line positions to fail only crossed incomplete lines", () => {
    const lines = getPracticeScrollLines("aaaaabbbbbccccc", 5).map(
      (line, index) => ({
        ...line,
        topY: 80 + index * 40,
        bottomY: 120 + index * 40,
      })
    );

    expect(lines).toMatchObject([
      { text: "aaaaa", startIndex: 0, endIndex: 5 },
      { text: "bbbbb", startIndex: 5, endIndex: 10 },
      { text: "ccccc", startIndex: 10, endIndex: 15 },
    ]);

    expect(
      hasPracticeScrollMeasuredLineFailed({
        currentIndex: 10,
        laserY: 120,
        lines,
      })
    ).toBe(false);
    expect(
      hasPracticeScrollMeasuredLineFailed({
        currentIndex: 10,
        laserY: 160,
        lines,
      })
    ).toBe(false);
    expect(
      hasPracticeScrollMeasuredLineFailed({
        currentIndex: 10,
        laserY: 181,
        lines,
      })
    ).toBe(true);
  });

  it("detects crossed incomplete word lines from scroll geometry", () => {
    const lines = getPracticeScrollWordLines(
      "La ciudad despertaba bajo una lluvia naranja. En la ventana"
    );
    const config = {
      dangerLinePx: 280,
      lineHeightPx: 70,
      startOffsetPx: 430,
    };

    expect(
      hasPracticeScrollLineReachedDangerLine({
        currentIndex: lines[0].endIndex,
        lines,
        travelPx: 185,
        config,
      })
    ).toBe(false);
    expect(
      hasPracticeScrollLineReachedDangerLine({
        currentIndex: lines[0].endIndex,
        lines,
        travelPx: 256,
        config,
      })
    ).toBe(true);
  });

  it("ignores invalid line heights for geometry failure checks", () => {
    expect(
      hasPracticeScrollLineReachedDangerLine({
        currentIndex: 0,
        lines: getPracticeScrollWordLines("texto corto"),
        travelPx: 999,
        config: {
          dangerLinePx: 280,
          lineHeightPx: 0,
          startOffsetPx: 430,
        },
      })
    ).toBe(false);
  });

  it("builds scroll lines from whole-word groups of three words", () => {
    const lines = getPracticeScrollWordLines(
      "La ciudad despertaba bajo una lluvia naranja. En la ventana"
    );

    expect(lines.map((line) => line.text)).toEqual([
      "La ciudad despertaba",
      "bajo una lluvia",
      "naranja. En la",
      "ventana",
    ]);
    expect(lines.map((line) => line.text.split(/\s+/).length)).toEqual([
      3, 3, 3, 1,
    ]);
    expect(lines[1]).toMatchObject({
      startIndex: 21,
      endIndex: 36,
    });
  });

  it("preserves a short final line when fewer than three words remain", () => {
    const lines = getPracticeScrollWordLines("uno dos tres cuatro cinco");

    expect(lines.map((line) => line.text)).toEqual([
      "uno dos tres",
      "cuatro cinco",
    ]);
    expect(lines.map((line) => line.text.split(/\s+/).length)).toEqual([
      3, 2,
    ]);
    expect(lines[1]).toMatchObject({
      startIndex: 13,
      endIndex: 25,
    });
  });

  it("counts completed scroll lines for the active paragraph", () => {
    const lines = getPracticeScrollWordLines(
      "La ciudad despertaba bajo una lluvia naranja"
    );

    expect(countCompletedPracticeScrollLines(lines, 0)).toBe(0);
    expect(countCompletedPracticeScrollLines(lines, lines[0].endIndex)).toBe(1);
    expect(
      countCompletedPracticeScrollLines(lines, lines[1].endIndex - 1)
    ).toBe(1);
    expect(countCompletedPracticeScrollLines(lines, lines[1].endIndex)).toBe(2);
  });

  it("increases scroll speed by the configured increment for each completed line", () => {
    expect(
      getPracticeScrollSpeedPxPerSecond({
        baseSpeedPxPerSecond: 16,
        completedLineCount: 0,
      })
    ).toBe(16);
    expect(
      getPracticeScrollSpeedPxPerSecond({
        baseSpeedPxPerSecond: 16,
        completedLineCount: 3,
      })
    ).toBe(19);
    expect(
      getPracticeScrollSpeedPxPerSecond({
        baseSpeedPxPerSecond: 16,
        completedLineCount: 3,
        speedIncrementPxPerSecond: 0.5,
      })
    ).toBe(17.5);
    expect(
      getPracticeScrollSpeedPxPerSecond({
        baseSpeedPxPerSecond: 16,
        completedLineCount: 3,
        speedIncrementPxPerSecond: 2,
      })
    ).toBe(22);
  });

  it("advances scroll travel incrementally without retroactive speed jumps", () => {
    const travelBeforeLineCompletion = getNextPracticeScrollTravelPx({
      currentTravelPx: 0,
      elapsedMs: 10_000,
      speedPxPerSecond: PRACTICE_SCROLL_SPEED_PX_PER_SECOND,
    });
    const nextTravelAfterLineCompletion = getNextPracticeScrollTravelPx({
      currentTravelPx: travelBeforeLineCompletion,
      elapsedMs: 16,
      speedPxPerSecond:
        PRACTICE_SCROLL_SPEED_PX_PER_SECOND +
        PRACTICE_SCROLL_SPEED_INCREMENT_PX_PER_SECOND,
    });

    expect(travelBeforeLineCompletion).toBe(128);
    expect(nextTravelAfterLineCompletion).toBeCloseTo(128.2112, 5);
    expect(nextTravelAfterLineCompletion).toBeLessThan(129);
  });

  it("ignores invalid incremental scroll travel values", () => {
    expect(
      getNextPracticeScrollTravelPx({
        currentTravelPx: -10,
        elapsedMs: -1,
        speedPxPerSecond: Number.NaN,
      })
    ).toBe(0);
  });

  it("waits to advance the scroll until typing starts", () => {
    expect(
      shouldAdvancePracticeScroll({
        hasStartedTyping: false,
        isFinished: false,
      })
    ).toBe(false);
    expect(
      shouldAdvancePracticeScroll({
        hasStartedTyping: true,
        isFinished: false,
      })
    ).toBe(true);
    expect(
      shouldAdvancePracticeScroll({
        hasStartedTyping: true,
        isFinished: true,
      })
    ).toBe(false);
  });

  it("selects a random paragraph without repeating the previous index when possible", () => {
    expect(
      getRandomPracticeScrollParagraphIndex({
        paragraphCount: 4,
        previousIndex: 2,
        random: () => 0.5,
      })
    ).toBe(3);
    expect(
      getRandomPracticeScrollParagraphIndex({
        paragraphCount: 4,
        previousIndex: 2,
        random: () => 0.1,
      })
    ).toBe(0);
    expect(
      getRandomPracticeScrollParagraphIndex({
        paragraphCount: 1,
        previousIndex: 0,
        random: () => 0.8,
      })
    ).toBe(0);
  });

  it("counts completed words and formats average book pages", () => {
    expect(countCompletedPracticeScrollWords("uno dos tres", 0)).toBe(0);
    expect(countCompletedPracticeScrollWords("uno dos tres", 7)).toBe(2);
    expect(getAverageBookPagesForWords(25)).toBe("0.1");
    expect(getAverageBookPagesForWords(250)).toBe("1.0");
  });

  it("normalizes competitive scroll progress with completed word counts", () => {
    expect(
      normalizeCompetitiveScrollProgress({
        currentIndex: 7,
        errors: 2,
        now: 1000,
        startedAt: 500,
        text: "uno dos tres",
      })
    ).toEqual({
      currentIndex: 7,
      typedWords: 2,
      failed: false,
      completed: false,
      startedAt: 500,
      finishedAt: undefined,
      errors: 2,
    });

    expect(
      normalizeCompetitiveScrollProgress({
        currentIndex: 99,
        errors: 0,
        now: 2000,
        previousProgress: {
          currentIndex: 7,
          typedWords: 2,
          failed: false,
          completed: false,
          startedAt: 1000,
          errors: 2,
        },
        text: "uno dos",
      })
    ).toMatchObject({
      currentIndex: 7,
      typedWords: 2,
      completed: true,
      startedAt: 1000,
      finishedAt: 2000,
    });
  });

  it("decides the competitive scroll winner from completion or failure", () => {
    expect(
      getCompetitiveScrollWinner({
        playerIds: ["alice", "bob"],
        progressByPlayerId: {
          alice: {
            currentIndex: 10,
            typedWords: 2,
            failed: false,
            completed: true,
            startedAt: 1,
            finishedAt: 2,
            errors: 0,
          },
        },
      })
    ).toBe("alice");

    expect(
      getCompetitiveScrollWinner({
        playerIds: ["alice", "bob"],
        progressByPlayerId: {
          alice: {
            currentIndex: 4,
            typedWords: 1,
            failed: true,
            completed: false,
            startedAt: 1,
            finishedAt: 2,
            errors: 1,
          },
        },
      })
    ).toBe("bob");
  });

  it("treats persisted competitive scroll timing as a start signal only", () => {
    expect(hasCompetitiveScrollStartSignal({})).toBe(false);
    expect(
      hasCompetitiveScrollStartSignal({
        scrollStartedAt: 1_000,
      })
    ).toBe(true);
    expect(
      hasCompetitiveScrollStartSignal({
        progressByPlayerId: {
          alice: {
            currentIndex: 1,
            typedWords: 0,
            failed: false,
            completed: false,
            startedAt: 2_000,
            errors: 0,
          },
        },
      })
    ).toBe(true);
  });

  it("builds proportional minimap word blocks", () => {
    expect(getScrollMinimapWordBlocks("uno larguisima", 3)).toEqual([
      {
        text: "uno",
        startIndex: 0,
        endIndex: 3,
        width: 12,
        completed: true,
      },
      {
        text: "larguisima",
        startIndex: 4,
        endIndex: 14,
        width: 40,
        completed: false,
      },
    ]);
  });

  it("calculates slow bot scroll progress from elapsed time", () => {
    expect(
      getBotScrollIndex({
        charsPerSecond: 5,
        now: 3_500,
        startedAt: 1_000,
        textLength: 20,
      })
    ).toBe(12);
    expect(
      getBotScrollIndex({
        charsPerSecond: 50,
        now: 3_500,
        startedAt: 1_000,
        textLength: 20,
      })
    ).toBe(20);
  });

  it("calculates competitive scroll travel from persisted start time", () => {
    expect(
      getCompetitiveScrollTravelPx({
        baseSpeedPxPerSecond: PRACTICE_SCROLL_SPEED_PX_PER_SECOND,
        completedLineCount: 4,
        now: 4_000,
        speedIncrementPxPerSecond: PRACTICE_SCROLL_SPEED_INCREMENT_PX_PER_SECOND,
        startedAt: 1_000,
      })
    ).toBe(43.2);
    expect(
      getCompetitiveScrollTravelPx({
        baseSpeedPxPerSecond: PRACTICE_SCROLL_SPEED_PX_PER_SECOND,
        completedLineCount: 4,
        finishedAt: 2_000,
        now: 4_000,
        speedIncrementPxPerSecond: PRACTICE_SCROLL_SPEED_INCREMENT_PX_PER_SECOND,
        startedAt: 1_000,
      })
    ).toBe(14.4);
    expect(
      getCompetitiveScrollTravelPx({
        baseSpeedPxPerSecond: PRACTICE_SCROLL_SPEED_PX_PER_SECOND,
        completedLineCount: 4,
        now: 4_000,
        speedIncrementPxPerSecond: PRACTICE_SCROLL_SPEED_INCREMENT_PX_PER_SECOND,
      })
    ).toBe(0);
  });

  it("detects competitive scroll failure from crossed word lines", () => {
    const lines = getPracticeScrollWordLines("uno dos tres cuatro cinco");
    const config = {
      lineHeightPx: 40,
      startOffsetPx: 120,
      dangerLinePx: 80,
    };

    expect(
      hasCompetitiveScrollLineFailed({
        currentIndex: lines[1].endIndex,
        lines,
        travelPx: 80,
        config,
      })
    ).toBe(false);
    expect(
      hasCompetitiveScrollLineFailed({
        currentIndex: lines[1].endIndex - 1,
        lines,
        travelPx: 80,
        config,
      })
    ).toBe(true);
  });
});
