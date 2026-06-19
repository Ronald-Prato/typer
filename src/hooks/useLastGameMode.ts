"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_HOME_GAME_MODE_INDEX,
  getHomeGameModeIndex,
  getHomeGameModeKeyAtIndex,
} from "@/domain/homeGameMode";

const STORAGE_KEY = "typewars.last-game-mode";
const CHANGE_EVENT = "typewars:last-game-mode-change";

const getSnapshot = () => {
  if (typeof window === "undefined") return DEFAULT_HOME_GAME_MODE_INDEX;

  return getHomeGameModeIndex(window.localStorage.getItem(STORAGE_KEY));
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

export const setStoredLastGameModeIndex = (index: number) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, getHomeGameModeKeyAtIndex(index));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const useLastGameMode = () => {
  const lastGameModeIndex = useSyncExternalStore(subscribe, getSnapshot, () =>
    DEFAULT_HOME_GAME_MODE_INDEX
  );

  const setLastGameModeIndex = useCallback((index: number) => {
    setStoredLastGameModeIndex(index);
  }, []);

  return { lastGameModeIndex, setLastGameModeIndex };
};
