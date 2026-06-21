"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Text, Racer, ResultsOverlay } from "@/components";
import { Button, KeyIndicator } from "@/components/ui/button";
import {
  motion,
  AnimatePresence,
  motionTransitions,
  slideUp,
} from "@/motion";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { practiceAtom } from "@/states/practice.states";
import { useAtomValue, useSetAtom } from "jotai/react";
import { cn, getShuffledPhrases } from "@/lib/utils";
import { HomeBackground } from "@/components/layouts/HomeBackground";
import { PracticeModeSelect, type PracticeMode } from "./PracticeModeSelect";
import { PracticeScrollGame } from "./PracticeScrollGame";

interface RoundData {
  phrase: string;
  errors: number;
  timeMs: number;
  accuracy: number;
  wpm: number;
}

type PracticeViewProps = {
  showBackground?: boolean;
};

export function PracticeView({ showBackground = true }: PracticeViewProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [currentRound, setCurrentRound] = useState(1);
  const [roundsData, setRoundsData] = useState<RoundData[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showResultsOverlay, setShowResultsOverlay] = useState(false);
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [isBackShortcutActive, setIsBackShortcutActive] = useState(false);
  const backShortcutTimeoutRef = useRef<number | null>(null);
  const completionTimeoutRef = useRef<number | null>(null);

  const practiceSet = useAtomValue(practiceAtom);
  const setPractice = useSetAtom(practiceAtom);

  const createPractice = useMutation(api.practice.addPractice);

  useEffect(() => {
    router.prefetch("/home");
  }, [router]);

  useEffect(() => {
    return () => {
      if (backShortcutTimeoutRef.current !== null) {
        window.clearTimeout(backShortcutTimeoutRef.current);
      }
      if (completionTimeoutRef.current !== null) {
        window.clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  const currentPhrase = practiceSet?.phrases?.[currentRound - 1];

  const startPhrasePractice = useCallback(() => {
    setCurrentRound(1);
    setRoundsData([]);
    setShowCompleted(false);
    setShowResultsOverlay(false);
    setPractice({
      phrases: getShuffledPhrases().map((phrase) => phrase) as string[],
    });
    setSelectedMode("phrases");
  }, [setPractice]);

  const handleSelectMode = useCallback(
    (mode: PracticeMode) => {
      if (mode === "phrases") {
        startPhrasePractice();
        return;
      }

      setSelectedMode("scroll");
    },
    [startPhrasePractice]
  );

  const handleCompleted = (data: { errors: number; timeMs: number }) => {
    const phrase = currentPhrase;
    const accuracy = Math.round(
      ((phrase.length - data.errors) / phrase.length) * 100
    );
    const timeInMinutes = data.timeMs / (1000 * 60);
    const wordsTyped = phrase.split(" ").length;
    const wpm = Math.round(wordsTyped / timeInMinutes);

    const roundData: RoundData = {
      phrase,
      errors: data.errors,
      timeMs: data.timeMs,
      accuracy,
      wpm,
    };

    // Save round data
    setRoundsData((prev) => [...prev, roundData]);

    // Show completion overlay
    setShowCompleted(true);

    // After animation, move to next round or finish practice
    completionTimeoutRef.current = window.setTimeout(() => {
      completionTimeoutRef.current = null;

      if (currentRound < (practiceSet?.phrases?.length || 0)) {
        setCurrentRound((prev) => prev + 1);
        setShowCompleted(false);
      } else {
        // Practice completed - show results overlay
        setShowCompleted(false);
        setShowResultsOverlay(true);

        // Only save to database if user is signed in
        if (isSignedIn) {
          // Calculate averages from all rounds (same as ResultsOverlay)
          const allRounds = [...roundsData, roundData]; // Include current round
          const totalRounds = allRounds.length;
          const totalTime = allRounds.reduce(
            (sum, round) => sum + round.timeMs,
            0
          );
          const averageTime = totalTime / totalRounds;
          const averageAccuracy =
            allRounds.reduce((sum, round) => sum + round.accuracy, 0) /
            totalRounds;
          const averageWpm =
            allRounds.reduce((sum, round) => sum + round.wpm, 0) / totalRounds;
          const averageErrors =
            allRounds.reduce((sum, round) => sum + round.errors, 0) /
            totalRounds;

          createPractice({
            wpm: Math.round(averageWpm), // Same as displayed in ResultsOverlay
            accuracy: averageAccuracy / 100, // Same as displayed in ResultsOverlay
            time: averageTime / (1000 * 60), // Convert to minutes for DB
            errors: Math.round(averageErrors), // Same as displayed in ResultsOverlay
          });
        }
      }
    }, 700); // Show completion for 0.4 seconds + 300ms delay
  };

  const handleCloseResults = () => {
    setShowResultsOverlay(false);
    setShowCompleted(false);
    setSelectedMode(null);
    setCurrentRound(1);
    setRoundsData([]);
    setPractice({
      phrases: getShuffledPhrases().map((phrase) => phrase) as string[],
    });
  };

  const handleRestartPractice = () => {
    setCurrentRound(1);
    setRoundsData([]);
    setShowCompleted(false);
    setShowResultsOverlay(false);
    setPractice({
      phrases: getShuffledPhrases().map((phrase) => phrase) as string[],
    });
  };

  const handleBackToModes = () => {
    if (completionTimeoutRef.current !== null) {
      window.clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }

    setSelectedMode(null);
    setShowCompleted(false);
    setShowResultsOverlay(false);
  };

  const flashBackShortcut = useCallback(() => {
    if (backShortcutTimeoutRef.current !== null) {
      window.clearTimeout(backShortcutTimeoutRef.current);
    }

    setIsBackShortcutActive(true);
    backShortcutTimeoutRef.current = window.setTimeout(() => {
      setIsBackShortcutActive(false);
      backShortcutTimeoutRef.current = null;
    }, 180);
  }, []);

  const handleBack = () => {
    if (selectedMode !== null) {
      handleBackToModes();
      return;
    }

    router.replace("/home");
  };

  const handleBackShortcut = () => {
    flashBackShortcut();

    if (selectedMode !== null) {
      handleBackToModes();
      return;
    }

    window.requestAnimationFrame(() => router.replace("/home"));
  };

  const totalRounds = practiceSet?.phrases?.length || 0;
  const progress = totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0;
  const isEmbeddedInHome = !showBackground;

  return (
    <div
      className={cn(
        "relative overflow-hidden text-[var(--tw-home-fg)]",
        isEmbeddedInHome
          ? "h-full min-h-0"
          : "min-h-[calc(100vh-100px)]",
        showBackground && "bg-[var(--tw-home-bg)]"
      )}
    >
      {showBackground ? <HomeBackground variant="practice" /> : null}

      {/* Results Overlay */}
      <ResultsOverlay
        isVisible={showResultsOverlay}
        roundsData={roundsData}
        onClose={handleCloseResults}
        onRestart={handleRestartPractice}
        restartShortcut="Borrar"
      />

      <main
        className={cn(
          "relative z-10 flex flex-col items-center px-5 sm:px-8",
          isEmbeddedInHome
            ? "h-full min-h-0 justify-start py-0"
            : "min-h-[calc(100vh-100px)] justify-center py-8"
        )}
      >
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2",
            isEmbeddedInHome ? "top-4" : "top-8"
          )}
        >
          <Button
            variant="ghost"
            shortcut="Cmd+J"
            onClick={handleBack}
            onShortcutPress={handleBackShortcut}
            className={cn(
              "relative h-12 rounded-2xl !border !border-white/55 !bg-white/30 px-5 py-0 text-sm !text-[var(--tw-home-fg)] shadow-[0_18px_48px_rgba(87,82,121,0.16),inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-1px_0_rgba(255,255,255,0.22)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-200 hover:!border-orange-400/55 hover:!bg-white/40 hover:shadow-[0_22px_58px_rgba(249,115,22,0.18),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.26)] active:scale-[0.99] dark:!border-white/18 dark:!bg-white/[0.09] dark:!text-white dark:shadow-[0_18px_48px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.16)] dark:hover:!border-orange-300/45 dark:hover:!bg-white/[0.13]",
              isBackShortcutActive &&
                "!border-orange-300/80 !bg-orange-500/24 !text-orange-500 shadow-[0_22px_58px_rgba(249,115,22,0.34),inset_0_1px_0_rgba(255,255,255,0.82),0_0_0_3px_rgba(249,115,22,0.18)] dark:!border-orange-300/70 dark:!bg-orange-400/20 dark:!text-orange-200"
            )}
          >
            <div className="flex items-center gap-3">
              <ChevronLeftIcon className="size-4" />
              <Text
                variant="caption"
                className="text-sm font-bold text-[var(--tw-home-fg)] dark:text-white"
              >
                Volver
              </Text>
              <KeyIndicator
                size="sm"
                shortcut="Cmd+J"
                className="!h-6 !w-11 !border-white/45 !bg-white/24 text-[10px] !text-[var(--tw-home-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.54)] dark:!border-white/20 dark:!bg-white/15 dark:!text-white/80"
              />
            </div>
          </Button>
        </div>

        <section
          className={cn(
            "flex w-full flex-1 flex-col items-center",
            isEmbeddedInHome
              ? selectedMode === null
                ? "min-h-0 justify-center pb-8 pt-24"
                : "min-h-0 justify-start pb-4 pt-24"
              : selectedMode === null
                ? "justify-start pb-12 pt-44 sm:pt-40"
                : "justify-start pb-12 pt-40 sm:pt-36"
          )}
        >
          <div
            className={cn(
              "flex flex-col items-center text-center",
              isEmbeddedInHome ? "mb-5" : "mb-8"
            )}
          >
            <Text
              variant="h5"
              className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-xl font-extrabold text-transparent"
            >
              Práctica
            </Text>
            <Text
              variant="body1"
              className="mt-2 text-sm font-semibold text-[var(--tw-home-muted)]"
            >
              {selectedMode === "phrases"
                ? `${currentRound} / ${totalRounds}`
                : selectedMode === "scroll"
                  ? "Scroll"
                  : "Elige tu modo"}
            </Text>
            {selectedMode === "phrases" && (
              <div className="mt-3 h-1 w-28 overflow-hidden rounded-full bg-[var(--tw-home-border)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Container for Racer with overlays */}
          <div className="relative flex w-full max-w-5xl justify-center">
            {selectedMode === null ? (
              <PracticeModeSelect onSelectMode={handleSelectMode} />
            ) : selectedMode === "scroll" ? (
              <PracticeScrollGame
                isCompactLayout={isEmbeddedInHome}
                onBackToModes={handleBackToModes}
              />
            ) : currentPhrase ? (
              <Racer
                className="w-full space-y-10 [&>div:first-child]:!min-h-[180px] [&>div:first-child]:rounded-[1.75rem] [&>div:first-child]:border [&>div:first-child]:border-[#575279]/10 [&>div:first-child]:bg-[#575279]/[0.035] [&>div:first-child]:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_18px_54px_rgba(87,82,121,0.08)] [&>div:first-child]:backdrop-blur-[2px] dark:[&>div:first-child]:border-white/10 dark:[&>div:first-child]:bg-[rgba(7,13,29,0.46)] dark:[&>div:first-child]:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_90px_rgba(0,0,0,0.24)] dark:[&>div:first-child]:backdrop-blur-md [&>div:first-child>div]:px-5 [&>div:first-child>div]:py-10 sm:[&>div:first-child>div]:px-14 [&>div:last-child]:h-auto [&>div:last-child]:min-h-0 [&>div:last-child]:flex-wrap [&>div:last-child]:justify-center [&>div:last-child]:gap-3 [&>div:last-child]:space-x-0 [&>div:last-child>div]:min-w-[8rem] [&>div:last-child>div]:rounded-xl [&>div:last-child>div]:border [&>div:last-child>div]:border-[#575279]/10 [&>div:last-child>div]:bg-white/20 [&>div:last-child>div]:px-4 [&>div:last-child>div]:py-3 [&>div:last-child>div]:shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] [&>div:last-child>div]:backdrop-blur dark:[&>div:last-child>div]:border-white/10 dark:[&>div:last-child>div]:bg-white/[0.045] dark:[&>div:last-child>div]:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                phrase={currentPhrase}
                onCompleted={handleCompleted}
              />
            ) : (
              <div className="flex h-44 w-full items-center justify-center rounded-[1.75rem] border border-[#575279]/10 bg-[#575279]/[0.035] backdrop-blur-[2px] dark:border-white/10 dark:bg-[rgba(7,13,29,0.46)] dark:backdrop-blur-md">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
              </div>
            )}

            {/* Completion Feedback */}
            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  variants={slideUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={motionTransitions.emphasized}
                  className="pointer-events-none absolute -top-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-400/35 bg-[color-mix(in_srgb,var(--tw-home-bg)_82%,white)] px-4 py-2 text-emerald-600 shadow-[0_14px_40px_rgba(16,185,129,0.18),inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-md dark:border-emerald-300/25 dark:bg-slate-950/72 dark:text-emerald-300 dark:shadow-[0_18px_46px_rgba(16,185,129,0.16),inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  <motion.div
                    initial={{ scale: 0.72, rotate: -18 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={motionTransitions.spring}
                    className="relative flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_8px_18px_rgba(16,185,129,0.28)]"
                  >
                    <motion.div
                      initial={{ opacity: 0.45, scale: 1 }}
                      animate={{ opacity: 0, scale: 2.2 }}
                      transition={motionTransitions.emphasized}
                      className="absolute inset-0 rounded-full bg-emerald-400"
                      aria-hidden="true"
                    />
                    <motion.svg
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={motionTransitions.base}
                      className="relative size-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={motionTransitions.base}
                  >
                    <Text
                      variant="body2"
                      className="whitespace-nowrap text-sm font-bold text-current"
                    >
                      {currentRound < (practiceSet?.phrases?.length || 0)
                        ? "Frase completada"
                        : "Práctica terminada"}
                    </Text>
                  </motion.div>

                  <motion.span
                    initial={{ scaleX: 0, opacity: 0.7 }}
                    animate={{ scaleX: 1, opacity: 0 }}
                    transition={motionTransitions.emphasized}
                    className="absolute -bottom-1 left-4 right-4 h-px origin-left rounded-full bg-emerald-400"
                    aria-hidden="true"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0.86 }}
                  animate={{ opacity: [0, 1, 0], scaleX: [0.86, 1, 1.04] }}
                  exit={{ opacity: 0 }}
                  transition={motionTransitions.emphasized}
                  className="pointer-events-none absolute left-10 right-10 top-0 h-px origin-center rounded-full bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent"
                  aria-hidden="true"
                />
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}
