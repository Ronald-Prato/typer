import type { Transition, Variants } from "motion/react";

export const motionDurations = {
  instant: 0.08,
  fast: 0.12,
  base: 0.18,
  slow: 0.28,
} as const;

export const motionEasings = {
  easeInOut: [0.42, 0, 0.58, 1],
  standard: [0.22, 1, 0.36, 1],
  emphasized: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
} as const;

export const motionTransitions = {
  fast: {
    duration: motionDurations.fast,
    ease: motionEasings.standard,
  },
  base: {
    duration: motionDurations.base,
    ease: motionEasings.standard,
  },
  emphasized: {
    duration: motionDurations.slow,
    ease: motionEasings.emphasized,
  },
  spring: {
    type: "spring",
    stiffness: 460,
    damping: 38,
    mass: 0.8,
  },
  slowGridDrift: {
    duration: 7,
    ease: motionEasings.easeInOut,
  },
  gridDash: {
    duration: 0.28,
    ease: motionEasings.emphasized,
  },
  gridDashInertia: {
    duration: 2.08,
    ease: [motionEasings.emphasized, motionEasings.standard],
    times: [0, 0.135, 1],
  },
} satisfies Record<string, Transition>;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} satisfies Variants;

export const popIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
} satisfies Variants;

export const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
} satisfies Variants;

export const homePanelEntrance = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
} satisfies Variants;

export const modeContentSwitch = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} satisfies Variants;

export const listStagger = {
  animate: {
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.04,
    },
  },
} satisfies Variants;

export const listItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
} satisfies Variants;
