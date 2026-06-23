"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "typewars.audio-notifications";
const CHANGE_EVENT = "typewars:audio-notifications-change";
const DEFAULT_AUDIO_NOTIFICATIONS_ENABLED = true;

const normalizeAudioNotificationsEnabled = (value: string | null): boolean => {
  if (value === null) return DEFAULT_AUDIO_NOTIFICATIONS_ENABLED;

  return value !== "false";
};

const getSnapshot = (): boolean => {
  if (typeof window === "undefined") return DEFAULT_AUDIO_NOTIFICATIONS_ENABLED;

  return normalizeAudioNotificationsEnabled(
    window.localStorage.getItem(STORAGE_KEY)
  );
};

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
};

export const setStoredAudioNotificationsEnabled = (enabled: boolean) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const useAudioNotifications = () => {
  const areAudioNotificationsEnabled = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_AUDIO_NOTIFICATIONS_ENABLED
  );

  const setAudioNotificationsEnabled = useCallback((enabled: boolean) => {
    setStoredAudioNotificationsEnabled(enabled);
  }, []);

  return {
    areAudioNotificationsEnabled,
    setAudioNotificationsEnabled,
  };
};
