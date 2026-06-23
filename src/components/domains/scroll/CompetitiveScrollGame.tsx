"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { MatchIntroOverlay } from "@/components/domains/match/MatchIntroOverlay";
import {
  COMPETITIVE_SCROLL_COUNTDOWN_MS,
  COMPETITIVE_SCROLL_VERSUS_INTRO_MS,
  countCompletedPracticeScrollLines,
  countCompletedPracticeScrollWords,
  getCompetitiveScrollIntroState,
  getCompetitiveScrollTravelPx,
  getNextPracticeScrollTravelPx,
  getPracticeScrollDangerLinePx,
  getPracticeScrollProgress,
  getPracticeScrollSpeedPxPerSecond,
  getPracticeScrollWordLines,
  hasPracticeScrollLineReachedDangerLine,
  PRACTICE_SCROLL_SPEED_INCREMENT_PX_PER_SECOND,
  PRACTICE_SCROLL_SPEED_PX_PER_SECOND,
  shouldAdvancePracticeScroll,
} from "@/domain/practiceScroll";
import {
  applyLockedTypingInput,
  createTypingState,
  isDeletionTypingKey,
  isCopyPasteShortcut,
  isPrintableTypingKey,
  type TypingMistake,
} from "@/domain/typingEngine";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLowPerformanceMode } from "@/hooks";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { usePendingMatchExitGuard } from "@/hooks/usePendingMatchExitGuard";
import {
  m,
  motionTransitions,
  popIn,
  useReducedMotion,
} from "@/motion";
import {
  getScrollTextTransform,
  OpponentScrollMinimap,
  ScrollLineText,
  SCROLL_TEXT_LAYER_STYLE,
  setScrollTextY,
} from "./CompetitiveScrollVisuals";
import { CompetitiveScrollResults } from "./CompetitiveScrollResults";

const SCROLL_CONTAINER_HEIGHT_PX = 560;
const SCROLL_CONFIG = {
  lineHeightPx: 60,
  startOffsetPx: 430,
  dangerLinePx: getPracticeScrollDangerLinePx(SCROLL_CONTAINER_HEIGHT_PX),
};
const SCROLL_SPEED_PX_PER_SECOND = PRACTICE_SCROLL_SPEED_PX_PER_SECOND;
const SCROLL_SPEED_INCREMENT_PX_PER_SECOND =
  PRACTICE_SCROLL_SPEED_INCREMENT_PX_PER_SECOND;
const COMPETITIVE_SCROLL_START_DELAY_MS =
  COMPETITIVE_SCROLL_VERSUS_INTRO_MS + COMPETITIVE_SCROLL_COUNTDOWN_MS;
const PROGRESS_SYNC_MS = 450;

export function CompetitiveScrollGame() {
  const router = useRouter();
  const ownUser = useCurrentUser();
  const gameData = useQuery(api.game.getGameData);
  const updateScrollProgress = useMutation(api.game.updateScrollProgress);
  const finishGame = useMutation(api.game.finishGame);
  const [input, setInput] = useState("");
  const [errors, setErrors] = useState(0);
  const [mistake, setMistake] = useState<TypingMistake | null>(null);
  const [localScrollStartedAt, setLocalScrollStartedAt] = useState<
    number | undefined
  >();
  const [failed, setFailed] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [introNow, setIntroNow] = useState(() => Date.now());
  const [fallbackScrollStartedAt, setFallbackScrollStartedAt] = useState<
    number | undefined
  >();
  const { isLowPerformanceMode } = useLowPerformanceMode();
  const shouldReduceMotion = useReducedMotion();
  const scrollContentRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastInputRef = useRef("");
  const scrollYRef = useRef(0);
  const lastSyncedAtRef = useRef(0);

  const game = gameData?.game;
  const opponent = gameData?.opponent;
  const introStartedAt = game?.scrollStartedAt ?? fallbackScrollStartedAt;
  const introState = useMemo(
    () =>
      getCompetitiveScrollIntroState({
        now: introNow,
        startedAt: introStartedAt,
      }),
    [introNow, introStartedAt]
  );
  const isScrollPlayable = introState.phase === "playing";
  const targetText =
    game?.scrollText ||
    "El modo Scroll necesita texto disponible para crear una partida.";
  const ownProgress = ownUser?._id ? game?.scrollProgress?.[ownUser._id] : undefined;
  const opponentProgress = opponent?._id
    ? game?.scrollProgress?.[opponent._id]
    : undefined;
  const progress = useMemo(
    () => getPracticeScrollProgress(targetText, input),
    [input, targetText]
  );
  const scrollLines = useMemo(
    () => getPracticeScrollWordLines(targetText),
    [targetText]
  );
  const currentCompletedLines = countCompletedPracticeScrollLines(
    scrollLines,
    progress.currentIndex
  );
  const scrollSpeedPxPerSecond = getPracticeScrollSpeedPxPerSecond({
    baseSpeedPxPerSecond: SCROLL_SPEED_PX_PER_SECOND,
    completedLineCount: currentCompletedLines,
    speedIncrementPxPerSecond: SCROLL_SPEED_INCREMENT_PX_PER_SECOND,
  });
  const isFinished = Boolean(game?.winner) || failed || progress.completed;
  const shouldAdvanceScroll = shouldAdvancePracticeScroll({
    hasStartedTyping: isScrollPlayable && hasStartedTyping,
    isFinished,
  });
  const elapsedMs =
    (ownProgress?.finishedAt ?? Date.now()) -
    (ownProgress?.startedAt ?? localScrollStartedAt ?? Date.now());
  const completedWords = countCompletedPracticeScrollWords(
    targetText,
    progress.currentIndex
  );
  const typedPercent = Math.round(
    targetText.length > 0 ? (progress.currentIndex / targetText.length) * 100 : 0
  );
  const isWinner = Boolean(ownUser && game?.winner === ownUser._id);
  const opponentStartedAt =
    opponentProgress?.startedAt ??
    (game?.againstBot && opponent?._id === game.botScrollPlan?.botId
      ? game.botScrollPlan?.startedAt
      : (game?.scrollStartedAt ?? localScrollStartedAt));
  const opponentFinishedAt = opponentProgress?.finishedAt;
  const opponentCompletedLines = countCompletedPracticeScrollLines(
    scrollLines,
    opponentProgress?.currentIndex ?? 0
  );
  const handleConfirmedExit = useCallback(async () => {
    await finishGame();
  }, [finishGame]);
  const { confirmAndExitToHome } = usePendingMatchExitGuard({
    activeGame: ownUser?.activeGame,
    isFinished,
    onConfirmExit: handleConfirmedExit,
  });
  const reportProgressSyncError = useCallback((error: unknown) => {
    console.error("Error syncing competitive scroll progress:", error);
  }, []);

  const syncProgress = useCallback(
    (nextFailed = failed) => {
      if (!ownUser || game?.mode !== "scroll" || game?.winner) return;

      void updateScrollProgress({
        currentIndex: progress.currentIndex,
        errors,
        failed: nextFailed,
      }).catch(reportProgressSyncError);
      lastSyncedAtRef.current = Date.now();
    },
    [
      errors,
      failed,
      game?.mode,
      game?.winner,
      ownUser,
      progress.currentIndex,
      reportProgressSyncError,
      updateScrollProgress,
    ]
  );

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!ownUser) return;

    if (!ownUser.activeGame) {
      router.push("/home");
    }
  }, [ownUser, router]);

  useEffect(() => {
    if (game && game.mode !== "scroll") {
      router.push("/1v1");
    }
  }, [game, router]);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  useEffect(() => {
    if (!game || game.mode !== "scroll" || game.scrollStartedAt) return;
    if (fallbackScrollStartedAt !== undefined) return;

    setFallbackScrollStartedAt(Date.now() + COMPETITIVE_SCROLL_START_DELAY_MS);
  }, [fallbackScrollStartedAt, game]);

  useEffect(() => {
    if (!game || game.winner || introState.phase === "playing") return;

    const intervalId = window.setInterval(() => {
      setIntroNow(Date.now());
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [game, game?.winner, introState.phase]);

  useEffect(() => {
    setScrollTextY(scrollContentRef.current, SCROLL_CONFIG.startOffsetPx);
  }, []);

  useEffect(() => {
    if (!isScrollPlayable || localScrollStartedAt !== undefined) return;

    const startedAt = introStartedAt ?? Date.now();
    const now = Date.now();
    const initialScrollY = getCompetitiveScrollTravelPx({
      baseSpeedPxPerSecond: SCROLL_SPEED_PX_PER_SECOND,
      completedLineCount: currentCompletedLines,
      now,
      speedIncrementPxPerSecond: SCROLL_SPEED_INCREMENT_PX_PER_SECOND,
      startedAt,
    });

    scrollYRef.current = initialScrollY;
    lastFrameTimeRef.current = null;
    setLocalScrollStartedAt(startedAt);
    setHasStartedTyping(true);
    setScrollTextY(
      scrollContentRef.current,
      SCROLL_CONFIG.startOffsetPx - initialScrollY
    );
    window.setTimeout(focusInput, 0);
  }, [
    currentCompletedLines,
    focusInput,
    introStartedAt,
    isScrollPlayable,
    localScrollStartedAt,
  ]);

  useEffect(() => {
    if (!shouldAdvanceScroll || localScrollStartedAt === undefined) return;

    const tick = (time: number) => {
      const previousFrameTime = lastFrameTimeRef.current ?? time;
      const nextScrollY = getNextPracticeScrollTravelPx({
        currentTravelPx: scrollYRef.current,
        elapsedMs: time - previousFrameTime,
        speedPxPerSecond: scrollSpeedPxPerSecond,
      });

      scrollYRef.current = nextScrollY;
      lastFrameTimeRef.current = time;
      setScrollTextY(
        scrollContentRef.current,
        SCROLL_CONFIG.startOffsetPx - nextScrollY
      );

      if (
        hasPracticeScrollLineReachedDangerLine({
          currentIndex: progress.currentIndex,
          lines: scrollLines,
          travelPx: nextScrollY,
          config: SCROLL_CONFIG,
        })
      ) {
        setFailed(true);
        syncProgress(true);
        return false;
      }

      if (Date.now() - lastSyncedAtRef.current >= PROGRESS_SYNC_MS) {
        syncProgress();
      }

      return true;
    };

    let frameId = 0;
    const animate = (time: number) => {
      if (tick(time)) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [
    currentCompletedLines,
    progress.currentIndex,
    scrollLines,
    localScrollStartedAt,
    shouldAdvanceScroll,
    scrollSpeedPxPerSecond,
    syncProgress,
  ]);

  useEffect(() => {
    if (!progress.completed) return;
    syncProgress(false);
  }, [progress.completed, syncProgress]);

  const applyScrollInput = useCallback(
    (nextInput: string, now = Date.now()) => {
      const previousErrors = Array.from({ length: errors }, () => 0);
      const nextState = applyLockedTypingInput(
        {
          ...createTypingState(targetText),
          input,
          errors: previousErrors,
          mistake,
          startedAt: localScrollStartedAt ?? null,
        },
        nextInput,
        now
      );
      const nextErrors = nextState.errors.length;
      const nextProgress = getPracticeScrollProgress(targetText, nextState.input);
      const attemptedTyping =
        nextState.input.length > input.length || nextErrors > errors;

      if (!hasStartedTyping && attemptedTyping) {
        setHasStartedTyping(true);
        setLocalScrollStartedAt((value) => value ?? now);

        if (ownUser && game?.mode === "scroll" && !game?.winner) {
          void updateScrollProgress({
            currentIndex: nextProgress.currentIndex,
            errors: nextErrors,
            failed: false,
          }).catch(reportProgressSyncError);
          lastSyncedAtRef.current = now;
        }
      }

      lastInputRef.current = nextState.input;
      setInput(nextState.input);
      setErrors(nextErrors);
      setMistake(nextState.mistake);
    },
    [
      errors,
      game?.mode,
      game?.winner,
      hasStartedTyping,
      input,
      localScrollStartedAt,
      mistake,
      ownUser,
      reportProgressSyncError,
      targetText,
      updateScrollProgress,
    ]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextInput = event.target.value;

    if (!isScrollPlayable || isFinished || nextInput.length > targetText.length) {
      return;
    }

    applyScrollInput(nextInput);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isCopyPasteShortcut(event)) {
      event.preventDefault();
      return;
    }

    if (!isScrollPlayable || isFinished) {
      event.preventDefault();
      return;
    }

    if (mistake && isDeletionTypingKey(event)) {
      event.preventDefault();
      applyScrollInput(input);
      return;
    }

    if (!isPrintableTypingKey(event)) {
      return;
    }

    const expectedChar = targetText[input.length];
    if (event.key === expectedChar) {
      return;
    }

    event.preventDefault();
    applyScrollInput(`${input}${event.key}`);
  };

  const handleFinish = async () => {
    if (isFinishing) return;

    setIsFinishing(true);
    try {
      await finishGame();
      router.push("/home");
    } catch {
      setIsFinishing(false);
    }
  };

  useGlobalShortcut({
    scope: "match",
    key: "k",
    modifier: "primary",
    enabled: Boolean(game?.winner),
    onShortcut: handleFinish,
  });

  useGlobalShortcut({
    scope: "match",
    key: "h",
    modifier: "primary",
    enabled: Boolean(ownUser?.activeGame && !isFinished),
    onShortcut: confirmAndExitToHome,
  });

  return (
    <m.section
      animate="animate"
      className="relative flex h-full w-full flex-col items-center justify-center gap-6 px-6 py-4"
      exit="exit"
      initial="initial"
      transition={motionTransitions.emphasized}
      variants={popIn}
    >
      <MatchIntroOverlay
        countdownValue={introState.countdownValue}
        isVisible={Boolean(game && !game.winner && introState.phase !== "playing")}
        opponent={opponent}
        ownUser={ownUser}
        phase={introState.phase}
        shouldReduceMotion={Boolean(shouldReduceMotion)}
      />

      <button
        type="button"
        onClick={confirmAndExitToHome}
        className="absolute left-10 top-28 z-20 rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] px-4 py-2 text-sm font-black text-[var(--tw-home-fg)] shadow-[var(--tw-home-shadow)] transition-colors hover:border-orange-500/45 hover:text-orange-500"
      >
        Home
      </button>

      <OpponentScrollMinimap
        baseSpeedPxPerSecond={SCROLL_SPEED_PX_PER_SECOND}
        completedLineCount={opponentCompletedLines}
        currentIndex={opponentProgress?.currentIndex ?? 0}
        dangerLinePx={SCROLL_CONFIG.dangerLinePx}
        finishedAt={opponentFinishedAt}
        hasWinner={Boolean(game?.winner)}
        opponent={opponent}
        speedIncrementPxPerSecond={SCROLL_SPEED_INCREMENT_PX_PER_SECOND}
        startOffsetPx={SCROLL_CONFIG.startOffsetPx}
        startedAt={opponentStartedAt}
        text={targetText}
      />

      <CompetitiveScrollResults
        isVisible={Boolean(game?.winner)}
        onClose={handleFinish}
        completedWords={completedWords}
        elapsedMs={elapsedMs}
        errors={ownProgress?.errors ?? errors}
        isWinner={isWinner}
        opponentTypedWords={opponentProgress?.typedWords ?? 0}
        typedPercent={typedPercent}
      />

      <div
        className="relative h-[560px] w-full max-w-[58rem] cursor-text overflow-hidden rounded-[1.75rem] border border-[#575279]/10 bg-[#575279]/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_24px_70px_rgba(87,82,121,0.1)] backdrop-blur-[2px] dark:border-white/10 dark:bg-[rgba(7,13,29,0.52)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_100px_rgba(0,0,0,0.26)] dark:backdrop-blur-md"
        onClick={focusInput}
      >
        <div
          className="absolute left-0 right-0 top-1/2 z-10 h-1 -translate-y-1/2 bg-gradient-to-r from-transparent via-red-500/90 to-transparent shadow-[0_0_24px_rgba(239,68,68,0.68)]"
        />
        {!isLowPerformanceMode && (
          <div className="absolute left-0 right-0 top-1/2 z-10 h-12 -translate-y-1/2 bg-gradient-to-r from-transparent via-red-500/10 to-transparent blur-md" />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-[linear-gradient(to_bottom,rgba(250,244,237,0.94)_0%,rgba(250,244,237,0.58)_38%,rgba(250,244,237,0.14)_76%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(3,7,18,0.94)_0%,rgba(3,7,18,0.6)_38%,rgba(3,7,18,0.14)_76%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-[linear-gradient(to_top,rgba(250,244,237,0.95)_0%,rgba(250,244,237,0.58)_40%,rgba(250,244,237,0.14)_78%,transparent_100%)] dark:bg-[linear-gradient(to_top,rgba(3,7,18,0.95)_0%,rgba(3,7,18,0.62)_40%,rgba(3,7,18,0.14)_78%,transparent_100%)]" />

        <div
          ref={scrollContentRef}
          className="absolute left-1/2 top-0 w-[34ch] font-mono text-[32px] font-semibold leading-[60px] tracking-normal"
          style={{
            ...SCROLL_TEXT_LAYER_STYLE,
            transform: getScrollTextTransform(SCROLL_CONFIG.startOffsetPx),
          }}
        >
          {scrollLines.map((line) => (
            <div
              key={`${line.startIndex}-${line.endIndex}`}
              className="h-[60px] whitespace-pre text-center"
            >
              <ScrollLineText
                hasStarted={hasStartedTyping}
                mistake={
                  mistake &&
                  mistake.index >= line.startIndex &&
                  mistake.index < line.endIndex
                    ? {
                        ...mistake,
                        index: mistake.index - line.startIndex,
                      }
                    : null
                }
                showCursor={
                  progress.currentIndex >= line.startIndex &&
                  progress.currentIndex < line.endIndex
                }
                targetText={line.text}
                userInput={input.slice(line.startIndex, line.endIndex)}
              />
            </div>
          ))}
        </div>

        <input
          ref={inputRef}
          autoComplete="off"
          className="pointer-events-none absolute opacity-0"
          disabled={!isScrollPlayable || isFinished}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={(event) => event.preventDefault()}
          spellCheck="false"
          type="text"
          value={input}
        />
      </div>
    </m.section>
  );
}
