import { describe, expect, it } from "vitest";
import {
  fadeIn,
  homePanelEntrance,
  listItem,
  listStagger,
  modeContentSwitch,
  motionDurations,
  motionEasings,
  motionTransitions,
  popIn,
  slideUp,
} from "./presets";

describe("motion presets", () => {
  it("keeps shared durations short enough for interface feedback", () => {
    expect(motionDurations.fast).toBeLessThan(motionDurations.base);
    expect(motionDurations.base).toBeLessThan(motionDurations.slow);
    expect(motionDurations.slow).toBeLessThanOrEqual(0.4);
  });

  it("uses transform and opacity based variants by default", () => {
    expect(fadeIn.initial).toEqual({ opacity: 0 });
    expect(popIn.initial).toMatchObject({ opacity: 0, scale: 0.96 });
    expect(slideUp.initial).toMatchObject({ opacity: 0, y: 12 });
    expect(homePanelEntrance.initial).toMatchObject({ opacity: 0, y: 20 });
    expect(modeContentSwitch.initial).toMatchObject({ opacity: 0, y: 10 });
    expect(modeContentSwitch.exit).toMatchObject({ opacity: 0, y: -8 });
    expect(listItem.initial).toMatchObject({ opacity: 0, y: 8 });
  });

  it("exposes an ease-in-out curve for short home transitions", () => {
    expect(motionEasings.easeInOut).toEqual([0.42, 0, 0.58, 1]);
  });

  it("keeps list stagger subtle", () => {
    expect(listStagger.animate?.transition).toMatchObject({
      staggerChildren: 0.035,
      delayChildren: 0.04,
    });
  });

  it("exposes a spring preset for small interactive elements", () => {
    expect(motionTransitions.spring).toMatchObject({
      type: "spring",
      stiffness: 460,
      damping: 38,
    });
  });

  it("keeps the background grid drift slow and eased", () => {
    expect(motionTransitions.slowGridDrift).toMatchObject({
      duration: 7,
      ease: motionEasings.easeInOut,
    });
  });

  it("exposes a quick emphasized dash for home mode switches", () => {
    expect(motionTransitions.gridDash).toMatchObject({
      duration: 0.28,
      ease: motionEasings.emphasized,
    });
  });

  it("exposes a longer deceleration for grid dash inertia", () => {
    expect(motionTransitions.gridDashInertia).toMatchObject({
      duration: 3.6,
      ease: motionEasings.gridDashTakeoff,
    });
  });
});
