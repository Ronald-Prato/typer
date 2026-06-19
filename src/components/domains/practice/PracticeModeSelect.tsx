"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Text } from "@/components/Typography";
import { Button, KeyIndicator } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { m, motionTransitions, listItem, listStagger } from "@/motion";

export type PracticeMode = "phrases" | "scroll";

interface PracticeModeSelectProps {
  onSelectMode: (mode: PracticeMode) => void;
}

const modes = [
  {
    id: "phrases",
    title: "Frases",
    description: "Rondas clásicas con frases cortas y precisión limpia.",
    asset: "/assets/svg/practice-phrases.svg",
    shortcut: "1",
  },
  {
    id: "scroll",
    title: "Scroll",
    description: "Escribe antes de que el párrafo cruce la línea roja.",
    asset: "/assets/svg/practice-scroll.svg",
    shortcut: "2",
  },
] satisfies Array<{
  id: PracticeMode;
  title: string;
  description: string;
  asset: string;
  shortcut: string;
}>;

export function PracticeModeSelect({ onSelectMode }: PracticeModeSelectProps) {
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [isStartShortcutActive, setIsStartShortcutActive] = useState(false);
  const startShortcutTimeoutRef = useRef<number | null>(null);

  const flashStartShortcut = useCallback(() => {
    if (startShortcutTimeoutRef.current !== null) {
      window.clearTimeout(startShortcutTimeoutRef.current);
    }

    setIsStartShortcutActive(true);
    startShortcutTimeoutRef.current = window.setTimeout(() => {
      setIsStartShortcutActive(false);
      startShortcutTimeoutRef.current = null;
    }, 180);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "1") {
        event.preventDefault();
        setSelectedMode("phrases");
      }

      if (event.key === "2") {
        event.preventDefault();
        setSelectedMode("scroll");
      }

      if (event.key === "Enter" && selectedMode) {
        event.preventDefault();
        flashStartShortcut();
        window.setTimeout(() => onSelectMode(selectedMode), 90);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [flashStartShortcut, onSelectMode, selectedMode]);

  useEffect(() => {
    return () => {
      if (startShortcutTimeoutRef.current !== null) {
        window.clearTimeout(startShortcutTimeoutRef.current);
      }
    };
  }, []);

  return (
    <m.section
      variants={listStagger}
      initial="initial"
      animate="animate"
      className="flex w-full max-w-4xl flex-col items-center gap-6"
    >
      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.id;

          return (
            <m.div key={mode.id} variants={listItem}>
              <Button
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedMode(mode.id)}
                className={cn(
                  "group h-auto w-full whitespace-normal rounded-2xl border border-[#575279]/10 bg-white/25 p-0 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_18px_54px_rgba(87,82,121,0.08)] backdrop-blur transition-all duration-200 hover:border-orange-500/40 hover:bg-white/35 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_90px_rgba(0,0,0,0.22)] dark:hover:border-white/25 dark:hover:bg-white/[0.075]",
                  isSelected &&
                    "border-orange-300/70 bg-gradient-to-br from-orange-500 via-orange-500 to-red-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_24px_64px_rgba(249,115,22,0.32)] ring-2 ring-orange-300/25 hover:border-orange-200/80 hover:from-orange-500 hover:via-orange-600 hover:to-red-500 hover:bg-none dark:border-orange-300/60 dark:bg-gradient-to-br dark:from-orange-500 dark:via-orange-600 dark:to-red-500 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_26px_80px_rgba(249,115,22,0.28)] dark:ring-orange-200/20 dark:hover:border-orange-200/75 dark:hover:bg-none"
                )}
              >
                <div className="flex w-full flex-col gap-5 p-5 sm:p-6">
                  <m.div
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={motionTransitions.spring}
                    className={cn(
                      "flex h-40 w-full items-center justify-center rounded-xl border border-[#575279]/10 bg-[color-mix(in_srgb,var(--tw-home-bg)_84%,white)] text-[var(--tw-home-fg)] dark:border-white/10 dark:bg-white/[0.035] dark:text-white",
                      isSelected &&
                        "border-white/35 bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] dark:border-white/30 dark:bg-white/15"
                    )}
                  >
                    <Image
                      aria-hidden="true"
                      src={mode.asset}
                      alt=""
                      width={320}
                      height={190}
                      className="h-full max-h-[144px] w-full max-w-[280px] object-contain"
                    />
                  </m.div>
                  <div className="block w-full">
                    <div className="flex items-center justify-between gap-3">
                      <Text
                        as="p"
                        variant="h5"
                        className={cn(
                          "block font-extrabold text-[var(--tw-home-fg)] dark:text-white",
                          isSelected && "text-white dark:text-white"
                        )}
                      >
                        {mode.title}
                      </Text>
                      <KeyIndicator
                        size="sm"
                        shortcut={mode.shortcut}
                        className={cn(
                          "!h-6 !w-6 shrink-0 !border-[var(--tw-home-border)] !bg-[color-mix(in_srgb,var(--tw-home-bg)_82%,white)] text-[10px] !text-[var(--tw-home-muted)] dark:!border-white/20 dark:!bg-white/15 dark:!text-white/80",
                          isSelected &&
                            "!border-white/35 !bg-white/20 !text-white dark:!border-white/35 dark:!bg-white/20 dark:!text-white"
                        )}
                      />
                    </div>
                    <Text
                      as="p"
                      variant="body2"
                      className={cn(
                        "mt-2 block max-w-[28rem] whitespace-normal font-semibold leading-relaxed text-[var(--tw-home-muted)]",
                        isSelected && "text-white/85 dark:text-white/85"
                      )}
                    >
                      {mode.description}
                    </Text>
                  </div>
                </div>
              </Button>
            </m.div>
          );
        })}
      </div>

      <m.div variants={listItem} className="flex w-full justify-center">
        <Button
          type="button"
          disabled={!selectedMode}
          onClick={() => {
            if (selectedMode) onSelectMode(selectedMode);
          }}
          className={cn(
            "min-h-14 w-full max-w-[18rem] rounded-2xl border border-white/45 bg-white/28 px-7 py-4 text-base font-black text-[var(--tw-home-fg)] shadow-[0_18px_42px_rgba(249,115,22,0.22),inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-200 hover:border-orange-400/60 hover:bg-white/38 hover:shadow-[0_22px_54px_rgba(249,115,22,0.28),inset_0_1px_0_rgba(255,255,255,0.82)] active:scale-[0.99] disabled:border-[#575279]/15 disabled:bg-white/16 disabled:text-[var(--tw-home-muted)] disabled:shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:border-white/18 dark:bg-white/[0.09] dark:text-white dark:shadow-[0_18px_48px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.16)] dark:hover:border-orange-300/45 dark:hover:bg-white/[0.13] sm:min-h-16 sm:max-w-[20rem] sm:text-lg",
            isStartShortcutActive &&
              "border-orange-300/80 bg-orange-500/24 text-orange-500 shadow-[0_22px_58px_rgba(249,115,22,0.34),inset_0_1px_0_rgba(255,255,255,0.82),0_0_0_3px_rgba(249,115,22,0.18)] dark:border-orange-300/70 dark:bg-orange-400/20 dark:text-orange-200"
          )}
        >
          <span>Empezar</span>
          <KeyIndicator
            size="base"
            shortcut="Enter"
            className="!h-7 !w-14 !border-white/35 !bg-white/24 text-[10px] !text-[var(--tw-home-fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.54)] dark:!text-white sm:!h-8 sm:!w-16 sm:text-xs"
          />
        </Button>
      </m.div>
    </m.section>
  );
}
