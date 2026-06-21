export type HomeBackgroundGridDirection = "left" | "right";

export type HomeBackgroundGridOffset = {
  x: number;
  y: number;
};

export type HomeBackgroundGridMomentum = {
  direction: HomeBackgroundGridDirection | null;
  streak: number;
};

type GetNextHomeBackgroundGridDashInput = {
  baseDistance: number;
  direction: HomeBackgroundGridDirection;
  momentum: HomeBackgroundGridMomentum;
  offset: HomeBackgroundGridOffset;
  yJitter: number;
};

export const HOME_BACKGROUND_GRID_ACCELERATION_STEP = 0.42;
export const HOME_BACKGROUND_GRID_MAX_ACCELERATION = 3.1;

export function getNextHomeBackgroundGridDash({
  baseDistance,
  direction,
  momentum,
  offset,
  yJitter,
}: GetNextHomeBackgroundGridDashInput) {
  const streak = momentum.direction === direction ? momentum.streak + 1 : 1;
  const acceleration = Math.min(
    HOME_BACKGROUND_GRID_MAX_ACCELERATION,
    1 + (streak - 1) * HOME_BACKGROUND_GRID_ACCELERATION_STEP,
  );
  const directionMultiplier = direction === "right" ? 1 : -1;

  return {
    momentum: {
      direction,
      streak,
    },
    offset: {
      x: Math.round(
        offset.x + directionMultiplier * baseDistance * acceleration,
      ),
      y: Math.round(offset.y + yJitter),
    },
  };
}

export function resetHomeBackgroundGridMomentum(): HomeBackgroundGridMomentum {
  return {
    direction: null,
    streak: 0,
  };
}
