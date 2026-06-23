"use client";

import { UserAvatarImage } from "@/components/Avatar";
import {
  AnimatePresence,
  m,
  motionTransitions,
} from "@/motion";

export type MatchIntroPlayer = {
  avatarSeed?: string | null;
  avatarUrl?: string | null;
  highestPracticeWpm?: number | null;
  nickname?: string | null;
};

export type MatchIntroPhase = "versus" | "countdown" | "playing";

function formatIntroWpm(wpm?: number | null) {
  return `${Math.max(0, Math.round(wpm ?? 0))}`;
}

export function MatchIntroOverlay({
  countdownValue,
  isVisible,
  opponent,
  ownUser,
  phase,
  shouldReduceMotion,
}: {
  countdownValue: number | null;
  isVisible: boolean;
  opponent: MatchIntroPlayer | null | undefined;
  ownUser: MatchIntroPlayer | null | undefined;
  phase: MatchIntroPhase;
  shouldReduceMotion: boolean;
}) {
  const backdropClassName = [
    "pointer-events-none fixed inset-0",
    "bg-[#030712]/14 backdrop-blur-[8px]",
    phase === "versus" ? "sm:bg-[#030712]/18" : "sm:bg-[#030712]/12",
  ].join(" ");

  return (
    <AnimatePresence mode="sync">
      {isVisible && (
        <m.div
          key={phase}
          animate={{ opacity: 1, scale: 1 }}
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-transparent px-5 text-[var(--tw-home-fg)]"
          exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 1.02 }}
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98 }}
          transition={motionTransitions.emphasized}
        >
          <div className={backdropClassName} />

          {phase === "versus" ? (
            <div className="relative z-10 grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-10">
              <IntroPlayerCard
                player={ownUser}
                shouldReduceMotion={shouldReduceMotion}
                side="left"
              />
              <m.div
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: shouldReduceMotion ? 0 : -2,
                }}
                className="min-w-16 text-center font-mono text-4xl font-black text-orange-400 drop-shadow-[0_0_22px_rgba(249,115,22,0.85)] sm:text-6xl"
                initial={{
                  opacity: 0,
                  scale: shouldReduceMotion ? 1 : 0.7,
                  rotate: 0,
                }}
                transition={{
                  ...motionTransitions.emphasized,
                  delay: shouldReduceMotion ? 0 : 0.5,
                }}
              >
                VS
              </m.div>
              <IntroPlayerCard
                player={opponent}
                shouldReduceMotion={shouldReduceMotion}
                side="right"
              />
            </div>
          ) : (
            <m.div
              key={countdownValue ?? "go"}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative z-10 font-mono text-[clamp(3.75rem,10vw,7rem)] font-black leading-none text-orange-400 drop-shadow-[0_0_24px_rgba(249,115,22,0.82)]"
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.88 }}
              initial={{
                opacity: 0,
                scale: shouldReduceMotion ? 1 : 1.18,
                y: shouldReduceMotion ? 0 : -8,
              }}
              transition={motionTransitions.fast}
            >
              {countdownValue ?? 1}
            </m.div>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}

function IntroPlayerCard({
  player,
  shouldReduceMotion,
  side,
}: {
  player: MatchIntroPlayer | null | undefined;
  shouldReduceMotion: boolean;
  side: "left" | "right";
}) {
  const direction = side === "left" ? -56 : 56;

  return (
    <m.div
      animate={{ opacity: 1, x: 0 }}
      className="min-w-0 text-center"
      initial={{ opacity: 0, x: shouldReduceMotion ? 0 : direction }}
      transition={motionTransitions.emphasized}
    >
      <p className="mb-3 truncate text-base font-black text-[var(--tw-home-fg)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] sm:text-xl">
        {player?.nickname || "Rival"}
      </p>
      <UserAvatarImage
        avatarSeed={player?.avatarSeed}
        avatarUrl={player?.avatarUrl}
        className="mx-auto size-20 border-orange-400/65 sm:size-28"
        initialsClassName="text-2xl"
        nickname={player?.nickname}
      />
      <p className="mt-2 font-mono text-sm font-bold uppercase tracking-[0.18em] text-orange-300/90 sm:text-base">
        {formatIntroWpm(player?.highestPracticeWpm)} WPM
      </p>
    </m.div>
  );
}
