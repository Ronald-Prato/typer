"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "@/motion";
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  BoltIcon,
  CheckBadgeIcon,
  ClockIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Text } from "@/components/Typography";
import { KeyIndicator } from "@/components/ui/button";
import {
  formatPracticeTime,
  summarizePracticeResults,
} from "@/domain/practiceResults";

interface RoundData {
  phrase: string;
  errors: number;
  timeMs: number;
  accuracy: number;
  wpm: number;
}

interface ResultsOverlayProps {
  isVisible: boolean;
  roundsData: RoundData[];
  onClose: () => void;
  onRestart?: () => void;
  title?: string;
  description?: string;
  heroValue?: string;
  heroSuffix?: string;
  heroLabel?: string;
  heroIcon?: ReactNode;
  stats?: Array<{
    icon: ReactNode;
    label: string;
    value: string;
    tone: "blue" | "violet" | "rose" | "emerald";
  }>;
  tipTitle?: string;
  tip?: string;
  levelLabel?: string;
  levelProgress?: number;
  restartLabel?: string;
  restartShortcut?: string;
}

const CONFETTI_PIECES = [
  { left: "12%", x: -72, rotate: -28, color: "bg-orange-500", delay: 0 },
  { left: "22%", x: -42, rotate: 18, color: "bg-blue-400", delay: 0.04 },
  { left: "34%", x: -20, rotate: 44, color: "bg-emerald-400", delay: 0.08 },
  { left: "48%", x: 14, rotate: -36, color: "bg-rose-400", delay: 0.02 },
  { left: "61%", x: 26, rotate: 24, color: "bg-violet-400", delay: 0.1 },
  { left: "73%", x: 48, rotate: -18, color: "bg-yellow-400", delay: 0.06 },
  { left: "86%", x: 76, rotate: 32, color: "bg-orange-400", delay: 0.12 },
];

export function ResultsOverlay({
  isVisible,
  roundsData,
  onClose,
  onRestart,
  title,
  description,
  heroValue,
  heroSuffix,
  heroLabel,
  heroIcon,
  stats,
  tipTitle = "Tip de práctica",
  tip,
  levelLabel,
  levelProgress,
  restartLabel = "Reintentar",
  restartShortcut,
}: ResultsOverlayProps) {
  const summary = summarizePracticeResults(roundsData);
  const resultStats =
    stats ??
    [
      {
        icon: <ClockIcon className="size-5" />,
        label: "Tiempo promedio",
        value: formatPracticeTime(summary.averageTimeMs),
        tone: "blue" as const,
      },
      {
        icon: <SparklesIcon className="size-5" />,
        label: "Precisión",
        value: `${summary.roundedAccuracy}%`,
        tone: "violet" as const,
      },
      {
        icon: <XMarkIcon className="size-5" />,
        label: "Errores",
        value: summary.roundedErrors.toString(),
        tone: "rose" as const,
      },
    ];
  const resolvedHeroValue = heroValue ?? summary.roundedWpm.toString();
  const resolvedHeroSuffix = heroSuffix ?? "WPM";
  const resolvedHeroLabel = heroLabel ?? "Velocidad promedio";
  const resolvedTip = tip ?? summary.tip;
  const resolvedLevelLabel = levelLabel ?? summary.levelLabel;
  const resolvedLevelProgress = levelProgress ?? summary.levelProgress;

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        onClose();
        return;
      }

      if (
        onRestart &&
        restartShortcut?.toLowerCase() === "space" &&
        event.code === "Space" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        onRestart();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isVisible, onClose, onRestart, restartShortcut]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#575279]/18 px-4 py-8 backdrop-blur-sm dark:bg-gray-950/72"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 28 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[39rem] overflow-hidden rounded-[1.75rem] border border-[var(--tw-home-border)] bg-[color-mix(in_srgb,var(--tw-home-panel-strong)_94%,white)] p-6 text-[var(--tw-home-fg)] shadow-[0_28px_90px_rgba(87,82,121,0.22),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl dark:bg-[rgba(7,13,29,0.94)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.46),inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-8"
          >
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden"
            >
              {CONFETTI_PIECES.map((piece, index) => (
                <motion.span
                  key={`${piece.left}-${index}`}
                  initial={{ y: -20, x: 0, opacity: 0, rotate: 0 }}
                  animate={{
                    y: 118,
                    x: piece.x,
                    opacity: [0, 1, 1, 0],
                    rotate: piece.rotate,
                  }}
                  transition={{
                    delay: piece.delay,
                    duration: 1.05,
                    ease: "easeOut",
                  }}
                  className={`absolute top-0 h-3 w-1.5 rounded-full ${piece.color}`}
                  style={{ left: piece.left }}
                />
              ))}
            </motion.div>

            <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-orange-400/16 blur-3xl dark:bg-orange-500/12" />

            <button
              onClick={onClose}
              className="absolute right-5 top-5 z-10 flex size-9 items-center justify-center rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-[var(--tw-home-muted)] transition-colors hover:border-orange-500/40 hover:text-orange-500"
              type="button"
              aria-label="Cerrar resultados"
            >
              <XMarkIcon className="size-4" />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.24 }}
                className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-500 shadow-[0_12px_28px_rgba(249,115,22,0.16)]"
              >
                <CheckBadgeIcon className="size-7" />
              </motion.div>

              <Text
                variant="h5"
                className="font-black text-[var(--tw-home-fg)]"
              >
                {title ?? "Práctica completada"}
              </Text>
              <Text
                variant="body2"
                className="mt-2 text-[var(--tw-home-muted)]"
              >
                {description ?? "Buen ritmo. Estos son tus resultados."}
              </Text>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.18, duration: 0.28 }}
                className="my-7 flex flex-col items-center"
              >
                <span className="mb-1 text-emerald-500">
                  {heroIcon ?? <BoltIcon className="size-8" />}
                </span>
                <div className="flex items-end gap-2">
                  <span className="text-7xl font-black leading-none text-emerald-500">
                    {resolvedHeroValue}
                  </span>
                  <span className="pb-2 text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {resolvedHeroSuffix}
                  </span>
                </div>
                <Text
                  variant="caption"
                  className="mt-2 font-bold uppercase text-[var(--tw-home-muted)]"
                >
                  {resolvedHeroLabel}
                </Text>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.26 }}
              className="relative z-10 grid gap-3 sm:grid-cols-3"
            >
              {resultStats.map((stat) => (
                <ResultStat
                  key={`${stat.label}-${stat.value}`}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  tone={stat.tone}
                />
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.26 }}
              className="relative z-10 mt-4 rounded-2xl border border-orange-500/18 bg-orange-500/[0.06] p-4 dark:bg-orange-500/[0.08]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 text-left">
                  <Text
                    as="p"
                    variant="body2"
                    className="font-bold text-[var(--tw-home-fg)]"
                  >
                    {tipTitle}
                  </Text>
                  <Text
                    as="p"
                    variant="body2"
                    className="mt-1 text-[var(--tw-home-muted)]"
                  >
                    {resolvedTip}
                  </Text>
                </div>
                <div className="w-full shrink-0 sm:w-40">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-[var(--tw-home-muted)]">
                    <span>Nivel actual</span>
                    <span>{resolvedLevelLabel}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--tw-home-border)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${resolvedLevelProgress}%` }}
                      transition={{ delay: 0.5, duration: 0.48 }}
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.44, duration: 0.26 }}
              className="relative z-10 mt-6 flex flex-col-reverse gap-3 sm:flex-row"
            >
              {onRestart && (
                <button
                  onClick={onRestart}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] px-5 font-black text-[var(--tw-home-fg)] transition-colors hover:border-orange-500/40 hover:text-orange-500"
                  type="button"
                >
                  <ArrowPathIcon className="size-5" />
                  <span>{restartLabel}</span>
                  {restartShortcut && (
                    <KeyIndicator
                      shortcut={restartShortcut}
                      size="sm"
                      className="ml-1 !border-[var(--tw-home-border)] !bg-[color-mix(in_srgb,var(--tw-home-bg)_88%,white)] !text-[var(--tw-home-muted)] dark:!border-white/20 dark:!bg-white/10 dark:!text-white/80"
                    />
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="inline-flex h-12 flex-[1.35] items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 font-black text-white shadow-[0_14px_34px_rgba(249,115,22,0.28)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
                type="button"
              >
                Volver
                <span className="flex size-7 items-center justify-center rounded-lg border border-white/25 bg-white/18">
                  <ArrowUturnLeftIcon className="size-4" />
                </span>
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ResultStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "blue" | "violet" | "rose" | "emerald";
}) {
  const toneClass = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    violet: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  }[tone];

  return (
    <div className="rounded-2xl border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.26)]">
      <div className="flex items-center gap-2">
        <span
          className={`flex size-8 items-center justify-center rounded-lg border ${toneClass}`}
        >
          {icon}
        </span>
        <Text variant="caption" className="font-bold text-[var(--tw-home-muted)]">
          {label}
        </Text>
      </div>
      <Text variant="h5" className="mt-3 font-black text-[var(--tw-home-fg)]">
        {value}
      </Text>
    </div>
  );
}
