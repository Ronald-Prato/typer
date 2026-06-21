"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createPendingMatchExitValue,
  PENDING_MATCH_EXIT_STORAGE_KEY,
  shouldGuardMatchExit,
} from "@/domain/matchExit";

type PendingMatchExitGuardArgs = {
  activeGame?: string | null;
  isFinished: boolean;
  onConfirmExit: () => Promise<unknown>;
};

const CONFIRM_MESSAGE =
  "Estas en medio de una partida 1v1. Si sales, abandonaras la partida. ¿Quieres salir?";

function getAnchorFromEvent(event: MouseEvent) {
  if (!(event.target instanceof Element)) return null;
  return event.target.closest<HTMLAnchorElement>("a[href]");
}

function isHomeAnchor(anchor: HTMLAnchorElement) {
  return new URL(anchor.href, window.location.href).pathname === "/home";
}

export function usePendingMatchExitGuard({
  activeGame,
  isFinished,
  onConfirmExit,
}: PendingMatchExitGuardArgs) {
  const router = useRouter();
  const shouldGuard = shouldGuardMatchExit({ activeGame, isFinished });

  const confirmAndExitToHome = useCallback(async () => {
    if (!shouldGuard) {
      router.push("/home");
      return;
    }

    if (!window.confirm(CONFIRM_MESSAGE)) return;

    await onConfirmExit();
    window.localStorage.removeItem(PENDING_MATCH_EXIT_STORAGE_KEY);
    router.push("/home");
  }, [onConfirmExit, router, shouldGuard]);

  useEffect(() => {
    if (!activeGame) return;

    const pendingExit = window.localStorage.getItem(
      PENDING_MATCH_EXIT_STORAGE_KEY
    );
    if (!pendingExit) return;

    window.localStorage.removeItem(PENDING_MATCH_EXIT_STORAGE_KEY);
    void onConfirmExit().finally(() => router.replace("/home"));
  }, [activeGame, onConfirmExit, router]);

  useEffect(() => {
    if (!shouldGuard || !activeGame) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handlePageHide = () => {
      window.localStorage.setItem(
        PENDING_MATCH_EXIT_STORAGE_KEY,
        createPendingMatchExitValue(activeGame)
      );
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = getAnchorFromEvent(event);
      if (!anchor || !isHomeAnchor(anchor)) return;

      event.preventDefault();
      void confirmAndExitToHome();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [activeGame, confirmAndExitToHome, shouldGuard]);

  return { confirmAndExitToHome };
}
