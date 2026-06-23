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
  it("counts blocked mistakes without advancing practice input", () => {
    const { result } = renderHook(() =>
      useRacer({ lockOnError: true, phrase: "ab" })
    );

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "x" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.userInput).toBe("");
    expect(result.current.errors).toEqual([0]);
    expect(result.current.mistake).toMatchObject({ index: 0, char: "x" });
    expect(result.current.accuracy).toBe(50);

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "y" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.userInput).toBe("");
    expect(result.current.errors).toEqual([0, 0]);
    expect(result.current.mistake).toMatchObject({ index: 0, char: "y" });
    expect(result.current.accuracy).toBe(0);

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "a" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.userInput).toBe("a");
    expect(result.current.errors).toEqual([0, 0]);
    expect(result.current.mistake).toBeNull();
  });

  it("prevents wrong printable keys before the hidden input can advance", () => {
    const { result } = renderHook(() =>
      useRacer({ lockOnError: true, phrase: "ab" })
    );
    const firstWrongKey = createKeyDownEvent("x");
    const secondWrongKey = createKeyDownEvent("y");
    const correctKey = createKeyDownEvent("a");

    act(() => {
      result.current.handleKeyDown(firstWrongKey);
    });

    expect(firstWrongKey.preventDefault).toHaveBeenCalled();
    expect(result.current.userInput).toBe("");
    expect(result.current.errors).toEqual([0]);
    expect(result.current.mistake).toMatchObject({ index: 0, char: "x" });

    act(() => {
      result.current.handleKeyDown(secondWrongKey);
    });

    expect(secondWrongKey.preventDefault).toHaveBeenCalled();
    expect(result.current.userInput).toBe("");
    expect(result.current.errors).toEqual([0, 0]);
    expect(result.current.mistake).toMatchObject({ index: 0, char: "y" });

    act(() => {
      result.current.handleKeyDown(correctKey);
    });

    expect(correctKey.preventDefault).not.toHaveBeenCalled();

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "a" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.userInput).toBe("a");
    expect(result.current.errors).toEqual([0, 0]);
    expect(result.current.mistake).toBeNull();
  });

  it("uses the first backspace after a mistake to clear the highlight", () => {
    const { result } = renderHook(() =>
      useRacer({ lockOnError: true, phrase: "ab" })
    );
    const wrongKey = createKeyDownEvent("x");
    const firstBackspaceKey = createKeyDownEvent("Backspace");
    const secondBackspaceKey = createKeyDownEvent("Backspace");

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "a" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleKeyDown(wrongKey);
    });

    expect(result.current.userInput).toBe("a");
    expect(result.current.mistake).toMatchObject({ index: 1, char: "x" });

    act(() => {
      result.current.handleKeyDown(firstBackspaceKey);
    });

    expect(firstBackspaceKey.preventDefault).toHaveBeenCalled();
    expect(result.current.userInput).toBe("a");
    expect(result.current.errors).toEqual([1]);
    expect(result.current.mistake).toBeNull();

    act(() => {
      result.current.handleKeyDown(secondBackspaceKey);
    });

    expect(secondBackspaceKey.preventDefault).not.toHaveBeenCalled();

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.userInput).toBe("");
    expect(result.current.errors).toEqual([1]);
    expect(result.current.mistake).toBeNull();
  });

  it("allows backspace after typing correctly", () => {
    const { result } = renderHook(() =>
      useRacer({ lockOnError: true, phrase: "ab" })
    );
    const backspaceKey = createKeyDownEvent("Backspace");

    act(() => {
      result.current.handleInputChange({
        preventDefault: () => {},
        target: { value: "a" },
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
    expect(result.current.mistake).toBeNull();
  });
});
