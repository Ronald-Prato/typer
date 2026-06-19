"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isCopyPasteShortcut } from "@/domain/typingEngine";

interface CompletionMetrics {
  errors: number;
  timeMs: number;
}

interface UseTypingInputSessionOptions {
  isComplete: boolean;
  startTime: number | null;
  resetKey: unknown;
  focusRetryMs?: number;
  completionDelayMs?: number;
  getCompletionMetrics: () => CompletionMetrics | null;
  onCompleted?: (data: CompletionMetrics) => void;
}

export function useTypingInputSession({
  isComplete,
  startTime,
  resetKey,
  focusRetryMs = 50,
  completionDelayMs = 100,
  getCompletionMetrics,
  onCompleted,
}: UseTypingInputSessionOptions) {
  const [isActive, setIsActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionNotifiedRef = useRef(false);
  const getCompletionMetricsRef = useRef(getCompletionMetrics);
  const onCompletedRef = useRef(onCompleted);

  getCompletionMetricsRef.current = getCompletionMetrics;
  onCompletedRef.current = onCompleted;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const focusInput = useCallback(() => {
    if (!isComplete) {
      inputRef.current?.focus();
      setIsActive(true);
    }
  }, [isComplete]);

  useEffect(() => {
    setCurrentTime(0);
    completionNotifiedRef.current = false;
    clearTimer();

    const timeoutId = setTimeout(focusInput, 300);
    return () => clearTimeout(timeoutId);
  }, [clearTimer, focusInput, resetKey]);

  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive]);

  useEffect(() => {
    if (isComplete) return;

    const timeoutId = setTimeout(() => inputRef.current?.focus(), focusRetryMs);
    return () => clearTimeout(timeoutId);
  }, [focusRetryMs, isComplete, resetKey]);

  useEffect(() => {
    if (isComplete) return;

    const input = inputRef.current;
    const handleFocusOut = () => {
      setTimeout(() => inputRef.current?.focus(), 10);
    };
    const handlePointerIntent = () => {
      inputRef.current?.focus();
    };

    input?.addEventListener("blur", handleFocusOut);
    document.addEventListener("click", handlePointerIntent);
    document.addEventListener("mousedown", handlePointerIntent);

    return () => {
      input?.removeEventListener("blur", handleFocusOut);
      document.removeEventListener("click", handlePointerIntent);
      document.removeEventListener("mousedown", handlePointerIntent);
    };
  }, [isComplete, resetKey]);

  useEffect(() => {
    clearTimer();
    if (!startTime || isComplete) return;

    timerRef.current = setInterval(() => {
      setCurrentTime(Date.now() - startTime);
    }, 100);

    return clearTimer;
  }, [clearTimer, isComplete, startTime]);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    if (!isComplete || completionNotifiedRef.current) return;

    completionNotifiedRef.current = true;
    clearTimer();

    const metrics = getCompletionMetricsRef.current();
    if (!metrics || !onCompletedRef.current) return;

    const timeoutId = setTimeout(() => {
      onCompletedRef.current?.(metrics);
    }, completionDelayMs);

    return () => clearTimeout(timeoutId);
  }, [clearTimer, completionDelayMs, isComplete]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (isCopyPasteShortcut(event)) {
        event.preventDefault();
      }
    },
    []
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
    },
    []
  );

  const handleContainerClick = useCallback(() => {
    focusInput();
  }, [focusInput]);

  return {
    containerRef,
    currentTime,
    handleContainerClick,
    handleKeyDown,
    handlePaste,
    inputRef,
    isActive,
  };
}
