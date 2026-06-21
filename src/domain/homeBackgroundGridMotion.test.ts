import { describe, expect, it } from "vitest";
import {
  getNextHomeBackgroundGridDash,
  resetHomeBackgroundGridMomentum,
} from "./homeBackgroundGridMotion";

describe("homeBackgroundGridMotion", () => {
  it("accelerates repeated dash requests in the same direction", () => {
    const first = getNextHomeBackgroundGridDash({
      baseDistance: 100,
      direction: "right",
      momentum: resetHomeBackgroundGridMomentum(),
      offset: { x: 0, y: 0 },
      yJitter: 0,
    });
    const second = getNextHomeBackgroundGridDash({
      baseDistance: 100,
      direction: "right",
      momentum: first.momentum,
      offset: first.offset,
      yJitter: 0,
    });
    const third = getNextHomeBackgroundGridDash({
      baseDistance: 100,
      direction: "right",
      momentum: second.momentum,
      offset: second.offset,
      yJitter: 0,
    });

    expect(second.offset.x - first.offset.x).toBeGreaterThan(
      first.offset.x,
    );
    expect(third.offset.x - second.offset.x).toBeGreaterThan(
      second.offset.x - first.offset.x,
    );
  });

  it("resets acceleration when the direction changes", () => {
    const first = getNextHomeBackgroundGridDash({
      baseDistance: 100,
      direction: "right",
      momentum: resetHomeBackgroundGridMomentum(),
      offset: { x: 0, y: 0 },
      yJitter: 0,
    });
    const second = getNextHomeBackgroundGridDash({
      baseDistance: 100,
      direction: "right",
      momentum: first.momentum,
      offset: first.offset,
      yJitter: 0,
    });
    const reversed = getNextHomeBackgroundGridDash({
      baseDistance: 100,
      direction: "left",
      momentum: second.momentum,
      offset: second.offset,
      yJitter: 0,
    });

    expect(reversed.momentum).toEqual({ direction: "left", streak: 1 });
    expect(second.offset.x - reversed.offset.x).toBe(100);
  });

  it("clears momentum when dash inertia is allowed to finish", () => {
    expect(resetHomeBackgroundGridMomentum()).toEqual({
      direction: null,
      streak: 0,
    });
  });
});
