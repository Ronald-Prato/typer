import { describe, expect, it } from "vitest";
import {
  applyHoldInput,
  applyTypingInput,
  createHoldTypingState,
  createTypingState,
  getHoldTypingContentKey,
  getTypingSequenceContentKey,
  isCopyPasteShortcut,
  releaseHoldKey,
  pressHoldKey,
} from "./typingEngine";

describe("typingEngine", () => {
  it("starts timing on the first accepted character and records wrong positions once", () => {
    let state = createTypingState("cat");

    state = applyTypingInput(state, "c", 1_000);
    state = applyTypingInput(state, "cx", 1_100);
    state = applyTypingInput(state, "cx", 1_200);

    expect(state.startedAt).toBe(1_000);
    expect(state.errors).toEqual([1]);
    expect(state.input).toBe("cx");
    expect(state.completedAt).toBeNull();
  });

  it("ignores input beyond the target and completes with elapsed time", () => {
    let state = createTypingState("go");

    state = applyTypingInput(state, "g", 10);
    state = applyTypingInput(state, "go", 35);
    state = applyTypingInput(state, "gone", 50);

    expect(state.input).toBe("go");
    expect(state.hasCompleted).toBe(true);
    expect(state.completedAt).toBe(35);
    expect(state.elapsedMs).toBe(25);
  });

  it("advances hold words only while the required key is pressed", () => {
    let state = createHoldTypingState([
      { word: "ab", number: 2 },
      { word: "cd", number: 3 },
    ]);

    state = applyHoldInput(state, "a", 100);
    expect(state.input).toBe("");

    state = pressHoldKey(state, "2", 110);
    state = applyHoldInput(state, "ax", 120);
    state = applyHoldInput(state, "ab", 130);

    expect(state.currentIndex).toBe(1);
    expect(state.totalErrors).toBe(1);
    expect(state.input).toBe("");
    expect(state.isRequiredKeyPressed).toBe(false);

    state = pressHoldKey(state, "3", 140);
    state = applyHoldInput(state, "cd", 180);

    expect(state.hasCompleted).toBe(true);
    expect(state.elapsedMs).toBe(70);
  });

  it("resets partial hold input when the required key is released", () => {
    let state = createHoldTypingState([{ word: "ab", number: 2 }]);

    state = pressHoldKey(state, "2", 10);
    state = applyHoldInput(state, "a", 20);
    state = releaseHoldKey(state, "2");

    expect(state.input).toBe("");
    expect(state.errors).toEqual([]);
    expect(state.isRequiredKeyPressed).toBe(false);
  });

  it("detects blocked copy/paste shortcuts", () => {
    expect(isCopyPasteShortcut({ key: "v", ctrlKey: true })).toBe(true);
    expect(isCopyPasteShortcut({ key: "x", metaKey: true })).toBe(true);
    expect(isCopyPasteShortcut({ key: "a", ctrlKey: true })).toBe(false);
  });

  it("keeps content keys stable for equivalent sequence and hold arrays", () => {
    expect(getTypingSequenceContentKey(["ab", "cd"])).toBe(
      getTypingSequenceContentKey(["ab", "cd"])
    );
    expect(getTypingSequenceContentKey(["ab", "cd"])).not.toBe(
      getTypingSequenceContentKey(["ab", "ce"])
    );

    expect(
      getHoldTypingContentKey([
        { word: "shift", number: 1 },
        { word: "caps", number: 2 },
      ])
    ).toBe(
      getHoldTypingContentKey([
        { word: "shift", number: 1 },
        { word: "caps", number: 2 },
      ])
    );
    expect(getHoldTypingContentKey([{ word: "shift", number: 1 }])).not.toBe(
      getHoldTypingContentKey([{ word: "shift", number: 2 }])
    );
  });
});
