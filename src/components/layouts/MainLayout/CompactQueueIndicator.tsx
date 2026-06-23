"use client";

import { AnimatePresence, fadeIn, m, motionTransitions } from "@/motion";

type CompactQueueIndicatorProps = {
  exitQueueShortcut: string;
  isVisible: boolean;
  queueSeconds: number;
  queuedModeTitle: string;
};

function formatQueueTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

export function CompactQueueIndicator({
  exitQueueShortcut,
  isVisible,
  queueSeconds,
  queuedModeTitle,
}: CompactQueueIndicatorProps) {
  return (
    <AnimatePresence initial={false}>
      {isVisible ? (
        <m.div
          animate="animate"
          aria-label={`Sigues en cola en modo ${queuedModeTitle}`}
          className="flex items-center gap-3 rounded-full border border-emerald-300/45 bg-gradient-to-r from-emerald-400/22 to-blue-500/18 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-emerald-700 shadow-[0_0_28px_rgba(16,185,129,0.2),0_0_26px_rgba(59,130,246,0.12)] backdrop-blur-xl dark:text-emerald-100"
          exit="exit"
          initial="initial"
          role="status"
          transition={motionTransitions.base}
          variants={fadeIn}
        >
          <span
            className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]"
            aria-hidden="true"
          />
          <span>En cola</span>
          <span className="rounded-md border border-emerald-300/30 bg-white/25 px-1.5 py-0.5 text-[0.65rem] font-black leading-none text-emerald-800 dark:border-white/10 dark:bg-white/10 dark:text-emerald-100">
            {queuedModeTitle}
          </span>
          <span className="font-black text-blue-700 tabular-nums dark:text-blue-100">
            {formatQueueTime(queueSeconds)}
          </span>
          <span className="rounded-md border border-emerald-300/40 bg-white/35 px-1.5 py-0.5 text-[0.65rem] font-black leading-none text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] dark:border-white/15 dark:bg-white/10 dark:text-emerald-100">
            {exitQueueShortcut}
          </span>
          <span className="sr-only">para salir de la cola</span>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
