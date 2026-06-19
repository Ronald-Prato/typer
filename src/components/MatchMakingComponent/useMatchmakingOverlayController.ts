"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function useMatchmakingOverlayController() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const ownUser = useCurrentUser();
  const currentGame = useQuery(
    api.game.getGameData,
    isAuthenticated ? {} : "skip"
  );
  const exitQueue = useMutation(api.queue.exitQueue);
  const rejectGame = useMutation(api.game.rejectGame);
  const acceptGame = useMutation(api.game.acceptGame);

  const [, startTransition] = useTransition();
  const [isAccepting, setIsAccepting] = useState(false);

  const isInQueue = ownUser?.status === "in_queue";
  const isGameFound = Boolean(
    ownUser?.activeGame && ownUser.status === "game_found"
  );
  const hasAccepted = Boolean(
    currentGame?.game?.playersAccepted?.includes(ownUser?._id as never)
  );

  const handleAcceptGame = useCallback(() => {
    if (!ownUser?.activeGame || ownUser.status === "in_game") return;

    setIsAccepting(true);
    startTransition(async () => {
      try {
        await acceptGame({});
      } catch (error) {
        console.error("Error accepting game:", error);
        alert("Error al aceptar la partida");
      } finally {
        setIsAccepting(false);
      }
    });
  }, [acceptGame, ownUser?.activeGame, ownUser?.status]);

  const handleRejectGame = useCallback(() => {
    if (!ownUser?.activeGame || ownUser.status === "in_game") return;

    startTransition(async () => {
      try {
        await rejectGame();
      } catch (error) {
        console.error("Error rejecting game:", error);
        alert("Error al rechazar la partida");
      }
    });
  }, [ownUser?.activeGame, ownUser?.status, rejectGame]);

  const handleExitQueue = useCallback(() => {
    if (!isInQueue || ownUser?.status === "in_game") return;

    startTransition(async () => {
      try {
        await exitQueue();
      } catch (error) {
        console.error("Error exiting queue:", error);
      }
    });
  }, [exitQueue, isInQueue, ownUser?.status]);

  useGlobalShortcut({
    scope: "match",
    key: "Enter",
    modifier: "primary",
    enabled: isGameFound,
    onShortcut: handleAcceptGame,
  });

  useGlobalShortcut({
    scope: "match",
    key: "x",
    modifier: "primary",
    enabled: isGameFound,
    onShortcut: handleRejectGame,
  });

  useGlobalShortcut({
    scope: "home",
    key: "x",
    modifier: "primary",
    enabled: isInQueue && !isGameFound,
    onShortcut: handleExitQueue,
  });

  useEffect(() => {
    if (
      currentGame?.game?.playersAccepted &&
      currentGame.game.playersAccepted.length >= 2
    ) {
      router.push("/1v1");
    }
  }, [currentGame?.game?.playersAccepted, router]);

  return {
    hasAccepted,
    isAccepting,
    isGameFound,
    ownUser,
    onAcceptGame: handleAcceptGame,
    onRejectGame: handleRejectGame,
  };
}
