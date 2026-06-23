"use client";

import type { CSSProperties } from "react";
import { Text } from "@/components/Typography";
import type { TypingMistake } from "@/domain/typingEngine";
import { cn } from "@/lib/utils";

export const PRACTICE_SCROLL_TEXT_LAYER_STYLE = {
  backfaceVisibility: "hidden",
  contain: "layout paint style",
  willChange: "transform",
} satisfies CSSProperties;

export function getPracticeScrollTextTransform(y: number) {
  return `translate3d(-50%, ${y}px, 0)`;
}

export function setPracticeScrollTextY(element: HTMLElement | null, y: number) {
  if (!element) return;

  element.style.transform = getPracticeScrollTextTransform(y);
}

type PracticeScrollLineTextProps = {
  hasStarted: boolean;
  mistake?: TypingMistake | null;
  pendingDeadKey?: string | null;
  showCursor: boolean;
  targetText: string;
  userInput: string;
};

export function PracticeScrollLineText({
  mistake,
  pendingDeadKey,
  targetText,
  userInput,
  hasStarted,
  showCursor,
}: PracticeScrollLineTextProps) {
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
        key={isActiveMistake ? `${index}-${mistake.attempt}` : index}
        className={`inline ${colorClass}`}
      >
        {displayChar}
      </span>
    );
  });
}

type PracticeScrollMetricProps = {
  label: string;
  tone: "orange" | "red" | "blue";
  value: string;
};

export function PracticeScrollMetric({
  label,
  value,
  tone,
}: PracticeScrollMetricProps) {
  const toneClass = {
    orange: "text-orange-500",
    red: "text-red-400",
    blue: "text-blue-400",
  }[tone];

  return (
    <div className="flex min-w-[10rem] flex-col justify-center rounded-xl border border-[#575279]/10 bg-white/20 px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <Text variant="h6" className={cn(toneClass, "font-bold")}>
        {value}
      </Text>
      <Text variant="body2" className="text-gray-400">
        {label}
      </Text>
    </div>
  );
}
