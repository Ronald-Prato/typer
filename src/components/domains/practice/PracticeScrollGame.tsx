"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ResultsOverlay } from "@/components/overlays/ResultsOverlay";
import { Text } from "@/components/Typography";
import practiceScrollParagraphs from "@/data/practiceScrollParagraphs.json";
import {
  countCompletedPracticeScrollParagraphs,
  countCompletedPracticeScrollLines,
  countCompletedPracticeScrollWords,
  getAverageBookPagesForWords,
  getPracticeScrollDangerLinePx,
  getPracticeScrollProgress,
  getPracticeScrollText,
  getPracticeScrollWordLines,
  getPracticeScrollSpeedPxPerSecond,
  hasPracticeScrollMeasuredLineFailed,
  shouldAdvancePracticeScroll,
} from "@/domain/practiceScroll";
import {
  formatTypingTime,
  isCopyPasteShortcut,
} from "@/domain/typingEngine";
import { m, motionTransitions, popIn } from "@/motion";
import {
  BookOpenIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const SCROLL_CONTAINER_HEIGHT_PX = 560;

const SCROLL_CONFIG = {
  charsPerLine: 26,
  lineHeightPx: 70,
  startOffsetPx: 430,
  dangerLinePx: getPracticeScrollDangerLinePx(SCROLL_CONTAINER_HEIGHT_PX),
};

const SCROLL_SPEED_PX_PER_SECOND = 16;
const SCROLL_SPEED_INCREMENT_PX_PER_SECOND = 0.5;
const PRACTICE_SCROLL_PARAGRAPHS = practiceScrollParagraphs as string[];

interface PracticeScrollGameProps {
  onBackToModes: () => void;
}

export function PracticeScrollGame({ onBackToModes }: PracticeScrollGameProps) {
  const [input, setInput] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const laserRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);
  const animationStartRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastInputRef = useRef("");
  const scrollYRef = useRef(0);

  const targetText =
    getPracticeScrollText(PRACTICE_SCROLL_PARAGRAPHS) ||
    "El modo practica necesita un parrafo disponible para seguir escribiendo.";
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
  const isFinished = failed || progress.completed;
  const showResults = isFinished;
  const shouldAdvanceScroll = shouldAdvancePracticeScroll({
    hasStartedTyping,
    isFinished,
  });
  const elapsedMs = (finishedAt ?? Date.now()) - startedAt;
  const typedPercent = Math.round(
    (progress.currentIndex / targetText.length) * 100
  );
  const completedWords = countCompletedPracticeScrollWords(
    targetText,
    progress.currentIndex
  );
  const completedParagraphs = countCompletedPracticeScrollParagraphs(
    PRACTICE_SCROLL_PARAGRAPHS,
    progress.currentIndex
  );
  const averageBookPages = getAverageBookPagesForWords(completedWords);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const resetPracticeScroll = useCallback(() => {
    setInput("");
    setScrollY(0);
    setErrors(0);
    setFailed(false);
    setHasStartedTyping(false);
    setStartedAt(Date.now());
    setFinishedAt(null);
    animationStartRef.current = null;
    lastFrameTimeRef.current = null;
    lastInputRef.current = "";
    scrollYRef.current = 0;
    window.setTimeout(focusInput, 0);
  }, [focusInput]);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  useEffect(() => {
    if (!shouldAdvanceScroll) return;

    let frameId = 0;

    const tick = (time: number) => {
      animationStartRef.current ??= time;
      const previousFrameTime = lastFrameTimeRef.current ?? time;
      const elapsedSeconds = (time - previousFrameTime) / 1000;
      const nextScrollY =
        scrollYRef.current + elapsedSeconds * scrollSpeedPxPerSecond;
      const scrollDelta = nextScrollY - scrollYRef.current;
      const laserY = laserRef.current?.getBoundingClientRect().top;

      setScrollY(nextScrollY);
      scrollYRef.current = nextScrollY;
      lastFrameTimeRef.current = time;

      if (
        laserY !== undefined &&
        hasPracticeScrollMeasuredLineFailed({
          currentIndex: progress.currentIndex,
          laserY,
          lines: scrollLines.map((line, index) => {
            const rect = lineRefs.current[index]?.getBoundingClientRect();

            return {
              ...line,
              topY: rect ? rect.top - scrollDelta : Number.POSITIVE_INFINITY,
              bottomY: rect
                ? rect.bottom - scrollDelta
                : Number.POSITIVE_INFINITY,
            };
          }),
        })
      ) {
        setFailed(true);
        setFinishedAt((value) => value ?? Date.now());
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [
    progress.currentIndex,
    scrollLines,
    scrollSpeedPxPerSecond,
    shouldAdvanceScroll,
  ]);

  useEffect(() => {
    if (!progress.completed) return;

    setFinishedAt((value) => value ?? Date.now());
  }, [progress.completed]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextInput = event.target.value;
    const previousInput = lastInputRef.current;

    if (isFinished || nextInput.length > targetText.length) {
      return;
    }

    if (!hasStartedTyping && nextInput.length > 0) {
      setHasStartedTyping(true);
      setStartedAt(Date.now());
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

  const handleRestart = () => {
    resetPracticeScroll();
  };

  return (
    <m.section
      variants={popIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={motionTransitions.emphasized}
      className="flex w-full flex-col items-center gap-7"
    >
      <ResultsOverlay
        isVisible={showResults}
        roundsData={[]}
        onClose={onBackToModes}
        onRestart={handleRestart}
        title={failed ? "La línea te alcanzó" : "Scroll completado"}
        description={
          failed
            ? "Llegaste hasta aquí antes de que el texto tocara el límite."
            : "Buen ritmo. Le ganaste al scroll."
        }
        heroValue={String(completedWords)}
        heroSuffix="palabras"
        heroLabel="Texto escrito"
        heroIcon={<DocumentTextIcon className="size-8" />}
        restartLabel="Reintentar"
        restartShortcut="Space"
        tipTitle="Lectura del intento"
        tip={`${completedWords} palabras equivalen a ${averageBookPages} páginas promedio de libro.`}
        levelLabel={failed ? "Interrumpido" : "Completado"}
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
            icon: <BookOpenIcon className="size-5" />,
            label: "Páginas",
            value: averageBookPages,
            tone: "violet",
          },
        ]}
      />

      <div
        className="relative h-[560px] w-full max-w-[48rem] cursor-text overflow-hidden rounded-[1.75rem] border border-[#575279]/10 bg-[#575279]/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_24px_70px_rgba(87,82,121,0.1)] backdrop-blur-[2px] dark:border-white/10 dark:bg-[rgba(7,13,29,0.46)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_100px_rgba(0,0,0,0.26)] dark:backdrop-blur-md"
        onClick={focusInput}
      >
        <div
          ref={laserRef}
          className="absolute left-0 right-0 top-1/2 z-10 h-1 -translate-y-1/2 bg-gradient-to-r from-transparent via-red-500/90 to-transparent shadow-[0_0_24px_rgba(239,68,68,0.68)]"
        />
        <div className="absolute left-0 right-0 top-1/2 z-10 h-12 -translate-y-1/2 bg-gradient-to-r from-transparent via-red-500/10 to-transparent blur-md" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-44 bg-gradient-to-b from-[#faf4ed]/90 via-[#faf4ed]/44 to-transparent dark:from-[#030712]/90 dark:via-[#030712]/44" />
        <div className="pointer-events-none absolute inset-x-[-2rem] top-[-1.5rem] z-10 h-24 rounded-b-full bg-[#575279]/10 blur-3xl dark:bg-white/10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[#faf4ed]/95 via-[#faf4ed]/58 to-transparent dark:from-[#030712]/95 dark:via-[#030712]/58" />
        <div className="pointer-events-none absolute inset-x-8 bottom-0 z-10 h-10 rounded-t-full bg-orange-500/18 blur-2xl dark:bg-orange-400/16" />

        <m.div
          animate={{ y: SCROLL_CONFIG.startOffsetPx - scrollY }}
          transition={{ duration: 0 }}
          className="absolute left-1/2 top-0 w-[34ch] -translate-x-1/2 font-mono text-[34px] font-semibold leading-[70px] tracking-normal"
        >
          {scrollLines.map((line, index) => (
            <div
              key={`${line.startIndex}-${line.endIndex}`}
              ref={(element) => {
                lineRefs.current[index] = element;
              }}
              className="h-[70px] whitespace-pre text-center"
            >
              <PracticeScrollLineText
                targetText={line.text}
                userInput={input.slice(line.startIndex, line.endIndex)}
                hasStarted={input.length > 0}
                showCursor={
                  progress.currentIndex >= line.startIndex &&
                  progress.currentIndex < line.endIndex
                }
              />
            </div>
          ))}
        </m.div>

        <input
          ref={inputRef}
          type="text"
          value={input}
          disabled={isFinished}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={(event) => event.preventDefault()}
          className="pointer-events-none absolute opacity-0"
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      <div className="flex min-h-[76px] flex-wrap justify-center gap-4 text-center">
        <Metric label="Progreso" value={`${typedPercent}%`} tone="orange" />
        <Metric label="Palabras" value={String(completedWords)} tone="orange" />
        <Metric
          label="Párrafos"
          value={String(completedParagraphs)}
          tone="blue"
        />
        <Metric
          label="Velocidad"
          value={`${scrollSpeedPxPerSecond}px/s`}
          tone="blue"
        />
        <Metric label="Errores" value={String(errors)} tone="red" />
        <Metric label="Tiempo" value={formatTypingTime(elapsedMs)} tone="blue" />
      </div>
    </m.section>
  );
}

function PracticeScrollLineText({
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
          "font-bold rounded-sm bg-red-500/[0.04] text-slate-700 drop-shadow-[0_0_7px_rgba(239,68,68,0.36)] dark:bg-red-400/[0.06] dark:text-slate-100 dark:drop-shadow-[0_0_8px_rgba(248,113,113,0.42)]";
        displayChar = userInput[index] === " " ? "_" : userInput[index];
      }
    } else if (isCursor) {
      colorClass = [
        "bg-gray-600/80 text-gray-300 drop-shadow-lg shadow-gray-400/60 backdrop-blur-sm",
        !hasStarted && "animate-pulse",
      ]
        .filter(Boolean)
        .join(" ");
    } else {
      colorClass = "text-gray-500 drop-shadow-sm shadow-gray-600/20";
    }

    return (
      <span
        key={index}
        className={`inline ${colorClass}`}
      >
        {displayChar}
      </span>
    );
  });
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "orange" | "red" | "blue";
}) {
  const toneClass = {
    orange: "text-orange-500",
    red: "text-red-400",
    blue: "text-blue-400",
  }[tone];

  return (
    <div className="flex min-w-[10rem] flex-col justify-center rounded-xl border border-[#575279]/10 bg-white/20 px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <Text variant="h6" className={`${toneClass} font-bold`}>
        {value}
      </Text>
      <Text variant="body2" className="text-gray-400">
        {label}
      </Text>
    </div>
  );
}
