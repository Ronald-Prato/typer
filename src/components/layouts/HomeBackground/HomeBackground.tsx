"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  motionTransitions,
  useAnimation,
  useReducedMotion,
} from "@/motion";
import { cn } from "@/lib/utils";
import {
  getNextHomeBackgroundGridDash,
  resetHomeBackgroundGridMomentum,
  type HomeBackgroundGridMomentum,
} from "@/domain/homeBackgroundGridMotion";
import {
  useHomeBackgroundDashRequest,
  useHomeBackgroundTheme,
} from "./HomeBackgroundDashContext";
import { useLowPerformanceMode } from "@/hooks";

type HomeBackgroundProps = {
  variant?: "home" | "practice";
};

type GridDrift = {
  x: number;
  y: number;
};

const GRID_DRIFT_MAX_PX = 72;
const GRID_DASH_INERTIA_DISTANCE_PX = 520;

const gradientByVariant = {
  home: "bg-[radial-gradient(circle_at_50%_42%,rgba(249,115,22,0.15),transparent_26%),radial-gradient(circle_at_75%_10%,rgba(37,99,235,0.12),transparent_28%),linear-gradient(120deg,var(--tw-home-bg),var(--tw-home-bg))]",
  practice:
    "bg-[radial-gradient(circle_at_50%_34%,rgba(249,115,22,0.16),transparent_24%),radial-gradient(circle_at_74%_8%,rgba(37,99,235,0.1),transparent_26%),linear-gradient(120deg,var(--tw-home-bg),var(--tw-home-bg))]",
} as const;

const gridAccentByTheme = {
  orangeGreen: {
    glow:
      "bg-[radial-gradient(ellipse_at_8%_18%,rgba(34,197,94,0.2),transparent_36%),radial-gradient(ellipse_at_88%_20%,rgba(14,165,233,0.13),transparent_38%),radial-gradient(ellipse_at_18%_82%,rgba(34,197,94,0.18),transparent_38%),radial-gradient(ellipse_at_84%_86%,rgba(249,115,22,0.16),transparent_40%),radial-gradient(ellipse_at_50%_48%,rgba(249,115,22,0.14),transparent_44%)]",
    wash:
      "bg-[radial-gradient(ellipse_at_3%_58%,rgba(34,197,94,0.13),transparent_42%),radial-gradient(ellipse_at_96%_54%,rgba(14,165,233,0.12),transparent_42%),radial-gradient(ellipse_at_47%_92%,rgba(34,197,94,0.12),transparent_44%),radial-gradient(ellipse_at_52%_8%,rgba(249,115,22,0.12),transparent_42%)]",
  },
  orangeYellow: {
    glow:
      "bg-[radial-gradient(ellipse_at_8%_18%,rgba(250,204,21,0.18),transparent_36%),radial-gradient(ellipse_at_88%_20%,rgba(14,165,233,0.12),transparent_38%),radial-gradient(ellipse_at_18%_82%,rgba(250,204,21,0.16),transparent_38%),radial-gradient(ellipse_at_84%_86%,rgba(249,115,22,0.16),transparent_40%),radial-gradient(ellipse_at_50%_48%,rgba(249,115,22,0.14),transparent_44%)]",
    wash:
      "bg-[radial-gradient(ellipse_at_3%_58%,rgba(250,204,21,0.12),transparent_42%),radial-gradient(ellipse_at_96%_54%,rgba(14,165,233,0.11),transparent_42%),radial-gradient(ellipse_at_47%_92%,rgba(250,204,21,0.11),transparent_44%),radial-gradient(ellipse_at_52%_8%,rgba(249,115,22,0.12),transparent_42%)]",
  },
} as const;

const homeBackgroundThemes = Object.entries(gridAccentByTheme) as Array<
  [keyof typeof gridAccentByTheme, (typeof gridAccentByTheme)[keyof typeof gridAccentByTheme]]
>;

const createRandomGridDrift = (): GridDrift => {
  const angle = Math.random() * Math.PI * 2;
  const distance = GRID_DRIFT_MAX_PX * (0.55 + Math.random() * 0.45);

  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
  };
};

const getGridBackgroundPosition = ({ x, y }: GridDrift) => `${x}px ${y}px`;

export function HomeBackground({ variant = "home" }: HomeBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isLowPerformanceMode } = useLowPerformanceMode();
  const controls = useAnimation();
  const dashRequest = useHomeBackgroundDashRequest();
  const theme = useHomeBackgroundTheme();
  const isDashInertiaActive = useRef(false);
  const dashSequenceId = useRef(0);
  const gridOffset = useRef<GridDrift>({ x: 0, y: 0 });
  const gridMomentum = useRef<HomeBackgroundGridMomentum>(
    resetHomeBackgroundGridMomentum(),
  );

  useEffect(() => {
    if (shouldReduceMotion || isLowPerformanceMode) {
      isDashInertiaActive.current = false;
      gridOffset.current = { x: 0, y: 0 };
      gridMomentum.current = resetHomeBackgroundGridMomentum();
      controls.set({
        backgroundPosition: getGridBackgroundPosition({ x: 0, y: 0 }),
      });
      return;
    }

    const initialDrift = createRandomGridDrift();
    gridOffset.current = initialDrift;
    controls.start(
      { backgroundPosition: getGridBackgroundPosition(initialDrift) },
      motionTransitions.slowGridDrift,
    );

    const intervalId = window.setInterval(() => {
      if (isDashInertiaActive.current) return;

      const driftTarget = createRandomGridDrift();
      gridOffset.current = driftTarget;
      gridMomentum.current = resetHomeBackgroundGridMomentum();
      controls.start(
        { backgroundPosition: getGridBackgroundPosition(driftTarget) },
        motionTransitions.slowGridDrift,
      );
    }, motionTransitions.slowGridDrift.duration * 1000);

    return () => window.clearInterval(intervalId);
  }, [controls, isLowPerformanceMode, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion || isLowPerformanceMode || !dashRequest) return;

    const sequenceId = dashSequenceId.current + 1;
    dashSequenceId.current = sequenceId;
    isDashInertiaActive.current = true;

    const nextDash = getNextHomeBackgroundGridDash({
      baseDistance: GRID_DASH_INERTIA_DISTANCE_PX,
      direction: dashRequest.direction,
      momentum: gridMomentum.current,
      offset: gridOffset.current,
      yJitter: Math.round((Math.random() - 0.5) * 70),
    });
    gridOffset.current = nextDash.offset;
    gridMomentum.current = nextDash.momentum;

    const inertiaTarget: GridDrift = nextDash.offset;
    const driftTarget = createRandomGridDrift();

    controls
      .start(
        { backgroundPosition: getGridBackgroundPosition(inertiaTarget) },
        motionTransitions.gridDashInertia,
      )
      .then(() => {
        if (dashSequenceId.current !== sequenceId) return;

        isDashInertiaActive.current = false;
        gridOffset.current = driftTarget;
        gridMomentum.current = resetHomeBackgroundGridMomentum();
        controls.start(
          { backgroundPosition: getGridBackgroundPosition(driftTarget) },
          motionTransitions.slowGridDrift,
        );
      });
  }, [controls, dashRequest, isLowPerformanceMode, shouldReduceMotion]);

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          gradientByVariant[variant],
        )}
      />
      {isLowPerformanceMode ? null : (
        <>
          {homeBackgroundThemes.map(([themeKey, accent]) => {
            const isActive = themeKey === theme;

            return (
              <motion.div
                key={themeKey}
                aria-hidden="true"
                animate={{ opacity: isActive ? 1 : 0 }}
                className="pointer-events-none absolute inset-0"
                initial={false}
                transition={motionTransitions.homeBackgroundTheme}
              >
                <div
                  className={cn(
                    "absolute -inset-28 blur-3xl opacity-70 dark:opacity-95 dark:mix-blend-screen",
                    accent.glow,
                  )}
                />
                <div
                  className={cn(
                    "absolute -inset-40 blur-[96px] opacity-55 dark:opacity-75 dark:mix-blend-screen",
                    accent.wash,
                  )}
                />
              </motion.div>
            );
          })}
        </>
      )}
      {isLowPerformanceMode ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--tw-home-grid)_1px,transparent_1px),linear-gradient(90deg,var(--tw-home-grid)_1px,transparent_1px)] bg-[size:72px_72px] opacity-45"
        />
      ) : (
        <motion.div
          aria-hidden="true"
          animate={controls}
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--tw-home-grid)_1px,transparent_1px),linear-gradient(90deg,var(--tw-home-grid)_1px,transparent_1px)] bg-[size:72px_72px] opacity-60"
          transition={motionTransitions.slowGridDrift}
        />
      )}
    </>
  );
}
