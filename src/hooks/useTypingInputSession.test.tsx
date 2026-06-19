import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTypingInputSession } from "./useTypingInputSession";

describe("useTypingInputSession", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports completion metrics once per completed session", () => {
    vi.useFakeTimers();
    const onCompleted = vi.fn();
    let isComplete = false;

    const { rerender } = renderHook(() =>
      useTypingInputSession({
        isComplete,
        startTime: 1_000,
        resetKey: "abc",
        getCompletionMetrics: () => ({ errors: 1, timeMs: 250 }),
        onCompleted,
      })
    );

    isComplete = true;
    rerender();
    rerender();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onCompleted).toHaveBeenCalledWith({ errors: 1, timeMs: 250 });
  });

  it("prevents copy, paste, and cut shortcuts through the shared key handler", () => {
    const { result } = renderHook(() =>
      useTypingInputSession({
        isComplete: false,
        startTime: null,
        resetKey: "abc",
        getCompletionMetrics: () => null,
      })
    );
    const preventDefault = vi.fn();

    result.current.handleKeyDown({
      key: "v",
      ctrlKey: true,
      preventDefault,
    } as unknown as React.KeyboardEvent<HTMLInputElement>);

    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("prevents clipboard paste events", () => {
    const { result } = renderHook(() =>
      useTypingInputSession({
        isComplete: false,
        startTime: null,
        resetKey: "abc",
        getCompletionMetrics: () => null,
      })
    );
    const preventDefault = vi.fn();

    result.current.handlePaste({
      preventDefault,
    } as unknown as React.ClipboardEvent<HTMLInputElement>);

    expect(preventDefault).toHaveBeenCalledTimes(1);
  });
});
