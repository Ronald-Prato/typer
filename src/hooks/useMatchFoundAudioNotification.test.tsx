import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MATCH_FOUND_AUDIO_VOLUME,
  useMatchFoundAudioNotification,
} from "./useMatchFoundAudioNotification";

describe("useMatchFoundAudioNotification", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("plays the match-found sound once per active game", () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const createAudio = vi.fn(() => ({
      currentTime: 10,
      play,
      volume: 0,
    }));

    const { rerender } = renderHook(
      (props: { activeGameId: string; isGameFound: boolean }) =>
        useMatchFoundAudioNotification({
          ...props,
          createAudio,
          soundSrc: "/sounds/game_found.mp3",
        }),
      {
        initialProps: {
          activeGameId: "game-a",
          isGameFound: true,
        },
      }
    );

    expect(createAudio).toHaveBeenCalledTimes(1);
    expect(createAudio).toHaveBeenCalledWith("/sounds/game_found.mp3");
    expect(play).toHaveBeenCalledTimes(1);

    rerender({ activeGameId: "game-a", isGameFound: true });

    expect(createAudio).toHaveBeenCalledTimes(1);

    rerender({ activeGameId: "game-b", isGameFound: true });

    expect(createAudio).toHaveBeenCalledTimes(2);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("does not play when audio notifications are disabled", () => {
    window.localStorage.setItem("typewars.audio-notifications", "false");

    const createAudio = vi.fn(() => ({
      currentTime: 0,
      play: vi.fn().mockResolvedValue(undefined),
      volume: MATCH_FOUND_AUDIO_VOLUME,
    }));

    renderHook(() =>
      useMatchFoundAudioNotification({
        activeGameId: "game-a",
        createAudio,
        isGameFound: true,
        soundSrc: "/sounds/game_found.mp3",
      })
    );

    expect(createAudio).not.toHaveBeenCalled();
  });

  it("does not play before a game is found", () => {
    const createAudio = vi.fn(() => ({
      currentTime: 0,
      play: vi.fn().mockResolvedValue(undefined),
      volume: MATCH_FOUND_AUDIO_VOLUME,
    }));

    renderHook(() =>
      useMatchFoundAudioNotification({
        activeGameId: "game-a",
        createAudio,
        isGameFound: false,
        soundSrc: "/sounds/game_found.mp3",
      })
    );

    expect(createAudio).not.toHaveBeenCalled();
  });
});
