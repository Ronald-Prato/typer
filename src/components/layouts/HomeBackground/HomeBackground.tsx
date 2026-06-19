"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  motionTransitions,
  useAnimation,
  useReducedMotion,
} from "@/motion";
import { cn } from "@/lib/utils";
import { useHomeBackgroundDashRequest } from "./HomeBackgroundDashContext";

type HomeBackgroundProps = {
  variant?: "home" | "practice";
};

type GridDrift = {
  x: number;
  y: number;
};

const GRID_OVERSCAN_PX = 96;
const GRID_DRIFT_MAX_PX = 72;
const GRID_DASH_DISTANCE_PX = 220;
const GRID_DASH_INERTIA_DISTANCE_PX = 420;

const gradientByVariant = {
  home: "bg-[radial-gradient(circle_at_50%_42%,rgba(249,115,22,0.15),transparent_26%),radial-gradient(circle_at_75%_10%,rgba(37,99,235,0.12),transparent_28%),linear-gradient(120deg,var(--tw-home-bg),var(--tw-home-bg))]",
  practice:
    "bg-[radial-gradient(circle_at_50%_34%,rgba(249,115,22,0.16),transparent_24%),radial-gradient(circle_at_74%_8%,rgba(37,99,235,0.1),transparent_26%),linear-gradient(120deg,var(--tw-home-bg),var(--tw-home-bg))]",
} as const;

const createRandomGridDrift = (): GridDrift => {
  const angle = Math.random() * Math.PI * 2;
  const distance = GRID_DRIFT_MAX_PX * (0.55 + Math.random() * 0.45);

  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
  };
};

export function HomeBackground({ variant = "home" }: HomeBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimation();
  const dashRequest = useHomeBackgroundDashRequest();
  const isDashInertiaActive = useRef(false);
  const dashSequenceId = useRef(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      isDashInertiaActive.current = false;
      controls.set({ x: 0, y: 0 });
      return;
    }

    controls.start(createRandomGridDrift(), motionTransitions.slowGridDrift);

    const intervalId = window.setInterval(() => {
      if (isDashInertiaActive.current) return;

      controls.start(createRandomGridDrift(), motionTransitions.slowGridDrift);
    }, motionTransitions.slowGridDrift.duration * 1000);

    return () => window.clearInterval(intervalId);
  }, [controls, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion || !dashRequest) return;

    const sequenceId = dashSequenceId.current + 1;
    dashSequenceId.current = sequenceId;
    isDashInertiaActive.current = true;

    const directionMultiplier = dashRequest.direction === "right" ? 1 : -1;
    const dashTarget: GridDrift = {
      x: directionMultiplier * GRID_DASH_DISTANCE_PX,
      y: Math.round((Math.random() - 0.5) * 42),
    };
    const inertiaTarget: GridDrift = {
      x: directionMultiplier * GRID_DASH_INERTIA_DISTANCE_PX,
      y: dashTarget.y + Math.round((Math.random() - 0.5) * 28),
    };
    const driftTarget = createRandomGridDrift();

    controls
      .start(
        {
          x: [null, dashTarget.x, inertiaTarget.x],
          y: [null, dashTarget.y, inertiaTarget.y],
        },
        motionTransitions.gridDashInertia,
      )
      .then(() => {
        if (dashSequenceId.current !== sequenceId) return;

        isDashInertiaActive.current = false;
        controls.start(driftTarget, motionTransitions.slowGridDrift);
      });
  }, [controls, dashRequest, shouldReduceMotion]);

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          gradientByVariant[variant],
        )}
      />
      <motion.div
        aria-hidden="true"
        animate={controls}
        className="pointer-events-none absolute bg-[linear-gradient(var(--tw-home-grid)_1px,transparent_1px),linear-gradient(90deg,var(--tw-home-grid)_1px,transparent_1px)] bg-[size:72px_72px] opacity-60 will-change-transform"
        style={{
          inset: -GRID_OVERSCAN_PX,
        }}
        transition={motionTransitions.slowGridDrift}
      />
    </>
  );
}
