"use client";

import type { TypingMistake } from "@/domain/typingEngine";
import { Text } from "../Typography";
import { useLowPerformanceMode } from "@/hooks";

interface TypingTextProps {
  targetText: string;
  userInput: string;
  mistake?: TypingMistake | null;
  pendingDeadKey?: string | null;
  variant: "h4" | "h5" | "h6";
}

export function TypingText({
  targetText,
  userInput,
  mistake,
  pendingDeadKey,
  variant,
}: TypingTextProps) {
  const hasStartedTyping = userInput.length > 0;
  const { isLowPerformanceMode } = useLowPerformanceMode();

  return targetText.split("").map((char, index) => {
    let colorClass = "";
    let displayChar = char;
    const isActiveMistake = mistake?.index === index;
    const isPendingDeadKey = pendingDeadKey && index === userInput.length;
    let interactionClass = isLowPerformanceMode
      ? ""
      : "transition-all duration-200 hover:scale-105";

    if (index < userInput.length) {
      interactionClass = "";
      if (userInput[index] === char) {
        colorClass =
          "font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg shadow-orange-500/50";
      } else {
        colorClass =
          "font-bold text-[#9f4f4f] underline decoration-[#c97878] decoration-wavy underline-offset-4 dark:text-[#f0a8a8] dark:decoration-[#d98f8f]";
        displayChar = userInput[index];
        if (displayChar === " ") {
          displayChar = "␣";
        }
      }
    } else if (isPendingDeadKey) {
      interactionClass = "";
      colorClass =
        "font-bold text-orange-400 bg-orange-500/10 ring-1 ring-orange-400/30 rounded-sm px-0.5";
      displayChar = pendingDeadKey;
    } else if (isActiveMistake) {
      interactionClass = isLowPerformanceMode ? "" : "motion-safe:animate-pulse";
      colorClass =
        "font-bold text-[#9f4f4f] underline decoration-[#c97878] decoration-wavy underline-offset-4 dark:text-[#f0a8a8] dark:decoration-[#d98f8f]";
      displayChar = mistake.char === " " ? "␣" : mistake.char;
    } else if (index === userInput.length) {
      colorClass = hasStartedTyping
        ? "text-gray-300 bg-gray-600/90 drop-shadow-lg shadow-gray-400/60 backdrop-blur-sm"
        : isLowPerformanceMode
          ? "text-gray-300 bg-gray-600/70 drop-shadow-lg shadow-gray-400/60 backdrop-blur-sm"
          : "text-gray-300 bg-gray-600/70 animate-pulse drop-shadow-lg shadow-gray-400/60 backdrop-blur-sm";
      if (hasStartedTyping) {
        interactionClass = "";
      }
    } else {
      colorClass = "text-gray-500 drop-shadow-sm shadow-gray-600/20";
    }

    return (
      <Text
        key={isActiveMistake ? `${index}-${mistake.attempt}` : index}
        variant={variant}
        className={`inline font-mono ${interactionClass} ${colorClass}`}
      >
        {displayChar}
      </Text>
    );
  });
}
