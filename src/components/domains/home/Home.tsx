"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useResetAtom } from "jotai/utils";
import { practiceAtom } from "@/states/practice.states";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLastGameMode } from "@/hooks/useLastGameMode";
import { useHomeBackgroundDash } from "@/components/layouts/HomeBackground";
import { HOME_GAME_MODES } from "@/domain/homeGameMode";
import {
  AnimatePresence,
  homePanelEntrance,
  m,
  modeContentSwitch,
  motionDurations,
  motionEasings,
  motionTransitions,
} from "@/motion";

export const Home = () => {
  const router = useRouter();
  const ownUser = useCurrentUser();
  const [isPending, startTransition] = useTransition();
  const [queueSeconds, setQueueSeconds] = useState(0);
  const { lastGameModeIndex, setLastGameModeIndex } = useLastGameMode();
  const [currentSlide, setCurrentSlide] = useState(lastGameModeIndex);
  const [panelRotation, setPanelRotation] = useState(45);
  const [isPanelSpinning, setIsPanelSpinning] = useState(false);
  const [keyboardClick, setKeyboardClick] = useState(false);
  const hasMountedPanel = useRef(false);
  const triggerBackgroundDash = useHomeBackgroundDash();

  const resetPractice = useResetAtom(practiceAtom);
  const getInQueue = useMutation(api.queue.getInQueue);
  const exitQueue = useMutation(api.queue.exitQueue);

  const isMac =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const exitShortcut = isMac ? "⌘ X" : "Ctrl+X";
  const startShortcut = isMac ? "⌘ Enter" : "Ctrl+Enter";
  const isInQueue = ownUser?.status === "in_queue";
  const selectedMode = HOME_GAME_MODES[currentSlide] ?? HOME_GAME_MODES[0];

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
    triggerBackgroundDash?.("left");
    setCurrentSlide(
      currentSlide === 0 ? HOME_GAME_MODES.length - 1 : currentSlide - 1
    );
    setPanelRotation((rotation) => rotation - 90);
  }, [currentSlide, setCurrentSlide, triggerBackgroundDash]);

  const goToNextMode = useCallback(() => {
    triggerBackgroundDash?.("right");
    setCurrentSlide((currentSlide + 1) % HOME_GAME_MODES.length);
    setPanelRotation((rotation) => rotation + 90);
  }, [currentSlide, setCurrentSlide, triggerBackgroundDash]);

  const goToMode = useCallback(
    (index: number) => {
      if (index === currentSlide) return;

      triggerBackgroundDash?.(index > currentSlide ? "right" : "left");
      setPanelRotation((rotation) =>
        index > currentSlide ? rotation + 90 : rotation - 90
      );
      setCurrentSlide(index);
    },
    [currentSlide, setCurrentSlide, triggerBackgroundDash]
  );

  useEffect(() => {
    if (!hasMountedPanel.current) {
      hasMountedPanel.current = true;
      return;
    }

    setIsPanelSpinning(true);
    const timeout = window.setTimeout(() => setIsPanelSpinning(false), 140);

    return () => window.clearTimeout(timeout);
  }, [panelRotation]);

  const handleExitQueue = useCallback(() => {
    if (!isInQueue) return;

    startTransition(async () => {
      await exitQueue();
    });
  }, [exitQueue, isInQueue]);

  const handleStart = useCallback(async () => {
    setLastGameModeIndex(currentSlide);

    if (selectedMode.key === "practice") {
      resetPractice();
      router.push("/practice");
      return;
    }

    if (selectedMode.key === "1v1") {
      startTransition(async () => {
        await getInQueue({});
      });
    }
  }, [
    currentSlide,
    getInQueue,
    resetPractice,
    router,
    selectedMode.key,
    setLastGameModeIndex,
  ]);

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
        goToPreviousMode();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextMode, goToPreviousMode, handleExitQueue, handleStart]);

  const primaryTitle = isInQueue ? "En cola" : selectedMode.label;
  const primaryAction = isInQueue
    ? formatTime(queueSeconds)
    : selectedMode.action;
  const modeContentKey = isInQueue ? "queue" : selectedMode.key;

  return (
    <section className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden px-8">
      <div className="pointer-events-none absolute left-1/2 top-[45%] h-[31rem] w-[31rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/10" />
      <div className="pointer-events-none absolute left-1/2 top-[45%] h-[25rem] w-[25rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--tw-home-border)]" />
      <div className="pointer-events-none absolute left-1/2 top-[45%] h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/20" />

      <div className="relative flex w-full max-w-[36rem] flex-col items-center">
        <button
          onClick={goToPreviousMode}
          className="absolute left-0 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-[var(--tw-home-fg)] transition-colors hover:border-orange-500/50 hover:text-orange-400"
          type="button"
        >
          <ChevronLeft className="size-6" />
        </button>

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
              filter: isPanelSpinning ? ["blur(1.4px)", "blur(0px)"] : "blur(0px)",
              rotate: panelRotation,
              scale: keyboardClick ? 0.96 : 1,
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
            whileHover={{ scale: isPending ? 1 : 1.02 }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "group relative grid size-full place-items-center rounded-[3.8rem] bg-gradient-to-br p-[0.55rem] shadow-[0_0_56px_rgba(249,115,22,0.24)] outline-none transition-opacity",
              isInQueue
                ? "from-emerald-400 to-blue-500"
                : "from-orange-500 via-orange-600 to-red-500",
              isPending && "cursor-wait opacity-80"
            )}
            type="button"
          >
            <span className="absolute -inset-7 rounded-full border border-orange-500/25 opacity-80" />
            <span className="absolute -inset-11 rounded-full border border-dashed border-[var(--tw-home-border)]" />
            <span className="absolute inset-[0.7rem] rounded-[3.25rem] border border-[var(--tw-home-border)] bg-[color-mix(in_srgb,var(--tw-home-panel-strong)_92%,black)] shadow-[inset_0_0_38px_rgba(255,255,255,0.04)]" />

            <span className="relative z-10 grid min-h-[7.5rem] w-[13rem] place-items-center text-center">
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={modeContentKey}
                  animate="animate"
                  className="flex w-full flex-col items-center"
                  exit="exit"
                  initial="initial"
                  style={{ rotate: -panelRotation }}
                  transition={motionTransitions.base}
                  variants={modeContentSwitch}
                >
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
              className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-orange-500/70 bg-[var(--tw-home-panel-strong)] px-5 py-3 text-lg font-extrabold text-[var(--tw-home-fg)] shadow-[var(--tw-home-shadow),0_0_20px_rgba(249,115,22,0.18)] backdrop-blur"
              exit="exit"
              initial="initial"
              transition={motionTransitions.fast}
              variants={modeContentSwitch}
            >
              {isInQueue ? exitShortcut : startShortcut}
            </m.span>
          </AnimatePresence>
        </m.div>

        <button
          onClick={goToNextMode}
          className="absolute right-0 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-[var(--tw-home-fg)] transition-colors hover:border-orange-500/50 hover:text-orange-400"
          type="button"
        >
          <ChevronRight className="size-6" />
        </button>

        <div className="mt-12 flex overflow-hidden rounded-xl border border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] shadow-[var(--tw-home-shadow)] backdrop-blur">
          <div className="min-w-36 border-r border-[var(--tw-home-border)] px-7 py-3.5 text-center">
            <p className="text-xs font-extrabold tracking-wide text-blue-400">
              WPM
            </p>
            <p className="mt-1 text-xl font-black text-[var(--tw-home-fg)]">--</p>
          </div>
          <div className="min-w-36 px-7 py-3.5 text-center">
            <p className="text-xs font-extrabold tracking-wide text-blue-400">
              Precisión
            </p>
            <p className="mt-1 text-xl font-black text-[var(--tw-home-fg)]">--</p>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          {HOME_GAME_MODES.map((mode, index) => (
            <button
              key={mode.key}
              onClick={() => goToMode(index)}
              className={cn(
                "rounded-full border px-5 py-2 text-sm font-extrabold tracking-wide transition-colors",
                selectedMode.key === mode.key
                  ? "border-orange-500 bg-orange-500/15 text-orange-400"
                  : "border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-[var(--tw-home-muted)] hover:text-[var(--tw-home-fg)]"
              )}
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
