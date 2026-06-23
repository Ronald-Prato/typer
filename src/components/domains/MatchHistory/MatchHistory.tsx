"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Accordion } from "@/components/ui/accordion";
import { format, isThisYear } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo, useState, useEffect } from "react";
import {
  MATCH_HISTORY_PAGE_SIZE,
  filterHistoryGames,
  getHistoryPageCount,
  getHistoryPageItems,
  getHistoryPaginationPages,
  isHistoryPageLoaded,
  summarizeHistoryPage,
  type HistoryFilter,
  type HistoryGame,
} from "@/domain/historyPresentation";
import { MatchHistoryGameCard } from "./MatchHistoryGameCard";
import {
  MatchHistoryEmpty,
  MatchHistoryFilterEmpty,
  MatchHistoryHeader,
  MatchHistoryLoading,
  MatchHistoryPagination,
} from "./MatchHistorySections";

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);

  if (isThisYear(date)) {
    return format(date, "d MMM, h:mm a", { locale: es });
  } else {
    return format(date, "d MMM yyyy, h:mm a", { locale: es });
  }
};


export const MatchHistory = () => {
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingPage, setPendingPage] = useState<number | null>(null);

  const {
    results: gameHistory,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.history.getGameHistory,
    {},
    { initialNumItems: MATCH_HISTORY_PAGE_SIZE }
  );

  // Track if this is the first load
  useEffect(() => {
    if (status !== "LoadingFirstPage" && isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [status, isFirstLoad]);

  const typedGameHistory = gameHistory as HistoryGame[];
  const hasMore = status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";
  const loadedPageCount = getHistoryPageCount(
    typedGameHistory.length,
    MATCH_HISTORY_PAGE_SIZE
  );
  const paginationPages = getHistoryPaginationPages({
    currentPage,
    hasMore,
    loadedItems: typedGameHistory.length,
    pageSize: MATCH_HISTORY_PAGE_SIZE,
  });
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < loadedPageCount || hasMore;

  const currentPageHistory = useMemo(() => {
    return getHistoryPageItems({
      items: typedGameHistory,
      page: currentPage,
      pageSize: MATCH_HISTORY_PAGE_SIZE,
    });
  }, [currentPage, typedGameHistory]);

  const visibleHistory = useMemo(() => {
    return filterHistoryGames(currentPageHistory, activeFilter);
  }, [activeFilter, currentPageHistory]);

  const pageSummary = useMemo(() => {
    return summarizeHistoryPage(typedGameHistory);
  }, [typedGameHistory]);

  useEffect(() => {
    setCurrentPage(1);
    setPendingPage(null);
  }, [activeFilter]);

  useEffect(() => {
    if (currentPage > loadedPageCount && loadedPageCount > 0) {
      setCurrentPage(loadedPageCount);
    }
  }, [currentPage, loadedPageCount]);

  useEffect(() => {
    if (
      pendingPage &&
      isHistoryPageLoaded({
        loadedItems: typedGameHistory.length,
        page: pendingPage,
        pageSize: MATCH_HISTORY_PAGE_SIZE,
      })
    ) {
      setCurrentPage(pendingPage);
      setPendingPage(null);
    }
  }, [pendingPage, typedGameHistory.length]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page === currentPage || isLoadingMore) return;

    if (
      isHistoryPageLoaded({
        loadedItems: typedGameHistory.length,
        page,
        pageSize: MATCH_HISTORY_PAGE_SIZE,
      })
    ) {
      setCurrentPage(page);
      return;
    }

    if (!hasMore) return;

    setPendingPage(page);
    loadMore(MATCH_HISTORY_PAGE_SIZE);
  };

  if (status === "LoadingFirstPage") {
    return <MatchHistoryLoading />;
  }

  if (typedGameHistory.length === 0) {
    return <MatchHistoryEmpty />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8">
      <MatchHistoryHeader
        activeFilter={activeFilter}
        isFirstLoad={isFirstLoad}
        summary={pageSummary}
        onFilterChange={setActiveFilter}
      />

      <Accordion type="single" collapsible className="space-y-3">
        {visibleHistory.map((game: HistoryGame, index: number) => {
          return (
            <MatchHistoryGameCard
              key={game._id}
              game={game}
              index={index}
              isFirstLoad={isFirstLoad}
              userId={game.userId}
              formatDate={formatDate}
            />
          );
        })}
      </Accordion>

      {visibleHistory.length === 0 && (
        <MatchHistoryFilterEmpty />
      )}

      <MatchHistoryPagination
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        currentPage={currentPage}
        hasMore={hasMore}
        isFirstLoad={isFirstLoad}
        isLoadingMore={isLoadingMore}
        loadedPageCount={loadedPageCount}
        pages={paginationPages}
        pendingPage={pendingPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
