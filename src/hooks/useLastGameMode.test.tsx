import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  setStoredLastGameModeIndex,
  useLastGameMode,
} from "./useLastGameMode";

describe("useLastGameMode", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts from the stored game mode after a reload", () => {
    window.localStorage.setItem("typewars.last-game-mode", "scroll");

    const { result } = renderHook(() => useLastGameMode());

    expect(result.current.lastGameModeIndex).toBe(1);
  });

  it("persists played modes and notifies subscribers in the same tab", () => {
    const { result } = renderHook(() => useLastGameMode());

    act(() => {
      result.current.setLastGameModeIndex(0);
    });

    expect(window.localStorage.getItem("typewars.last-game-mode")).toBe(
      "1v1"
    );
    expect(result.current.lastGameModeIndex).toBe(0);
  });

  it("persists scroll as a playable game mode", () => {
    const { result } = renderHook(() => useLastGameMode());

    act(() => {
      result.current.setLastGameModeIndex(1);
    });

    expect(window.localStorage.getItem("typewars.last-game-mode")).toBe(
      "scroll"
    );
    expect(result.current.lastGameModeIndex).toBe(1);
  });

  it("falls back to the default mode when a stale value was stored", () => {
    window.localStorage.setItem("typewars.last-game-mode", "ranked");

    const { result } = renderHook(() => useLastGameMode());

    expect(result.current.lastGameModeIndex).toBe(0);
  });

  it("stores a valid default key when an invalid index is requested", () => {
    setStoredLastGameModeIndex(999);

    expect(window.localStorage.getItem("typewars.last-game-mode")).toBe(
      "1v1"
    );
  });
});
