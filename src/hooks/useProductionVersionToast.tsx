"use client";

import { useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { shouldNotifyProductionVersionUpdate } from "@/domain/productionVersion";

const VERSION_ENDPOINT = "/version";
const VERSION_TOAST_ID = "production-version-update";
const DEFAULT_POLL_INTERVAL_MS = 60_000;

type VersionResponse = {
  version?: string | null;
};

type UseProductionVersionToastOptions = {
  enabled?: boolean;
  pollIntervalMs?: number;
  fetchVersion?: () => Promise<string | null>;
  reloadPage?: () => void;
};

async function fetchProductionVersion() {
  const response = await fetch(VERSION_ENDPOINT, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as VersionResponse;

  return typeof data.version === "string" ? data.version : null;
}

function reloadCurrentPage() {
  window.location.reload();
}

function showProductionVersionToast(onReload: () => void) {
  toast.custom(
    (toastId) => (
      <div className="flex max-w-sm items-center gap-3 rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white shadow-lg">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Nueva versión disponible</p>
          <p className="mt-0.5 text-xs text-gray-300">
            Recarga para usar la última versión en producción.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-orange-500 px-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          onClick={() => {
            toast.dismiss(toastId);
            onReload();
          }}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Recargar
        </button>
      </div>
    ),
    {
      id: VERSION_TOAST_ID,
      duration: Infinity,
      dismissible: true,
    }
  );
}

export function useProductionVersionToast({
  enabled = process.env.NODE_ENV === "production",
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  fetchVersion = fetchProductionVersion,
  reloadPage = reloadCurrentPage,
}: UseProductionVersionToastOptions = {}) {
  const initialVersionRef = useRef<string | null>(null);
  const notifiedVersionRef = useRef<string | null>(null);
  const isCheckingVersionRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let isActive = true;

    const checkVersion = async () => {
      if (isCheckingVersionRef.current) return;

      isCheckingVersionRef.current = true;

      try {
        const latestVersion = await fetchVersion();

        if (!isActive || !latestVersion) return;

        if (!initialVersionRef.current) {
          initialVersionRef.current = latestVersion;
          return;
        }

        const shouldNotify = shouldNotifyProductionVersionUpdate({
          initialVersion: initialVersionRef.current,
          latestVersion,
          notifiedVersion: notifiedVersionRef.current,
        });

        if (!shouldNotify) return;

        notifiedVersionRef.current = latestVersion;
        showProductionVersionToast(reloadPage);
      } catch {
        // Version checks are opportunistic; the next interval can try again.
      } finally {
        isCheckingVersionRef.current = false;
      }
    };

    void checkVersion();

    const intervalId = window.setInterval(() => {
      void checkVersion();
    }, pollIntervalMs);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [enabled, fetchVersion, pollIntervalMs, reloadPage]);
}
