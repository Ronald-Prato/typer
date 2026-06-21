"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "typewars.low-performance-mode";
const CHANGE_EVENT = "typewars:low-performance-mode-change";
const DEFAULT_LOW_PERFORMANCE_MODE = true;

const normalizeLowPerformanceMode = (value: string | null): boolean => {
  if (value === null) return DEFAULT_LOW_PERFORMANCE_MODE;

  return value !== "false";
};

const getSnapshot = (): boolean => {
  if (typeof window === "undefined") return DEFAULT_LOW_PERFORMANCE_MODE;

  return normalizeLowPerformanceMode(window.localStorage.getItem(STORAGE_KEY));
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

export const setStoredLowPerformanceMode = (enabled: boolean) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const useLowPerformanceMode = () => {
  const isLowPerformanceMode = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_LOW_PERFORMANCE_MODE
  );

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.dataset.performanceMode = isLowPerformanceMode
      ? "low"
      : "full";
  }, [isLowPerformanceMode]);

  const setLowPerformanceMode = useCallback((enabled: boolean) => {
    setStoredLowPerformanceMode(enabled);
  }, []);

  return { isLowPerformanceMode, setLowPerformanceMode };
};

