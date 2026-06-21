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
  getRandomizedPracticeScrollParagraphsAfterPrevious,
  getPracticeScrollSpeedPxPerSecond,
  hasPracticeScrollLineReachedDangerLine,
  PRACTICE_SCROLL_SPEED_INCREMENT_PX_PER_SECOND,
  PRACTICE_SCROLL_SPEED_PX_PER_SECOND,
  shouldAdvancePracticeScroll,
} from "@/domain/practiceScroll";
import {
  formatTypingTime,
  isCopyPasteShortcut,
} from "@/domain/typingEngine";
import { cn } from "@/lib/utils";
import { m, motionTransitions, popIn, useMotionValue } from "@/motion";
import { useLowPerformanceMode } from "@/hooks";
import {
  BookOpenIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const SCROLL_CONTAINER_HEIGHT_PX = 560;
const COMPACT_SCROLL_CONTAINER_HEIGHT_PX = 560;
const SCROLL_START_OFFSET_PX = 430;
const COMPACT_SCROLL_START_OFFSET_PX = 430;
const SCROLL_LINE_HEIGHT_PX = 60;

const getScrollConfig = ({
  containerHeightPx,
  startOffsetPx,
}: {
  containerHeightPx: number;
  startOffsetPx: number;
}) => ({
  charsPerLine: 26,
  lineHeightPx: SCROLL_LINE_HEIGHT_PX,
  startOffsetPx,
  dangerLinePx: getPracticeScrollDangerLinePx(containerHeightPx),
});

const PRACTICE_SCROLL_PARAGRAPHS = practiceScrollParagraphs as string[];
let lastPracticeScrollFirstParagraph: string | undefined;

interface PracticeScrollGameProps {
  isCompactLayout?: boolean;
  onBackToModes: () => void;
}

function getNextPracticeScrollParagraphs() {
  const paragraphs = getRandomizedPracticeScrollParagraphsAfterPrevious({
    paragraphs: PRACTICE_SCROLL_PARAGRAPHS,
    previousFirstParagraph: lastPracticeScrollFirstParagraph,
  });
  lastPracticeScrollFirstParagraph = paragraphs[0];

  return paragraphs;
}

export function PracticeScrollGame({
  isCompactLayout = false,
  onBackToModes,
}: PracticeScrollGameProps) {
  const [scrollParagraphs, setScrollParagraphs] = useState(
    getNextPracticeScrollParagraphs
  );
  const [input, setInput] = useState("");
  const [errors, setErrors] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const { isLowPerformanceMode } = useLowPerformanceMode();
  const scrollConfig = useMemo(
    () =>
      getScrollConfig({
        containerHeightPx: isCompactLayout
          ? COMPACT_SCROLL_CONTAINER_HEIGHT_PX
          : SCROLL_CONTAINER_HEIGHT_PX,
        startOffsetPx: isCompactLayout
          ? COMPACT_SCROLL_START_OFFSET_PX
          : SCROLL_START_OFFSET_PX,
      }),
    [isCompactLayout]
  );
  const scrollContentY = useMotionValue(scrollConfig.startOffsetPx);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastInputRef = useRef("");
  const scrollYRef = useRef(0);

  const targetText =
    getPracticeScrollText(scrollParagraphs) ||
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
    baseSpeedPxPerSecond: PRACTICE_SCROLL_SPEED_PX_PER_SECOND,
    completedLineCount: currentCompletedLines,
    speedIncrementPxPerSecond: PRACTICE_SCROLL_SPEED_INCREMENT_PX_PER_SECOND,
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
    scrollParagraphs,
    progress.currentIndex
  );
  const averageBookPages = getAverageBookPagesForWords(completedWords);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const resetPracticeScroll = useCallback(() => {
    setScrollParagraphs(getNextPracticeScrollParagraphs());
    setInput("");
    scrollContentY.set(scrollConfig.startOffsetPx);
    setErrors(0);
    setFailed(false);
    setHasStartedTyping(false);
    setStartedAt(Date.now());
    setFinishedAt(null);
    lastFrameTimeRef.current = null;
    lastInputRef.current = "";
    scrollYRef.current = 0;
    window.setTimeout(focusInput, 0);
  }, [focusInput, scrollConfig.startOffsetPx, scrollContentY]);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  useEffect(() => {
    if (!shouldAdvanceScroll) return;

    const tick = (time: number) => {
      const previousFrameTime = lastFrameTimeRef.current ?? time;
      const elapsedSeconds = (time - previousFrameTime) / 1000;
      const nextScrollY =
        scrollYRef.current + elapsedSeconds * scrollSpeedPxPerSecond;
      scrollYRef.current = nextScrollY;
      lastFrameTimeRef.current = time;
      scrollContentY.set(scrollConfig.startOffsetPx - nextScrollY);

      if (
        hasPracticeScrollLineReachedDangerLine({
          currentIndex: progress.currentIndex,
          lines: scrollLines,
          travelPx: nextScrollY,
          config: scrollConfig,
        })
      ) {
        setFailed(true);
        setFinishedAt((value) => value ?? Date.now());
        return false;
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
    progress.currentIndex,
    scrollConfig,
    scrollLines,
    scrollContentY,
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
      className={cn(
        "flex w-full flex-col items-center",
        isCompactLayout ? "gap-4" : "gap-7"
      )}
      style={isCompactLayout ? { width: "min(92vw, 58rem)" } : undefined}
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
        restartShortcut="Borrar"
        tipTitle="Lectura del intento"
        tip={`${completedWords} palabras equivalen a ${averageBookPages} páginas promedio de libro.`}
        showTipPanel={!failed}
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
        className={cn(
          "relative w-full cursor-text overflow-hidden rounded-[1.75rem] border border-[#575279]/10 bg-[#575279]/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_24px_70px_rgba(87,82,121,0.1)] backdrop-blur-[2px] dark:border-white/10 dark:bg-[rgba(7,13,29,0.46)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_100px_rgba(0,0,0,0.26)] dark:backdrop-blur-md",
          isCompactLayout
            ? "h-[560px] max-w-none shrink-0"
            : "h-[560px] max-w-[48rem]"
        )}
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

      {!isCompactLayout && (
        <div className="flex min-h-[76px] flex-wrap justify-center gap-4 text-center">
          <Metric label="Progreso" value={`${typedPercent}%`} tone="orange" />
          <Metric
            label="Palabras"
            value={String(completedWords)}
            tone="orange"
          />
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
          <Metric
            label="Tiempo"
            value={formatTypingTime(elapsedMs)}
            tone="blue"
          />
        </div>
      )}
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
          "font-bold text-[#9f4f4f] underline decoration-[#c97878] decoration-wavy underline-offset-4 dark:text-[#f0a8a8] dark:decoration-[#d98f8f]";
        displayChar = userInput[index] === " " ? "␣" : userInput[index];
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
    <div
      className="flex min-w-[10rem] flex-col justify-center rounded-xl border border-[#575279]/10 bg-white/20 px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <Text variant="h6" className={cn(toneClass, "font-bold")}>
        {value}
      </Text>
      <Text variant="body2" className="text-gray-400">
        {label}
      </Text>
    </div>
  );
}
