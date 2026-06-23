import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAnimatedThemeChange } from "./useAnimatedThemeChange";

describe("useAnimatedThemeChange", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
    delete document.documentElement.dataset.themeSwitching;
    Reflect.deleteProperty(document, "startViewTransition");
    vi.unstubAllGlobals();
  });

  it("uses the View Transition API when available", () => {
    const handleThemeChange = vi.fn();
    const startViewTransition = vi.fn((updateCallback: () => void) => {
      updateCallback();
      return { finished: Promise.resolve() };
    });
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    });
    mockMatchMedia();

    const { result } = renderHook(() =>
      useAnimatedThemeChange(handleThemeChange)
    );

    act(() => {
      result.current("dark");
    });

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveClass("dark");
    expect(handleThemeChange).toHaveBeenCalledWith("dark");
  });

  it("falls back to a short color transition without View Transition support", () => {
    vi.useFakeTimers();
    const handleThemeChange = vi.fn();
    mockMatchMedia();

    const { result } = renderHook(() =>
      useAnimatedThemeChange(handleThemeChange)
    );

    act(() => {
      result.current("light");
    });

    expect(document.documentElement.dataset.themeSwitching).toBe("true");
    expect(document.documentElement).toHaveClass("light");
    expect(handleThemeChange).toHaveBeenCalledWith("light");

    act(() => {
      vi.runAllTimers();
    });

    expect(document.documentElement.dataset.themeSwitching).toBeUndefined();
  });

  it("does not animate when reduced motion is enabled", () => {
    const handleThemeChange = vi.fn();
    const startViewTransition = vi.fn();
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    });
    mockMatchMedia({ reducedMotion: true });

    const { result } = renderHook(() =>
      useAnimatedThemeChange(handleThemeChange)
    );

    act(() => {
      result.current("dark");
    });

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(document.documentElement).not.toHaveClass("dark");
    expect(handleThemeChange).toHaveBeenCalledWith("dark");
  });
});

function mockMatchMedia({
  colorSchemeDark = false,
  reducedMotion = false,
} = {}) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches:
      query === "(prefers-color-scheme: dark)"
        ? colorSchemeDark
        : reducedMotion,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
