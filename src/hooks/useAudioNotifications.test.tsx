import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  setStoredAudioNotificationsEnabled,
  useAudioNotifications,
} from "./useAudioNotifications";

describe("useAudioNotifications", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to enabled audio notifications", () => {
    const { result } = renderHook(() => useAudioNotifications());

    expect(result.current.areAudioNotificationsEnabled).toBe(true);
  });

  it("persists disabled audio notifications and updates subscribers", () => {
    const { result } = renderHook(() => useAudioNotifications());

    act(() => {
      result.current.setAudioNotificationsEnabled(false);
    });

    expect(window.localStorage.getItem("typewars.audio-notifications")).toBe(
      "false"
    );
    expect(result.current.areAudioNotificationsEnabled).toBe(false);
  });

  it("treats stale stored values as enabled", () => {
    window.localStorage.setItem("typewars.audio-notifications", "maybe");

    const { result } = renderHook(() => useAudioNotifications());

    expect(result.current.areAudioNotificationsEnabled).toBe(true);
  });

  it("stores explicit enabled notifications", () => {
    setStoredAudioNotificationsEnabled(true);

    expect(window.localStorage.getItem("typewars.audio-notifications")).toBe(
      "true"
    );
  });
});
