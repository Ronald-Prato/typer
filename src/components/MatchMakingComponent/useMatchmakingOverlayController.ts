"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  getAcceptedMatchRoute,
  isAcceptedMatchReadyToEnter,
} from "@/domain/matchFlow";

export function useMatchmakingOverlayController() {
  const router = useRouter();
  const pathname = usePathname();
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
    const route = getAcceptedMatchRoute(currentGame?.game?.mode);

    if (pathname === route) return;

    if (
      isAcceptedMatchReadyToEnter({
        activeGame: ownUser?.activeGame,
        status: ownUser?.status,
        players: currentGame?.game?.players,
        playersAccepted: currentGame?.game?.playersAccepted,
      })
    ) {
      router.push(route);
    }
  }, [
    currentGame?.game?.mode,
    currentGame?.game?.players,
    currentGame?.game?.playersAccepted,
    ownUser?.activeGame,
    ownUser?.status,
    pathname,
    router,
  ]);

  return {
    hasAccepted,
    isAccepting,
    isGameFound,
    ownUser,
    onAcceptGame: handleAcceptGame,
    onRejectGame: handleRejectGame,
  };
}
