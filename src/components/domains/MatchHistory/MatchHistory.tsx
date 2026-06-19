"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Accordion } from "@/components/ui/accordion";
import { format, isThisYear } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo, useState, useEffect } from "react";
import {
  filterHistoryGames,
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

  const {
    results: gameHistory,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.history.getGameHistory,
    {},
    { initialNumItems: 5 }
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

  const visibleHistory = useMemo(() => {
    return filterHistoryGames(typedGameHistory, activeFilter);
  }, [activeFilter, typedGameHistory]);

  const pageSummary = useMemo(() => {
    return summarizeHistoryPage(typedGameHistory);
  }, [typedGameHistory]);

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
        hasMore={hasMore}
        isFirstLoad={isFirstLoad}
        isLoadingMore={isLoadingMore}
        onLoadMore={() => loadMore(5)}
      />
    </div>
  );
};
