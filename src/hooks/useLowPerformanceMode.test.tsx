import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  setStoredLowPerformanceMode,
  useLowPerformanceMode,
} from "./useLowPerformanceMode";

describe("useLowPerformanceMode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-performance-mode");
  });

  it("defaults to low performance mode", () => {
    const { result } = renderHook(() => useLowPerformanceMode());

    expect(result.current.isLowPerformanceMode).toBe(true);
    expect(document.documentElement.dataset.performanceMode).toBe("low");
  });

  it("keeps low performance mode enabled when callers try to disable it", () => {
    const { result } = renderHook(() => useLowPerformanceMode());

    act(() => {
      result.current.setLowPerformanceMode(false);
    });

    expect(window.localStorage.getItem("typewars.low-performance-mode")).toBe(
      "true"
    );
    expect(result.current.isLowPerformanceMode).toBe(true);
    expect(document.documentElement.dataset.performanceMode).toBe("low");
  });

  it("ignores stale stored values and normalizes storage to enabled", () => {
    window.localStorage.setItem("typewars.low-performance-mode", "false");

    const { result } = renderHook(() => useLowPerformanceMode());

    expect(result.current.isLowPerformanceMode).toBe(true);
    expect(window.localStorage.getItem("typewars.low-performance-mode")).toBe(
      "true"
    );
  });

  it("stores explicit enabled mode", () => {
    setStoredLowPerformanceMode(true);

    expect(window.localStorage.getItem("typewars.low-performance-mode")).toBe(
      "true"
    );
  });
});
