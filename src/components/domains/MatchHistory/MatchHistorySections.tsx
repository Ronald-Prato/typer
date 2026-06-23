"use client";

import { motion } from "@/motion";
import { ChevronLeft, ChevronRight, Search, Swords } from "lucide-react";
import { Text } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  historyFilters,
  type HistoryFilter,
} from "@/domain/historyPresentation";

interface MatchHistoryHeaderProps {
  activeFilter: HistoryFilter;
  isFirstLoad: boolean;
  summary: {
    total: number;
    winRate: number;
    averageWpm: number;
    averageAccuracy: number;
  };
  onFilterChange: (filter: HistoryFilter) => void;
}

export function MatchHistoryLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.1 }}
        className="mb-6 flex flex-col items-start"
      >
        <Text
          variant="h5"
          className="text-center font-medium text-[var(--tw-home-fg)]"
        >
          Historial de Partidas
        </Text>
      </motion.div>

      {Array.from({ length: 4 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.1, delay: index * 0.02 }}
          className="rounded-lg border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function MatchHistoryEmpty() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.1 }}
        className="text-center py-12"
      >
        <motion.div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-orange-400"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          <Swords className="size-7" />
        </motion.div>
        <Text variant="h6" className="mb-2 text-[var(--tw-home-fg)]">
          No hay partidas jugadas
        </Text>
        <Text variant="body2" className="text-[var(--tw-home-muted)]">
          Completa tu primera partida para ver tu historial aquí
        </Text>
      </motion.div>
    </div>
  );
}

export function MatchHistoryHeader({
  activeFilter,
  isFirstLoad,
  summary,
  onFilterChange,
}: MatchHistoryHeaderProps) {
  return (
    <motion.div
      initial={isFirstLoad ? { opacity: 0, y: 5 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.1 }}
      className="mb-6 flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <Text variant="h5" className="font-semibold text-[var(--tw-home-fg)]">
            Historial de Partidas
          </Text>
          <Text variant="body2" className="text-[var(--tw-home-muted)]">
            Revisa tus resultados y métricas recientes.
          </Text>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] px-3 py-2 text-[var(--tw-home-muted)]">
          <Search className="size-4" />
          <Text variant="caption" className="text-[var(--tw-home-muted)]">
            Últimas partidas cargadas
          </Text>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Partidas", value: summary.total },
          { label: "Victorias", value: `${summary.winRate}%` },
          {
            label: "WPM prom.",
            value: summary.total > 0 ? summary.averageWpm : "N/A",
          },
          {
            label: "Precisión",
            value: summary.total > 0
              ? `${summary.averageAccuracy}%`
              : "N/A",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] px-4 py-3 shadow-[var(--tw-home-shadow)]"
          >
            <Text variant="caption" className="text-[var(--tw-home-muted)]">
              {item.label}
            </Text>
            <Text variant="h6" className="mt-1 block text-[var(--tw-home-fg)]">
              {item.value}
            </Text>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {historyFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => onFilterChange(filter.key)}
            className={cn(
              "rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
              activeFilter === filter.key
                ? "border-orange-500/60 bg-orange-500/15 text-orange-600 dark:text-orange-200"
                : "border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-[var(--tw-home-muted)] hover:border-orange-500/35 hover:text-[var(--tw-home-fg)]"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function MatchHistoryFilterEmpty() {
  return (
    <div className="rounded-lg border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] py-10 text-center">
      <Text variant="body2" className="text-[var(--tw-home-muted)]">
        No hay partidas para este filtro en la página actual.
      </Text>
    </div>
  );
}

export function MatchHistoryPagination({
  canGoNext,
  canGoPrevious,
  currentPage,
  hasMore,
  isFirstLoad,
  isLoadingMore,
  loadedPageCount,
  pages,
  pendingPage,
  onPageChange,
}: {
  canGoNext: boolean;
  canGoPrevious: boolean;
  currentPage: number;
  hasMore: boolean;
  isFirstLoad: boolean;
  isLoadingMore: boolean;
  loadedPageCount: number;
  pages: number[];
  pendingPage: number | null;
  onPageChange: (page: number) => void;
}) {
  if (pages.length <= 1 && !canGoPrevious && !canGoNext) return null;

  return (
    <motion.div
      initial={isFirstLoad ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.1 }}
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      <Button
        type="button"
        aria-label="Página anterior"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious || isLoadingMore}
        variant="outline"
        className="size-10 border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-0 text-[var(--tw-home-fg)] hover:border-orange-500/35 hover:bg-[var(--tw-home-panel-strong)] disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex items-center gap-1 rounded-md border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-1 shadow-[var(--tw-home-shadow)]">
        {pages.map((page, index) => {
          const previousPage = pages[index - 1];
          const hasGap = previousPage !== undefined && page - previousPage > 1;
          const isCurrent = page === currentPage;
          const isPending = pendingPage === page && isLoadingMore;
          const loadsMore = page > loadedPageCount && hasMore;

          return (
            <span key={page} className="flex items-center gap-1">
              {hasGap ? (
                <Text
                  variant="caption"
                  className="px-2 text-[var(--tw-home-muted)]"
                >
                  ...
                </Text>
              ) : null}
              <button
                type="button"
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Página ${page}`}
                onClick={() => onPageChange(page)}
                disabled={isLoadingMore && !isPending}
                className={cn(
                  "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold transition-colors",
                  isCurrent
                    ? "bg-orange-500/15 text-orange-600 dark:text-orange-200"
                    : "text-[var(--tw-home-muted)] hover:bg-[var(--tw-home-panel-strong)] hover:text-[var(--tw-home-fg)]",
                  loadsMore
                    ? "border border-dashed border-orange-500/35"
                    : "border border-transparent"
                )}
              >
                {isPending ? "..." : page}
              </button>
            </span>
          );
        })}
      </div>

      <Button
        type="button"
        aria-label="Página siguiente"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext || isLoadingMore}
        variant="outline"
        className="size-10 border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-0 text-[var(--tw-home-fg)] hover:border-orange-500/35 hover:bg-[var(--tw-home-panel-strong)] disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </Button>
    </motion.div>
  );
}
