"use client";

import { useEffect, useRef } from "react";
import type { AnimatedThemeMode } from "./useAnimatedThemeChange";

type ThemeKeyboardMode = Extract<AnimatedThemeMode, "light" | "dark">;

interface UseThemeKeyboardShortcutsOptions {
  enabled?: boolean;
  onThemeChange: (theme: ThemeKeyboardMode) => void;
}

export function useThemeKeyboardShortcuts({
  enabled = true,
  onThemeChange,
}: UseThemeKeyboardShortcutsOptions) {
  const onThemeChangeRef = useRef(onThemeChange);
  onThemeChangeRef.current = onThemeChange;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "l") {
        onThemeChangeRef.current("light");
      } else if (key === "d") {
        onThemeChangeRef.current("dark");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest("input, textarea, select, [contenteditable]") ||
      (target instanceof HTMLElement && target.isContentEditable)
  );
}
