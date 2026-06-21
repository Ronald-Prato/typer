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

  it("persists disabled low performance mode and updates subscribers", () => {
    const { result } = renderHook(() => useLowPerformanceMode());

    act(() => {
      result.current.setLowPerformanceMode(false);
    });

    expect(window.localStorage.getItem("typewars.low-performance-mode")).toBe(
      "false"
    );
    expect(result.current.isLowPerformanceMode).toBe(false);
    expect(document.documentElement.dataset.performanceMode).toBe("full");
  });

  it("treats stale stored values as enabled", () => {
    window.localStorage.setItem("typewars.low-performance-mode", "yes-please");

    const { result } = renderHook(() => useLowPerformanceMode());

    expect(result.current.isLowPerformanceMode).toBe(true);
  });

  it("stores explicit enabled mode", () => {
    setStoredLowPerformanceMode(true);

    expect(window.localStorage.getItem("typewars.low-performance-mode")).toBe(
      "true"
    );
  });
});

