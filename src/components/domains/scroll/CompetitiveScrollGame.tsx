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
import { UserAvatarImage } from "@/components/Avatar";
import { ResultsOverlay } from "@/components/overlays/ResultsOverlay";
import {
  countCompletedPracticeScrollLines,
  countCompletedPracticeScrollWords,
  getAverageBookPagesForWords,
  getCompetitiveScrollTravelPx,
  getNextPracticeScrollTravelPx,
  getPracticeScrollDangerLinePx,
  getPracticeScrollProgress,
  getPracticeScrollSpeedPxPerSecond,
  getPracticeScrollWordLines,
  getScrollMinimapWordBlocks,
  hasCompetitiveScrollStartSignal,
  hasPracticeScrollLineReachedDangerLine,
  PRACTICE_SCROLL_SPEED_INCREMENT_PX_PER_SECOND,
  PRACTICE_SCROLL_SPEED_PX_PER_SECOND,
  shouldAdvancePracticeScroll,
} from "@/domain/practiceScroll";
import {
  formatTypingTime,
  isCopyPasteShortcut,
} from "@/domain/typingEngine";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLowPerformanceMode } from "@/hooks";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { usePendingMatchExitGuard } from "@/hooks/usePendingMatchExitGuard";
import { m, motionTransitions, popIn, useMotionValue } from "@/motion";
import {
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const SCROLL_CONTAINER_HEIGHT_PX = 560;
const SCROLL_CONFIG = {
  lineHeightPx: 60,
  startOffsetPx: 430,
  dangerLinePx: getPracticeScrollDangerLinePx(SCROLL_CONTAINER_HEIGHT_PX),
};
const SCROLL_SPEED_PX_PER_SECOND = PRACTICE_SCROLL_SPEED_PX_PER_SECOND;
const SCROLL_SPEED_INCREMENT_PX_PER_SECOND =
  PRACTICE_SCROLL_SPEED_INCREMENT_PX_PER_SECOND;
const PROGRESS_SYNC_MS = 450;
const OPPONENT_MINIMAP_SCROLL_SCALE = 0.22;
const OPPONENT_MINIMAP_DANGER_TOP_PX = 32;
const OPPONENT_MINIMAP_START_LEAD_PX =
  (SCROLL_CONFIG.startOffsetPx - SCROLL_CONFIG.dangerLinePx) *
  OPPONENT_MINIMAP_SCROLL_SCALE;

export function CompetitiveScrollGame() {
  const router = useRouter();
  const ownUser = useCurrentUser();
  const gameData = useQuery(api.game.getGameData);
  const updateScrollProgress = useMutation(api.game.updateScrollProgress);
  const finishGame = useMutation(api.game.finishGame);
  const [input, setInput] = useState("");
  const [errors, setErrors] = useState(0);
  const [localScrollStartedAt, setLocalScrollStartedAt] = useState<
    number | undefined
  >();
  const [failed, setFailed] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [opponentPreviewNow, setOpponentPreviewNow] = useState(() => Date.now());
  const { isLowPerformanceMode } = useLowPerformanceMode();
  const scrollContentY = useMotionValue(SCROLL_CONFIG.startOffsetPx);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastInputRef = useRef("");
  const scrollYRef = useRef(0);
  const lastSyncedAtRef = useRef(0);

  const game = gameData?.game;
  const opponent = gameData?.opponent;
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
  const hasScrollStartSignal = useMemo(
    () =>
      hasCompetitiveScrollStartSignal({
        progressByPlayerId: game?.scrollProgress,
        scrollStartedAt: game?.scrollStartedAt,
      }),
    [game?.scrollProgress, game?.scrollStartedAt]
  );
  const shouldAdvanceScroll = shouldAdvancePracticeScroll({
    hasStartedTyping: localScrollStartedAt !== undefined,
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
      : localScrollStartedAt);
  const opponentFinishedAt = opponentProgress?.finishedAt;
  const opponentCompletedLines = countCompletedPracticeScrollLines(
    scrollLines,
    opponentProgress?.currentIndex ?? 0
  );
  const opponentScrollY = getCompetitiveScrollTravelPx({
    baseSpeedPxPerSecond: SCROLL_SPEED_PX_PER_SECOND,
    completedLineCount: opponentCompletedLines,
    finishedAt: opponentFinishedAt,
    now: opponentPreviewNow,
    speedIncrementPxPerSecond: SCROLL_SPEED_INCREMENT_PX_PER_SECOND,
    startedAt: opponentStartedAt,
  });
  const handleConfirmedExit = useCallback(async () => {
    await finishGame();
  }, [finishGame]);
  const { confirmAndExitToHome } = usePendingMatchExitGuard({
    activeGame: ownUser?.activeGame,
    isFinished,
    onConfirmExit: handleConfirmedExit,
  });

  const syncProgress = useCallback(
    (nextFailed = failed) => {
      if (!ownUser || game?.mode !== "scroll" || game?.winner) return;

      void updateScrollProgress({
        currentIndex: progress.currentIndex,
        errors,
        failed: nextFailed,
      });
      lastSyncedAtRef.current = Date.now();
    },
    [
      errors,
      failed,
      game?.mode,
      game?.winner,
      ownUser,
      progress.currentIndex,
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
    if (localScrollStartedAt !== undefined || !hasScrollStartSignal) return;

    setLocalScrollStartedAt(Date.now());
  }, [hasScrollStartSignal, localScrollStartedAt]);

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
      scrollContentY.set(SCROLL_CONFIG.startOffsetPx - nextScrollY);

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
    scrollContentY,
    shouldAdvanceScroll,
    scrollSpeedPxPerSecond,
    syncProgress,
  ]);

  useEffect(() => {
    if (!progress.completed) return;
    syncProgress(false);
  }, [progress.completed, syncProgress]);

  useEffect(() => {
    if (!opponentStartedAt || opponentFinishedAt || game?.winner) return;

    let frameId = 0;
    const animate = () => {
      setOpponentPreviewNow(Date.now());
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [game?.winner, opponentFinishedAt, opponentStartedAt]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextInput = event.target.value;
    const previousInput = lastInputRef.current;

    if (isFinished || nextInput.length > targetText.length) {
      return;
    }

    if (!hasStartedTyping && nextInput.length > 0) {
      const now = Date.now();
      const nextProgress = getPracticeScrollProgress(targetText, nextInput);
      const nextErrors =
        nextInput.length > previousInput.length &&
        nextInput[nextInput.length - 1] !== targetText[nextInput.length - 1]
          ? errors + 1
          : errors;

      setHasStartedTyping(true);
      setLocalScrollStartedAt((value) => value ?? now);
      void updateScrollProgress({
        currentIndex: nextProgress.currentIndex,
        errors: nextErrors,
        failed: false,
      });
      lastSyncedAtRef.current = now;
    }

    if (
      nextInput.length > previousInput.length &&
      nextInput[nextInput.length - 1] !== targetText[nextInput.length - 1]
    ) {
      setErrors((value) => value + 1);
    }

    lastInputRef.current = nextInput;
    setInput(nextInput);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isCopyPasteShortcut(event)) {
      event.preventDefault();
    }
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
      <button
        type="button"
        onClick={confirmAndExitToHome}
        className="absolute left-6 top-6 z-30 rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] px-4 py-2 text-sm font-black text-[var(--tw-home-fg)] shadow-[var(--tw-home-shadow)] transition-colors hover:border-orange-500/45 hover:text-orange-500"
      >
        Home
      </button>

      <OpponentScrollMinimap
        currentIndex={opponentProgress?.currentIndex ?? 0}
        opponent={opponent}
        scrollY={opponentScrollY}
        text={targetText}
      />

      <ResultsOverlay
        isVisible={Boolean(game?.winner)}
        roundsData={[]}
        onClose={handleFinish}
        title={isWinner ? "Victoria" : "Derrota"}
        description={
          isWinner
            ? "Le ganaste al scroll antes que tu rival."
            : "Tu rival sobrevivió mejor al scroll."
        }
        heroValue={String(completedWords)}
        heroSuffix="palabras"
        heroLabel="Texto escrito"
        heroIcon={<DocumentTextIcon className="size-8" />}
        closeLabel="Continuar"
        shortcutDelayMs={!isWinner ? 500 : 0}
        tipTitle="Lectura de la partida"
        tip={`${completedWords} palabras equivalen a ${getAverageBookPagesForWords(completedWords)} páginas promedio de libro. Tu rival llegó a ${opponentProgress?.typedWords ?? 0} palabras.`}
        showTipPanel
        levelLabel={isWinner ? "Victoria" : "Derrota"}
        levelProgress={typedPercent}
        stats={[
          {
            icon: <DocumentTextIcon className="size-5" />,
            label: "Palabras",
            value: String(completedWords),
            tone: "emerald",
          },
          {
            icon: <ClockIcon className="size-5" />,
            label: "Tiempo",
            value: formatTypingTime(elapsedMs),
            tone: "blue",
          },
          {
            icon: <ExclamationTriangleIcon className="size-5" />,
            label: "Errores",
            value: String(ownProgress?.errors ?? errors),
            tone: "rose",
          },
        ]}
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

        <m.div
          className="absolute left-1/2 top-0 w-[34ch] -translate-x-1/2 font-mono text-[32px] font-semibold leading-[60px] tracking-normal"
          style={{ y: scrollContentY }}
        >
          {scrollLines.map((line) => (
            <div
              key={`${line.startIndex}-${line.endIndex}`}
              className="h-[60px] whitespace-pre text-center"
            >
              <ScrollLineText
                hasStarted={input.length > 0}
                showCursor={
                  progress.currentIndex >= line.startIndex &&
                  progress.currentIndex < line.endIndex
                }
                targetText={line.text}
                userInput={input.slice(line.startIndex, line.endIndex)}
              />
            </div>
          ))}
        </m.div>

        <input
          ref={inputRef}
          autoComplete="off"
          className="pointer-events-none absolute opacity-0"
          disabled={isFinished}
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

function OpponentScrollMinimap({
  currentIndex,
  opponent,
  scrollY,
  text,
}: {
  currentIndex: number;
  opponent: any;
  scrollY: number;
  text: string;
}) {
  const blocks = useMemo(
    () => getScrollMinimapWordBlocks(text, currentIndex),
    [currentIndex, text]
  );
  const rows = useMemo(() => {
    const lines = getPracticeScrollWordLines(text);

    return lines.map((line) =>
      blocks.filter(
        (block) =>
          block.startIndex >= line.startIndex && block.endIndex <= line.endIndex
      )
    );
  }, [blocks, text]);
  const contentY =
    OPPONENT_MINIMAP_DANGER_TOP_PX +
    OPPONENT_MINIMAP_START_LEAD_PX -
    scrollY * OPPONENT_MINIMAP_SCROLL_SCALE;

  return (
    <aside className="absolute right-4 top-6 z-30 w-72 rounded-2xl border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-3 shadow-[var(--tw-home-shadow)] backdrop-blur-xl lg:left-[calc(50%+29rem)] lg:right-auto">
      <div className="mb-3 flex items-center gap-2">
        <UserAvatarImage
          avatarSeed={opponent?.avatarSeed}
          avatarUrl={opponent?.avatarUrl}
          className="size-8"
          initialsClassName="text-xs"
          nickname={opponent?.nickname}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[var(--tw-home-fg)]">
            {opponent?.nickname || "Oponente"}
          </p>
        </div>
      </div>
      <div className="relative h-[136px] overflow-hidden bg-gradient-to-b from-transparent via-red-500/5 to-transparent dark:via-red-950/10">
        <div
          className="absolute left-0 right-0 z-20 h-px bg-gradient-to-r from-transparent via-red-500/90 to-transparent shadow-[0_0_18px_rgba(239,68,68,0.7)]"
          style={{ top: OPPONENT_MINIMAP_DANGER_TOP_PX }}
        />
        <div
          className="absolute left-0 right-0 z-10 h-8 -translate-y-1/2 bg-gradient-to-r from-transparent via-red-500/12 to-transparent blur-md"
          style={{ top: OPPONENT_MINIMAP_DANGER_TOP_PX }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-6 bg-gradient-to-b from-[#faf4ed]/80 via-[#faf4ed]/30 to-transparent dark:from-[#030712]/80 dark:via-[#030712]/30" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-8 bg-gradient-to-t from-[#faf4ed]/82 via-[#faf4ed]/34 to-transparent dark:from-[#030712]/82 dark:via-[#030712]/34" />
        <m.div
          animate={{ y: contentY }}
          className="absolute left-1/2 top-0 w-[22ch] -translate-x-1/2 space-y-2 drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]"
          transition={{ duration: 0 }}
        >
          {rows.map((row, rowIndex) => (
            <div
              key={`${rowIndex}-${row[0]?.startIndex ?? "empty"}`}
              className="flex h-4 justify-center gap-2"
            >
              {row.map((block) => (
                <span
                  key={`${block.startIndex}-${block.endIndex}`}
                  className={
                    block.completed
                      ? "h-4 bg-orange-400"
                      : "h-4 bg-[#575279]/35 dark:bg-slate-500/70"
                  }
                  style={{
                    width: `${Math.max(10, Math.min(46, block.width * 1.16))}px`,
                  }}
                />
              ))}
            </div>
          ))}
        </m.div>
      </div>
    </aside>
  );
}

function ScrollLineText({
  targetText,
  userInput,
  hasStarted,
  showCursor,
}: {
  targetText: string;
  userInput: string;
  hasStarted: boolean;
  showCursor: boolean;
}) {
  return targetText.split("").map((char, index) => {
    let colorClass = "";
    let displayChar = char;
    const isCursor = showCursor && index === userInput.length;

    if (index < userInput.length) {
      if (userInput[index] === char) {
        colorClass = "font-bold text-orange-500";
      } else {
        colorClass =
          "font-bold text-[#9f4f4f] underline decoration-[#c97878] decoration-wavy underline-offset-4 dark:text-[#f0a8a8] dark:decoration-[#d98f8f]";
        displayChar = userInput[index] === " " ? "␣" : userInput[index];
      }
    } else if (isCursor) {
      colorClass = [
        "bg-[#575279]/18 text-[#575279] drop-shadow-lg shadow-[#575279]/20 backdrop-blur-sm dark:bg-gray-600/80 dark:text-gray-300 dark:shadow-gray-400/60",
        !hasStarted && "animate-pulse",
      ]
        .filter(Boolean)
        .join(" ");
    } else {
      colorClass =
        "text-[#575279]/38 drop-shadow-sm shadow-[#575279]/10 dark:text-gray-500 dark:shadow-gray-600/20";
    }

    return (
      <span key={index} className={`inline ${colorClass}`}>
        {displayChar}
      </span>
    );
  });
}
