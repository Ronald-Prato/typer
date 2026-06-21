"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLowPerformanceMode } from "@/hooks";
import { useLastGameMode } from "@/hooks/useLastGameMode";
import {
  useHomeBackgroundDash,
  useSetHomeBackgroundTheme,
} from "@/components/layouts/HomeBackground";
import { getActiveGameRoute, HOME_GAME_MODES } from "@/domain/homeGameMode";
import {
  AnimatePresence,
  homePanelEntrance,
  m,
  modeContentSwitch,
  motionDurations,
  motionEasings,
  motionTransitions,
} from "@/motion";

const homeModeChromeByTheme = {
  orangeGreen: {
    accentText: "text-emerald-400",
    arrowHover: "hover:border-emerald-400/50 hover:text-emerald-300",
    buttonBorder:
      "border-emerald-400/95 shadow-[0_0_56px_rgba(16,185,129,0.24),inset_0_0_42px_rgba(14,165,233,0.1)]",
    innerBorder: "border-emerald-300/35",
    shortcut:
      "border-emerald-400/65 shadow-[var(--tw-home-shadow),0_0_24px_rgba(16,185,129,0.18)]",
    stats:
      "border-emerald-400/22 shadow-[var(--tw-home-shadow),0_0_32px_rgba(16,185,129,0.12)]",
    statsDivider: "border-emerald-400/18",
    selectedPill:
      "border-emerald-400 bg-emerald-400/15 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.14)] dark:text-emerald-300",
  },
  orangeYellow: {
    accentText: "text-yellow-300",
    arrowHover: "hover:border-yellow-400/50 hover:text-yellow-300",
    buttonBorder:
      "border-orange-500/95 shadow-[0_0_56px_rgba(249,115,22,0.24),inset_0_0_42px_rgba(250,204,21,0.08)]",
    innerBorder: "border-yellow-300/35",
    shortcut:
      "border-yellow-400/65 shadow-[var(--tw-home-shadow),0_0_24px_rgba(250,204,21,0.16)]",
    stats:
      "border-yellow-400/22 shadow-[var(--tw-home-shadow),0_0_32px_rgba(250,204,21,0.1)]",
    statsDivider: "border-yellow-400/18",
    selectedPill:
      "border-yellow-400 bg-yellow-400/15 text-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.12)] dark:text-yellow-300",
  },
} as const;

export const Home = () => {
  const router = useRouter();
  const ownUser = useCurrentUser();
  const currentGame = useQuery(api.game.getGameData);
  const [isPending, startTransition] = useTransition();
  const [queueSeconds, setQueueSeconds] = useState(0);
  const { lastGameModeIndex, setLastGameModeIndex } = useLastGameMode();
  const [currentSlide, setCurrentSlide] = useState(lastGameModeIndex);
  const [panelRotation, setPanelRotation] = useState(45);
  const [isPanelSpinning, setIsPanelSpinning] = useState(false);
  const [keyboardClick, setKeyboardClick] = useState(false);
  const hasMountedPanel = useRef(false);
  const triggerBackgroundDash = useHomeBackgroundDash();
  const setBackgroundTheme = useSetHomeBackgroundTheme();
  const { isLowPerformanceMode } = useLowPerformanceMode();

  const getInQueue = useMutation(api.queue.getInQueue);
  const exitQueue = useMutation(api.queue.exitQueue);
  const finishGame = useMutation(api.game.finishGame);

  const isMac =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const exitShortcut = isMac ? "⌘ X" : "Ctrl+X";
  const startShortcut = isMac ? "⌘ Enter" : "Ctrl+Enter";
  const isInQueue = ownUser?.status === "in_queue";
  const hasActiveGame = Boolean(ownUser?.activeGame && !isInQueue);
  const activeGameRoute = getActiveGameRoute(currentGame?.game?.mode);
  const selectedMode = HOME_GAME_MODES[currentSlide] ?? HOME_GAME_MODES[0];
  const activeMode =
    currentGame?.game?.mode === "scroll" ? HOME_GAME_MODES[1] : HOME_GAME_MODES[0];
  const displayMode = hasActiveGame ? activeMode : selectedMode;
  const modeChrome = homeModeChromeByTheme[displayMode.theme];

  useEffect(() => {
    setBackgroundTheme?.(displayMode.theme);
  }, [displayMode.theme, setBackgroundTheme]);

  useEffect(() => {
    setCurrentSlide(lastGameModeIndex);
  }, [lastGameModeIndex]);

  useEffect(() => {
    if (!ownUser?.queuedAt) return;

    const initialSeconds = Math.max(
      0,
      Math.floor((Date.now() - ownUser.queuedAt) / 1000)
    );
    setQueueSeconds(initialSeconds);

    const interval = setInterval(() => {
      setQueueSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [ownUser?.queuedAt]);

  const formatTime = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const goToPreviousMode = useCallback(() => {
    if (isInQueue || hasActiveGame) return;

    if (!isLowPerformanceMode) {
      triggerBackgroundDash?.("left");
    }
    setCurrentSlide(
      currentSlide === 0 ? HOME_GAME_MODES.length - 1 : currentSlide - 1
    );
    setPanelRotation((rotation) => rotation - 90);
  }, [
    currentSlide,
    hasActiveGame,
    isInQueue,
    isLowPerformanceMode,
    setCurrentSlide,
    triggerBackgroundDash,
  ]);

  const goToNextMode = useCallback(() => {
    if (isInQueue || hasActiveGame) return;

    if (!isLowPerformanceMode) {
      triggerBackgroundDash?.("right");
    }
    setCurrentSlide((currentSlide + 1) % HOME_GAME_MODES.length);
    setPanelRotation((rotation) => rotation + 90);
  }, [
    currentSlide,
    hasActiveGame,
    isInQueue,
    isLowPerformanceMode,
    setCurrentSlide,
    triggerBackgroundDash,
  ]);

  const goToMode = useCallback(
    (index: number) => {
      if (isInQueue || hasActiveGame) return;
      if (index === currentSlide) return;

      if (!isLowPerformanceMode) {
        triggerBackgroundDash?.(index > currentSlide ? "right" : "left");
      }
      setPanelRotation((rotation) =>
        index > currentSlide ? rotation + 90 : rotation - 90
      );
      setCurrentSlide(index);
    },
    [
      currentSlide,
      hasActiveGame,
      isInQueue,
      isLowPerformanceMode,
      setCurrentSlide,
      triggerBackgroundDash,
    ]
  );

  useEffect(() => {
    if (!hasMountedPanel.current) {
      hasMountedPanel.current = true;
      return;
    }

    if (isLowPerformanceMode) return;

    setIsPanelSpinning(true);
    const timeout = window.setTimeout(() => setIsPanelSpinning(false), 140);

    return () => window.clearTimeout(timeout);
  }, [isLowPerformanceMode, panelRotation]);

  const handleExitQueue = useCallback(() => {
    if (!isInQueue) return;

    startTransition(async () => {
      await exitQueue();
    });
  }, [exitQueue, isInQueue]);

  const handleStart = useCallback(async () => {
    if (isInQueue) return;

    if (hasActiveGame) {
      router.push(activeGameRoute);
      return;
    }

    setLastGameModeIndex(currentSlide);

    if (selectedMode.key === "1v1" || selectedMode.key === "scroll") {
      startTransition(async () => {
        await getInQueue({
          mode: selectedMode.key === "scroll" ? "scroll" : "classic",
        });
      });
    }
  }, [
    currentSlide,
    activeGameRoute,
    getInQueue,
    hasActiveGame,
    isInQueue,
    router,
    selectedMode.key,
    setLastGameModeIndex,
  ]);

  const handleAbandonActiveGame = useCallback(() => {
    if (!hasActiveGame) return;
    if (
      !window.confirm(
        "Estas en medio de una partida. Si sales, abandonaras la partida. ¿Quieres salir?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      await finishGame();
    });
  }, [finishGame, hasActiveGame]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        setKeyboardClick(true);
        setTimeout(() => setKeyboardClick(false), 180);
        handleStart();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "x") {
        event.preventDefault();
        handleExitQueue();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (isInQueue) return;
        goToPreviousMode();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (isInQueue) return;
        goToNextMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextMode, goToPreviousMode, handleExitQueue, handleStart, isInQueue]);

  const primaryTitle = hasActiveGame
    ? displayMode.title
    : isInQueue
      ? "En cola"
      : selectedMode.title;
  const primaryAction = isInQueue
    ? formatTime(queueSeconds)
    : hasActiveGame
      ? "Continuar partida"
    : selectedMode.action;
  const modeContentKey = isInQueue
    ? "queue"
    : hasActiveGame
      ? `active-${currentGame?.game?.mode ?? "classic"}`
      : selectedMode.key;

  return (
    <section className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden px-8">
      <div className="relative flex h-[29.5rem] w-full max-w-[36rem] flex-col items-center">
        <AnimatePresence initial={false}>
          {!isInQueue && !hasActiveGame ? (
            <m.button
              key="previous-mode"
              animate="animate"
              className={cn(
                "absolute left-0 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-[var(--tw-home-fg)] transition-colors",
                modeChrome.arrowHover
              )}
              exit="exit"
              initial="initial"
              onClick={goToPreviousMode}
              transition={motionTransitions.fast}
              type="button"
              variants={modeContentSwitch}
            >
              <ChevronLeft className="size-6" />
            </m.button>
          ) : null}
        </AnimatePresence>

        <m.div
          animate="animate"
          className="relative size-[18rem]"
          initial="initial"
          transition={{
            duration: 0.32,
            ease: motionEasings.easeInOut,
          }}
          variants={homePanelEntrance}
        >
          <m.button
            animate={{
              filter:
                !isLowPerformanceMode && isPanelSpinning
                  ? ["blur(1.4px)", "blur(0px)"]
                  : "blur(0px)",
              rotate: panelRotation,
              scale: isInQueue ? 1.06 : keyboardClick ? 0.96 : 1,
            }}
            disabled={isPending}
            onClick={isInQueue ? handleExitQueue : handleStart}
            transition={{
              filter: {
                duration: motionDurations.fast,
                ease: motionEasings.easeInOut,
              },
              rotate: {
                duration: motionDurations.base,
                ease: motionEasings.easeInOut,
              },
              scale: motionTransitions.fast,
            }}
            whileHover={{
              scale: isPending
                ? isInQueue
                  ? 1.06
                  : 1
                : isInQueue
                  ? 1.08
                  : 1.02,
            }}
            whileTap={{ scale: isInQueue ? 1.03 : 0.96 }}
            className={cn(
              "group relative grid size-full place-items-center overflow-hidden rounded-[3.8rem] border-[0.55rem] bg-[color-mix(in_srgb,var(--tw-home-panel)_44%,transparent)] outline-none backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow,opacity]",
              isLowPerformanceMode
                ? isInQueue
                  ? "border-emerald-400/75"
                  : "border-orange-500/75"
                : isInQueue
                  ? "border-emerald-400/95 shadow-[0_0_56px_rgba(16,185,129,0.24),inset_0_0_42px_rgba(59,130,246,0.08)]"
                  : modeChrome.buttonBorder,
              isPending && "cursor-wait opacity-80"
            )}
            type="button"
          >
            <span
              className={cn(
                "pointer-events-none absolute inset-0 rounded-[3.2rem] border bg-[linear-gradient(145deg,rgba(255,255,255,0.38),rgba(255,255,255,0.12)_44%,rgba(255,255,255,0.22))] shadow-[inset_0_1px_0_rgba(255,255,255,0.42),inset_0_-28px_58px_rgba(255,255,255,0.08)] transition-colors duration-300 dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05)_46%,rgba(255,255,255,0.09))]",
                modeChrome.innerBorder
              )}
            />

            <span className="relative z-10 grid min-h-[7.5rem] w-[13rem] place-items-center text-center">
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={modeContentKey}
                  animate="animate"
                  className="relative flex w-full flex-col items-center"
                  exit="exit"
                  initial="initial"
                  style={{
                    rotate: -panelRotation,
                  }}
                  transition={motionTransitions.base}
                  variants={modeContentSwitch}
                >
                  {!isInQueue && !hasActiveGame ? (
                    <span className="absolute left-1/2 -top-12 -translate-x-1/2 text-sm font-black leading-none text-[var(--tw-home-fg)]/50">
                      {selectedMode.badgeLabel}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "font-black leading-none tracking-tight text-[var(--tw-home-fg)] drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)]",
                      primaryTitle.length > 4 ? "text-4xl" : "text-5xl"
                    )}
                  >
                    {primaryTitle}
                  </span>
                  <span className="mt-4 text-xl font-bold text-[var(--tw-home-muted)]">
                    {primaryAction}
                  </span>
                </m.span>
              </AnimatePresence>
            </span>
          </m.button>

          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={modeContentKey}
              animate="animate"
              className={cn(
                "absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border bg-[var(--tw-home-panel-strong)] px-5 py-3 text-lg font-extrabold text-[var(--tw-home-fg)] backdrop-blur transition-colors duration-300",
                isInQueue
                  ? "border-emerald-400/65 shadow-[var(--tw-home-shadow),0_0_24px_rgba(16,185,129,0.18)]"
                  : modeChrome.shortcut
              )}
              exit="exit"
              initial="initial"
              transition={motionTransitions.fast}
              variants={modeContentSwitch}
            >
              {isInQueue ? exitShortcut : startShortcut}
            </m.span>
          </AnimatePresence>
        </m.div>

        <AnimatePresence initial={false}>
          {!isInQueue && !hasActiveGame ? (
            <m.button
              key="next-mode"
              animate="animate"
              className={cn(
                "absolute right-0 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-[var(--tw-home-fg)] transition-colors",
                modeChrome.arrowHover
              )}
              exit="exit"
              initial="initial"
              onClick={goToNextMode}
              transition={motionTransitions.fast}
              type="button"
              variants={modeContentSwitch}
            >
              <ChevronRight className="size-6" />
            </m.button>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {!isInQueue && !hasActiveGame ? (
            <m.div
              key="home-stats"
              animate="animate"
              className={cn(
                "mt-12 flex overflow-hidden rounded-xl border bg-[var(--tw-home-panel-strong)] backdrop-blur transition-colors duration-300",
                modeChrome.stats
              )}
              exit="exit"
              initial="initial"
              transition={motionTransitions.fast}
              variants={modeContentSwitch}
            >
              <div
                className={cn(
                  "min-w-36 border-r px-7 py-3.5 text-center transition-colors duration-300",
                  modeChrome.statsDivider
                )}
              >
                <p className={cn("text-xs font-extrabold tracking-wide", modeChrome.accentText)}>
                  WPM
                </p>
                <p className="mt-1 text-xl font-black text-[var(--tw-home-fg)]">--</p>
              </div>
              <div className="min-w-36 px-7 py-3.5 text-center">
                <p className={cn("text-xs font-extrabold tracking-wide", modeChrome.accentText)}>
                  Precisión
                </p>
                <p className="mt-1 text-xl font-black text-[var(--tw-home-fg)]">--</p>
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {hasActiveGame ? (
            <m.div
              key="active-game-actions"
              animate="animate"
              className={cn(
                "mt-12 flex overflow-hidden rounded-xl border bg-[var(--tw-home-panel-strong)] backdrop-blur transition-colors duration-300",
                modeChrome.stats
              )}
              exit="exit"
              initial="initial"
              transition={motionTransitions.fast}
              variants={modeContentSwitch}
            >
              <button
                className={cn(
                  "min-w-36 border-r px-7 py-3.5 text-center text-sm font-extrabold transition-colors duration-300",
                  modeChrome.statsDivider,
                  "text-[var(--tw-home-fg)] hover:text-orange-500"
                )}
                disabled={isPending}
                onClick={() => router.push(activeGameRoute)}
                type="button"
              >
                Continuar
              </button>
              <button
                className="min-w-36 px-7 py-3.5 text-center text-sm font-extrabold text-[var(--tw-home-muted)] transition-colors hover:text-red-500"
                disabled={isPending}
                onClick={handleAbandonActiveGame}
                type="button"
              >
                Abandonar
              </button>
            </m.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {!isInQueue && !hasActiveGame ? (
            <m.div
              key="home-mode-pills"
              animate="animate"
              className="mt-5 flex gap-3"
              exit="exit"
              initial="initial"
              transition={motionTransitions.fast}
              variants={modeContentSwitch}
            >
              {HOME_GAME_MODES.map((mode, index) => (
                <button
                  key={mode.key}
                  onClick={() => goToMode(index)}
                  className={cn(
                    "rounded-full border px-5 py-2 text-sm font-extrabold tracking-wide transition-colors",
                    selectedMode.key === mode.key
                      ? homeModeChromeByTheme[mode.theme].selectedPill
                      : "border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-[var(--tw-home-muted)] hover:text-[var(--tw-home-fg)]"
                  )}
                  type="button"
                >
                  {mode.label}
                </button>
              ))}
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
};
