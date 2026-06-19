"use client";

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  countCompletedMatchSteps,
  didCurrentUserWin,
} from "@/domain/matchProgress";
import { MatchProgressView } from "./MatchProgressView";

const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
};

export const MatchProgress = () => {
  const viewport = useWindowSize();
  const gameData = useQuery(api.game.getGameData);
  const currentUser = useCurrentUser();

  if (!gameData || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[100px]">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { game, opponent } = gameData;
  const currentUserProgress = game?.progress?.[currentUser._id] ?? {};
  const opponentProgress = opponent?._id ? (game?.progress?.[opponent._id] ?? {}) : {};

  return (
    <MatchProgressView
      currentUser={currentUser}
      currentUserSteps={countCompletedMatchSteps(currentUserProgress)}
      isGameFinished={Boolean(game?.winner)}
      isWinner={didCurrentUserWin({
        winner: game?.winner,
        currentUserId: currentUser._id,
      })}
      opponent={opponent}
      opponentSteps={countCompletedMatchSteps(opponentProgress)}
      viewport={viewport}
    />
  );
};
