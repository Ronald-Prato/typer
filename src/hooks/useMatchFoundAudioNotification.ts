"use client";

import { useEffect, useRef } from "react";
import { useAudioNotifications } from "./useAudioNotifications";

type PlayableAudio = {
  currentTime: number;
  volume: number;
  play: () => Promise<void> | void;
};

interface UseMatchFoundAudioNotificationOptions {
  activeGameId?: string | null;
  createAudio?: (src: string) => PlayableAudio;
  isGameFound: boolean;
  soundSrc?: string;
}

export const MATCH_FOUND_AUDIO_VOLUME = 0.75;
export const MATCH_FOUND_SOUND_SRC = "/sounds/game_found.mp3";

export function useMatchFoundAudioNotification({
  activeGameId,
  createAudio,
  isGameFound,
  soundSrc = MATCH_FOUND_SOUND_SRC,
}: UseMatchFoundAudioNotificationOptions) {
  const { areAudioNotificationsEnabled } = useAudioNotifications();
  const lastNotifiedGameIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isGameFound || !activeGameId) return;
    if (lastNotifiedGameIdRef.current === activeGameId) return;

    lastNotifiedGameIdRef.current = activeGameId;

    if (!areAudioNotificationsEnabled) return;

    const audioFactory = createAudio ?? ((src: string) => new Audio(src));
    const audio = audioFactory(soundSrc);
    audio.currentTime = 0;
    audio.volume = MATCH_FOUND_AUDIO_VOLUME;

    const playResult = audio.play();

    if (playResult && "catch" in playResult) {
      playResult.catch((error: unknown) => {
        console.warn("Unable to play match found notification sound:", error);
      });
    }
  }, [
    activeGameId,
    areAudioNotificationsEnabled,
    createAudio,
    isGameFound,
    soundSrc,
  ]);
}
