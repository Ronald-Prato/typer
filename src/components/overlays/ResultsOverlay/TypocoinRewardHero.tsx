"use client";

import { useEffect, useState } from "react";

import { TypocoinToken } from "@/components/Currency";
import { formatTypocoinAmount, formatTypocoinLabel } from "@/domain/currency";
import { motion, motionTransitions, useReducedMotion } from "@/motion";

const TYPOCOIN_REWARD_APPEAR_DELAY_MS = 300;
const TYPOCOIN_REWARD_APPEAR_DURATION_MS = 180;
const TYPOCOIN_REWARD_APPEAR_DELAY_SECONDS =
  TYPOCOIN_REWARD_APPEAR_DELAY_MS / 1000;
const TYPOCOIN_REWARD_ROLL_START_DELAY_MS =
  TYPOCOIN_REWARD_APPEAR_DELAY_MS + TYPOCOIN_REWARD_APPEAR_DURATION_MS;
const TYPOCOIN_REWARD_ROLL_STEP_MS = 45;
const TYPOCOIN_REWARD_ROLL_MAX_STEPS = 10;

interface TypocoinRewardHeroProps {
  amount: number;
}

export function TypocoinRewardHero({ amount }: TypocoinRewardHeroProps) {
  const shouldReduceRewardMotion = useReducedMotion();
  const rewardLabel = formatTypocoinLabel(amount, { signed: true });
  const rewardValue = formatTypocoinAmount(amount, { signed: true });

  return (
    <motion.div
      aria-label={rewardLabel}
      initial={
        shouldReduceRewardMotion
          ? false
          : { opacity: 0, y: 10, scale: 0.96 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        shouldReduceRewardMotion
          ? motionTransitions.fast
          : {
              ...motionTransitions.emphasized,
              delay: TYPOCOIN_REWARD_APPEAR_DELAY_SECONDS,
            }
      }
      className="relative mt-4 flex w-full items-center justify-center"
      role="status"
    >
      <motion.div
        aria-hidden="true"
        initial={shouldReduceRewardMotion ? false : { y: 8, rotate: -3 }}
        animate={shouldReduceRewardMotion ? undefined : { y: 0, rotate: 0 }}
        transition={motionTransitions.spring}
        className="relative z-10 mr-2"
      >
        <TypocoinToken
          size={46}
          className="drop-shadow-[0_9px_16px_rgba(8,145,178,0.24)]"
        />
      </motion.div>
      <div className="relative z-10 flex items-center">
        <AnimatedTypocoinRewardAmount
          amount={amount}
          fallbackValue={rewardValue}
          startDelayMs={TYPOCOIN_REWARD_ROLL_START_DELAY_MS}
        />
      </div>
    </motion.div>
  );
}

function AnimatedTypocoinRewardAmount({
  amount,
  fallbackValue,
  startDelayMs,
}: {
  amount: number;
  fallbackValue: string;
  startDelayMs: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [displayAmount, setDisplayAmount] = useState(
    shouldReduceMotion ? amount : 0
  );
  const displayValue =
    displayAmount === 0
      ? "+0"
      : formatTypocoinAmount(displayAmount, { signed: true });

  useEffect(() => {
    if (shouldReduceMotion || amount <= 0) {
      setDisplayAmount(amount);
      return;
    }

    setDisplayAmount(0);

    const increment = Math.max(
      1,
      Math.ceil(amount / TYPOCOIN_REWARD_ROLL_MAX_STEPS)
    );
    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setDisplayAmount((currentAmount) => {
          const nextAmount = Math.min(amount, currentAmount + increment);

          if (nextAmount >= amount && intervalId !== undefined) {
            window.clearInterval(intervalId);
          }

          return nextAmount;
        });
      }, TYPOCOIN_REWARD_ROLL_STEP_MS);
    }, startDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [amount, shouldReduceMotion, startDelayMs]);

  return (
    <span className="relative inline-flex min-w-[3ch] justify-center overflow-hidden text-4xl font-black leading-none tabular-nums tracking-normal sm:text-5xl">
      <motion.span
        key={displayValue}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -22 }}
        transition={motionTransitions.fast}
        className="inline-block bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_12px_18px_rgba(8,145,178,0.2)]"
      >
        {displayAmount === amount ? fallbackValue : displayValue}
      </motion.span>
    </span>
  );
}
