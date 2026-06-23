"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";

export type AnimatedThemeMode = "system" | "light" | "dark";

const THEME_SWITCHING_ATTRIBUTE = "themeSwitching";
const THEME_SWITCHING_DURATION_MS = 260;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function useAnimatedThemeChange(
  onThemeChange: (theme: AnimatedThemeMode) => void
) {
  return useCallback(
    (theme: AnimatedThemeMode) => {
      if (typeof document === "undefined" || prefersReducedMotion()) {
        onThemeChange(theme);
        return;
      }

      const startViewTransition = document.startViewTransition?.bind(document);
      if (startViewTransition) {
        const transition = startViewTransition(() => {
          flushSync(() => {
            applyThemeClass(theme);
            onThemeChange(theme);
          });
        });

        transition.finished.catch(() => undefined);
        return;
      }

      runFallbackThemeTransition(() => {
        applyThemeClass(theme);
        onThemeChange(theme);
      });
    },
    [onThemeChange]
  );
}

function runFallbackThemeTransition(changeTheme: () => void) {
  const root = document.documentElement;
  root.dataset[THEME_SWITCHING_ATTRIBUTE] = "true";
  changeTheme();

  window.setTimeout(() => {
    delete root.dataset[THEME_SWITCHING_ATTRIBUTE];
  }, THEME_SWITCHING_DURATION_MS);
}

function applyThemeClass(theme: AnimatedThemeMode) {
  const resolvedTheme = theme === "system" ? resolveSystemTheme() : theme;
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
}

function resolveSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
