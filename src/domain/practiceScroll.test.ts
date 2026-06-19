import { describe, expect, it } from "vitest";
import {
  countCompletedPracticeScrollParagraphs,
  countCompletedPracticeScrollLines,
  countCompletedPracticeScrollWords,
  getAverageBookPagesForWords,
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
  getRandomPracticeScrollParagraphIndex,
  hasPracticeScrollMeasuredLineFailed,
  hasPracticeScrollReachedDangerLine,
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

  it("builds scroll lines from whole-word groups of three or four words", () => {
    const lines = getPracticeScrollWordLines(
      "La ciudad despertaba bajo una lluvia naranja. En la ventana"
    );

    expect(lines.map((line) => line.text)).toEqual([
      "La ciudad despertaba bajo",
      "una lluvia naranja.",
      "En la ventana",
    ]);
    expect(lines.map((line) => line.text.split(/\s+/).length)).toEqual([
      4, 3, 3,
    ]);
    expect(lines[1]).toMatchObject({
      startIndex: 26,
      endIndex: 45,
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
});
