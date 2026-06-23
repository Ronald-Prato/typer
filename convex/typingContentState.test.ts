import { describe, expect, test } from "vitest";

import { typingContentSeed } from "./typingContentSeed";
import {
  buildMatchTypingContent,
  buildTypingContentSeedRows,
  emptyTypingContentPool,
  getActiveTypingContentPool,
} from "./typingContentState";

describe("typingContentState", () => {
  test("builds stable seed rows for every local typing content item", () => {
    const rows = buildTypingContentSeedRows(typingContentSeed);
    const sourceKeys = rows.map((row) => row.sourceKey);

    expect(rows).toHaveLength(669);
    expect(new Set(sourceKeys).size).toBe(rows.length);
    expect(rows[0]).toMatchObject({
      kind: "practicePhrase",
      sourceKey: "practicePhrase:0001",
      sortOrder: 0,
    });
    expect(rows.at(-1)).toMatchObject({
      kind: "scrollParagraph",
      sourceKey: "scrollParagraph:0015",
      sortOrder: 14,
    });
  });

  test("creates active content pools in sort order", () => {
    const pool = getActiveTypingContentPool([
      { kind: "classicWord", text: "dos", sortOrder: 2, active: true },
      { kind: "classicWord", text: "inactivo", sortOrder: 1, active: false },
      { kind: "classicWord", text: "uno", sortOrder: 1, active: true },
      { kind: "practicePhrase", text: " frase ", sortOrder: 1, active: true },
    ]);

    expect(pool.classicWord).toEqual(["uno", "dos"]);
    expect(pool.practicePhrase).toEqual(["frase"]);
  });

  test("selects classic and scroll match snapshots from content pools", () => {
    const pool = {
      practicePhrase: ["frase uno"],
      classicWord: ["alfa", "beta"],
      classicCharacter: ["A", "!"],
      scrollParagraph: ["Primer parrafo.", "Segundo parrafo."],
    };
    const randomValues = [0, 0.9, 0, 0.9, 0, 0.9, 0, 0.1, 0.9, 0.2, 0.8, 0.3];
    let index = 0;
    const random = () => randomValues[index++ % randomValues.length];

    const classic = buildMatchTypingContent(pool, "classic", random);
    expect(classic).toMatchObject({
      phrase: "frase uno",
      words: ["alfa", "beta", "alfa", "beta", "alfa", "beta"],
    });
    expect(classic.lettersAndSymbols).toHaveLength(6);
    expect(classic.holdsWords).toHaveLength(6);

    const scroll = buildMatchTypingContent(pool, "scroll", () => 0);
    expect(scroll.scrollText).toContain("Primer parrafo.");
    expect(scroll.scrollText).toContain("Segundo parrafo.");
  });

  test("fails clearly when required typing content is missing", () => {
    expect(() =>
      buildMatchTypingContent(emptyTypingContentPool(), "scroll")
    ).toThrow("Ejecuta migrations:seedTypingContent");
  });
});
