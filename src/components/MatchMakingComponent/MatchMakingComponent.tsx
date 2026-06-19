"use client";

import { MatchFoundOverlay } from "./MatchFoundOverlay";
import { useMatchmakingOverlayController } from "./useMatchmakingOverlayController";

export function MatchMakingComponent() {
  const {
    hasAccepted,
    isAccepting,
    isGameFound,
    ownUser,
    onAcceptGame,
    onRejectGame,
  } = useMatchmakingOverlayController();

  if (!ownUser || !isGameFound) return null;

  return (
    <MatchFoundOverlay
      hasAccepted={hasAccepted}
      isAccepting={isAccepting}
      onAcceptGame={onAcceptGame}
      onRejectGame={onRejectGame}
    />
  );
}
