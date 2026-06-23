"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMatchFoundAudioNotification } from "@/hooks";
import {
  getAcceptedMatchRoute,
  getMatchAcceptCountdownSeconds,
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
  const [acceptCountdownNow, setAcceptCountdownNow] = useState(() => Date.now());
  const [expiredMatchId, setExpiredMatchId] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const isInQueue = ownUser?.status === "in_queue";
  const isGameFound = Boolean(
    ownUser?.activeGame && ownUser.status === "game_found"
  );
  const hasAccepted = Boolean(
    currentGame?.game?.playersAccepted?.includes(ownUser?._id as never)
  );
  const acceptDeadlineAt = currentGame?.game?.acceptDeadlineAt ?? null;
  const acceptSecondsRemaining = hasAccepted
    ? null
    : getMatchAcceptCountdownSeconds({
        acceptDeadlineAt,
        now: acceptCountdownNow,
      });
  const isAcceptWindowExpired = acceptSecondsRemaining === 0;

  useMatchFoundAudioNotification({
    activeGameId: ownUser?.activeGame ?? null,
    isGameFound,
  });

  const handleAcceptGame = useCallback(() => {
    if (
      !ownUser?.activeGame ||
      ownUser.status === "in_game" ||
      isAcceptWindowExpired
    ) {
      return;
    }

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
  }, [
    acceptGame,
    isAcceptWindowExpired,
    ownUser?.activeGame,
    ownUser?.status,
    startTransition,
  ]);

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
  }, [ownUser?.activeGame, ownUser?.status, rejectGame, startTransition]);

  const handleExitQueue = useCallback(() => {
    if (!isInQueue || ownUser?.status === "in_game") return;

    startTransition(async () => {
      try {
        await exitQueue();
      } catch (error) {
        console.error("Error exiting queue:", error);
      }
    });
  }, [exitQueue, isInQueue, ownUser?.status, startTransition]);

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
    setExpiredMatchId(null);
  }, [ownUser?.activeGame]);

  useEffect(() => {
    if (!isGameFound || hasAccepted || acceptDeadlineAt === null) return;

    setAcceptCountdownNow(Date.now());
    const intervalId = window.setInterval(() => {
      setAcceptCountdownNow(Date.now());
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [acceptDeadlineAt, hasAccepted, isGameFound]);

  useEffect(() => {
    if (
      !isGameFound ||
      hasAccepted ||
      acceptSecondsRemaining !== 0 ||
      !ownUser?.activeGame ||
      expiredMatchId === ownUser.activeGame
    ) {
      return;
    }

    const matchId = ownUser.activeGame;
    setExpiredMatchId(matchId);
    startTransition(async () => {
      try {
        await rejectGame();
      } catch (error) {
        console.error("Error expiring match acceptance window:", error);
      }
    });
  }, [
    acceptSecondsRemaining,
    expiredMatchId,
    hasAccepted,
    isGameFound,
    ownUser?.activeGame,
    rejectGame,
    startTransition,
  ]);

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
    acceptSecondsRemaining,
    hasAccepted,
    isAccepting,
    isGameFound,
    ownUser,
    onAcceptGame: handleAcceptGame,
    onRejectGame: handleRejectGame,
  };
}
