import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useRacer } from "./useRacer";

function createKeyDownEvent(key: string) {
  return {
    altKey: false,
    ctrlKey: false,
    defaultPrevented: false,
    key,
    metaKey: false,
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent<HTMLInputElement>;
}

describe("useRacer", () => {
  it("allows mistakes to advance while recording wrong positions", () => {
    const { result } = renderHook(() =>
      useRacer({ lockOnError: true, phrase: "ab" })
    );

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "x" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.userInput).toBe("x");
    expect(result.current.errors).toEqual([0]);
    expect(result.current.mistake).toBeNull();
    expect(result.current.accuracy).toBe(50);

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "xy" },
      } as React.ChangeEvent<HTMLInputElement>);
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

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "á" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.userInput).toBe("á");
    expect(result.current.errors).toEqual([]);
    expect(result.current.mistake).toBeNull();
  });

  it("allows backspace after typing a mistake", () => {
    const { result } = renderHook(() =>
      useRacer({ lockOnError: true, phrase: "ab" })
    );
    const backspaceKey = createKeyDownEvent("Backspace");

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "x" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleKeyDown(backspaceKey);
    });

    expect(backspaceKey.preventDefault).not.toHaveBeenCalled();

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.userInput).toBe("");
    expect(result.current.errors).toEqual([0]);
    expect(result.current.mistake).toBeNull();
  });
});
