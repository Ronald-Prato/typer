"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export const HUD_SCALE_STEPS = [0.8, 0.9, 1, 1.1, 1.2] as const;

export type HudScale = (typeof HUD_SCALE_STEPS)[number];

const STORAGE_KEY = "typewars.hud-scale";
const DEFAULT_SCALE: HudScale = 1;
const CHANGE_EVENT = "typewars:hud-scale-change";
const BASE_FONT_SIZE = 16;

const isHudScale = (value: number): value is HudScale =>
  HUD_SCALE_STEPS.some((scale) => scale === value);

const normalizeScale = (value: string | null): HudScale => {
  if (!value) return DEFAULT_SCALE;

  const parsedValue = Number(value);
  return isHudScale(parsedValue) ? parsedValue : DEFAULT_SCALE;
};

const getSnapshot = (): HudScale => {
  if (typeof window === "undefined") return DEFAULT_SCALE;

  return normalizeScale(window.localStorage.getItem(STORAGE_KEY));
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

export const setStoredHudScale = (scale: HudScale) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, String(scale));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const useHudScale = () => {
  const scale = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SCALE);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.style.setProperty("--tw-hud-scale", String(scale));
    document.documentElement.style.fontSize = `${BASE_FONT_SIZE * scale}px`;
  }, [scale]);

  const setScale = useCallback((nextScale: HudScale) => {
    setStoredHudScale(nextScale);
  }, []);

  return { scale, setScale };
};
