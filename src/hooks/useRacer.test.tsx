import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useRacer } from "./useRacer";

function createKeyDownEvent(
  key: string,
  options: { code?: string; shiftKey?: boolean } = {}
) {
  return {
    altKey: false,
    code: options.code,
    ctrlKey: false,
    defaultPrevented: false,
    key,
    metaKey: false,
    preventDefault: vi.fn(),
    shiftKey: options.shiftKey,
  } as unknown as React.KeyboardEvent<HTMLInputElement>;
}

function createInputChangeEvent(value: string) {
  const input = { value } as HTMLInputElement;

  return {
    event: {
      currentTarget: input,
      preventDefault: vi.fn(),
      target: input,
    } as unknown as React.ChangeEvent<HTMLInputElement>,
    input,
  };
}

describe("useRacer", () => {
  it("allows mistakes to advance while recording wrong positions", () => {
    const { result } = renderHook(() =>
      useRacer({ lockOnError: true, phrase: "ab" })
    );
    const firstChange = createInputChangeEvent("x");

    act(() => {
      result.current.handleInputChange(firstChange.event);
    });

    expect(result.current.userInput).toBe("x");
    expect(result.current.errors).toEqual([0]);
    expect(result.current.mistake).toBeNull();
    expect(result.current.accuracy).toBe(50);
    const secondChange = createInputChangeEvent("xy");

    act(() => {
      result.current.handleInputChange(secondChange.event);
    });

    expect(result.current.userInput).toBe("xy");
    expect(result.current.errors).toEqual([0, 1]);
    expect(result.current.mistake).toBeNull();
    expect(result.current.accuracy).toBe(0);
  });

  it("does not prevent wrong printable keys before the hidden input advances", () => {
    const { result } = renderHook(() =>
      useRacer({ lockOnError: true, phrase: "ab" })
    );
    const wrongKey = createKeyDownEvent("x");

    act(() => {
      result.current.handleKeyDown(wrongKey);
    });

    expect(wrongKey.preventDefault).not.toHaveBeenCalled();
    expect(result.current.userInput).toBe("");
    expect(result.current.errors).toEqual([]);
    expect(result.current.mistake).toBeNull();
  });

  it("lets Spanish dead-key input reach the composed character", () => {
    const { result } = renderHook(() =>
      useRacer({ lockOnError: true, phrase: "árbol" })
    );
    const deadKey = createKeyDownEvent("Dead");
    const vowelKey = createKeyDownEvent("a");

    act(() => {
      result.current.handleKeyDown(deadKey);
      result.current.handleKeyDown(vowelKey);
    });

    expect(deadKey.preventDefault).not.toHaveBeenCalled();
    expect(vowelKey.preventDefault).not.toHaveBeenCalled();
    expect(result.current.userInput).toBe("");
    expect(result.current.errors).toEqual([]);
    expect(result.current.pendingDeadKey).toBeNull();
    const composedInput = createInputChangeEvent("á");

    act(() => {
      result.current.handleInputChange(composedInput.event);
    });

    expect(result.current.userInput).toBe("á");
    expect(result.current.errors).toEqual([]);
    expect(result.current.mistake).toBeNull();
    expect(result.current.pendingDeadKey).toBeNull();
    expect(composedInput.input.value).toBe("á");
  });

  it("does not re-render while a browser dead key is pending", () => {
    const { result } = renderHook(() =>
      useRacer({ lockOnError: true, phrase: "árbol" })
    );
    const deadKey = createKeyDownEvent("Dead", { code: "Quote" });

    act(() => {
      result.current.handleKeyDown(deadKey);
    });

    expect(result.current.userInput).toBe("");
    expect(result.current.errors).toEqual([]);
    expect(result.current.pendingDeadKey).toBeNull();
  });

  it("syncs the hidden input back when a standalone accent is ignored", () => {
    const { result } = renderHook(() =>
      useRacer({ lockOnError: true, phrase: "té" })
    );
    const firstChange = createInputChangeEvent("t");

    act(() => {
      result.current.handleInputChange(firstChange.event);
    });

    expect(result.current.userInput).toBe("t");
    const deadAccentChange = createInputChangeEvent("t´");

    act(() => {
      result.current.handleInputChange(deadAccentChange.event);
    });

    expect(result.current.userInput).toBe("t");
    expect(result.current.errors).toEqual([]);
    expect(deadAccentChange.input.value).toBe("t");
    const composedInput = createInputChangeEvent("té");

    act(() => {
      result.current.handleInputChange(composedInput.event);
    });

    expect(result.current.userInput).toBe("té");
    expect(result.current.hasCompleted).toBe(true);
    expect(composedInput.input.value).toBe("té");
  });

  it("allows backspace after typing a mistake", () => {
    const { result } = renderHook(() =>
      useRacer({ lockOnError: true, phrase: "ab" })
    );
    const backspaceKey = createKeyDownEvent("Backspace");
    const mistakeChange = createInputChangeEvent("x");

    act(() => {
      result.current.handleInputChange(mistakeChange.event);
    });

    act(() => {
      result.current.handleKeyDown(backspaceKey);
    });

    expect(backspaceKey.preventDefault).not.toHaveBeenCalled();
    const deleteChange = createInputChangeEvent("");

    act(() => {
      result.current.handleInputChange(deleteChange.event);
    });

    expect(result.current.userInput).toBe("");
    expect(result.current.errors).toEqual([0]);
    expect(result.current.mistake).toBeNull();
  });
});
