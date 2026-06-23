"use client";

import { MatchFoundOverlay } from "./MatchFoundOverlay";
import { useMatchmakingOverlayController } from "./useMatchmakingOverlayController";

export function MatchMakingComponent() {
  const {
    acceptSecondsRemaining,
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
      acceptSecondsRemaining={acceptSecondsRemaining}
      hasAccepted={hasAccepted}
      isAccepting={isAccepting}
      onAcceptGame={onAcceptGame}
      onRejectGame={onRejectGame}
    />
  );
}
