"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import { UserAvatarImage } from "@/components/Avatar";
import {
  getCompetitiveScrollTravelPx,
  getPracticeScrollWordLines,
  getScrollMinimapWordBlocks,
} from "@/domain/practiceScroll";
import type { TypingMistake } from "@/domain/typingEngine";

const OPPONENT_MINIMAP_SCROLL_SCALE = 0.22;
const OPPONENT_MINIMAP_DANGER_TOP_PX = 32;

export const SCROLL_TEXT_LAYER_STYLE = {
  backfaceVisibility: "hidden",
  contain: "layout paint style",
  willChange: "transform",
} satisfies CSSProperties;

export function getScrollTextTransform(y: number) {
  return `translate3d(-50%, ${y}px, 0)`;
}

export function setScrollTextY(element: HTMLElement | null, y: number) {
  if (!element) return;

  element.style.transform = getScrollTextTransform(y);
}

type OpponentScrollMinimapProps = {
  baseSpeedPxPerSecond: number;
  completedLineCount: number;
  currentIndex: number;
  dangerLinePx: number;
  finishedAt?: number;
  hasWinner: boolean;
  opponent?: {
    avatarSeed?: string;
    avatarUrl?: string;
    nickname?: string;
  } | null;
  speedIncrementPxPerSecond: number;
  startOffsetPx: number;
  startedAt?: number;
  text: string;
};

export function OpponentScrollMinimap({
  baseSpeedPxPerSecond,
  completedLineCount,
  currentIndex,
  dangerLinePx,
  finishedAt,
  hasWinner,
  opponent,
  speedIncrementPxPerSecond,
  startOffsetPx,
  startedAt,
  text,
}: OpponentScrollMinimapProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
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
  const getContentY = useCallback(
    (now = Date.now()) => {
      const scrollY = getCompetitiveScrollTravelPx({
        baseSpeedPxPerSecond,
        completedLineCount,
        finishedAt,
        now,
        speedIncrementPxPerSecond,
        startedAt,
      });
      const startLeadPx =
        (startOffsetPx - dangerLinePx) * OPPONENT_MINIMAP_SCROLL_SCALE;

      return (
        OPPONENT_MINIMAP_DANGER_TOP_PX +
        startLeadPx -
        scrollY * OPPONENT_MINIMAP_SCROLL_SCALE
      );
    },
    [
      baseSpeedPxPerSecond,
      completedLineCount,
      dangerLinePx,
      finishedAt,
      speedIncrementPxPerSecond,
      startOffsetPx,
      startedAt,
    ]
  );

  useEffect(() => {
    setScrollTextY(contentRef.current, getContentY());

    if (!startedAt || finishedAt || hasWinner) return;

    let frameId = 0;
    const animate = () => {
      setScrollTextY(contentRef.current, getContentY());
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [finishedAt, getContentY, hasWinner, startedAt]);

  return (
    <aside className="pointer-events-none absolute right-10 top-32 z-20 w-72 lg:left-[calc(50%+29rem)] lg:right-auto">
      <div className="mb-4 flex flex-col items-center gap-2 text-center">
        <UserAvatarImage
          avatarSeed={opponent?.avatarSeed}
          avatarUrl={opponent?.avatarUrl}
          className="size-8"
          initialsClassName="text-xs"
          nickname={opponent?.nickname}
        />
        <div className="min-w-0 max-w-full">
          <p className="truncate text-sm font-black text-[var(--tw-home-fg)]">
            {opponent?.nickname || "Oponente"}
          </p>
        </div>
      </div>
      <div className="relative h-[136px] overflow-hidden">
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
        <div
          ref={contentRef}
          className="absolute left-1/2 top-0 w-[22ch] space-y-2 drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]"
          style={{
            ...SCROLL_TEXT_LAYER_STYLE,
            transform: getScrollTextTransform(getContentY()),
          }}
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
        </div>
      </div>
    </aside>
  );
}

type ScrollLineTextProps = {
  hasStarted: boolean;
  mistake?: TypingMistake | null;
  pendingDeadKey?: string | null;
  showCursor: boolean;
  targetText: string;
  userInput: string;
};

export function ScrollLineText({
  targetText,
  userInput,
  mistake,
  pendingDeadKey,
  hasStarted,
  showCursor,
}: ScrollLineTextProps) {
  return targetText.split("").map((char, index) => {
    let colorClass = "";
    let displayChar = char;
    const isCursor = showCursor && index === userInput.length;
    const isActiveMistake = mistake?.index === index;
    const isPendingDeadKey = pendingDeadKey && isCursor;

    if (index < userInput.length) {
      if (userInput[index] === char) {
        colorClass = "font-bold text-orange-500";
      } else {
        colorClass =
          "font-bold text-[#9f4f4f] underline decoration-[#c97878] decoration-wavy underline-offset-4 dark:text-[#f0a8a8] dark:decoration-[#d98f8f]";
        displayChar = userInput[index] === " " ? "␣" : userInput[index];
      }
    } else if (isPendingDeadKey) {
      colorClass =
        "font-bold text-orange-400 bg-orange-500/10 ring-1 ring-orange-400/30 rounded-sm px-0.5";
      displayChar = pendingDeadKey;
    } else if (isActiveMistake) {
      colorClass =
        "font-bold text-[#9f4f4f] underline decoration-[#c97878] decoration-wavy underline-offset-4 motion-safe:animate-pulse dark:text-[#f0a8a8] dark:decoration-[#d98f8f]";
      displayChar = mistake.char === " " ? "␣" : mistake.char;
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
      <span
        key={isActiveMistake ? `${index}-${mistake.attempt}` : index}
        className={`inline ${colorClass}`}
      >
        {displayChar}
      </span>
    );
  });
}
