"use client";

import { motion } from "@/motion";
import { CircleX, Coins, Swords, Trophy } from "lucide-react";
import { UserAvatarImage } from "@/components/Avatar";
import { Text } from "@/components/Typography";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  calculateHistoryAverageMetrics,
  formatHistoryAccuracy,
  formatHistoryTime,
  formatHistoryWpm,
  getHistoryOpponent,
  historyStageLabels,
  type HistoryGame,
  type HistoryMetric,
} from "@/domain/historyPresentation";

interface MatchHistoryGameCardProps {
  game: HistoryGame;
  index: number;
  isFirstLoad: boolean;
  userId: string;
  formatDate: (timestamp: number) => string;
}

export function MatchHistoryGameCard({
  game,
  index,
  isFirstLoad,
  userId,
  formatDate,
}: MatchHistoryGameCardProps) {
  const isWinner = game.winner === userId;
  const avgMetrics = calculateHistoryAverageMetrics(game.progress, userId);
  const opponent = getHistoryOpponent(game);
  const stageMetrics = game.progress?.[userId];

  return (
    <motion.div
      key={game._id}
      initial={isFirstLoad ? { opacity: 0, x: -10 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.1,
        delay: isFirstLoad ? index * 0.01 : 0,
      }}
    >
      <AccordionItem
        value={game._id}
        className={cn(
          "overflow-hidden rounded-lg border bg-[var(--tw-home-panel-strong)] shadow-[var(--tw-home-shadow)] transition-all duration-150",
          isWinner
            ? "border-amber-500/35 hover:border-amber-500/55"
            : "border-red-500/30 hover:border-red-500/50"
        )}
      >
        <AccordionTrigger className="px-4 py-4 transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--tw-home-panel)_72%,transparent)]">
          <div className="flex w-full min-w-0 flex-col gap-3 pr-4 md:grid md:grid-cols-[minmax(15rem,1.4fr)_repeat(4,minmax(5rem,0.6fr))_minmax(6rem,0.5fr)] md:items-center md:gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-md border",
                  isWinner
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                    : "border-red-400/30 bg-red-500/10 text-red-300"
                )}
              >
                {isWinner ? (
                  <Trophy className="size-5" />
                ) : (
                  <CircleX className="size-5" />
                )}
              </div>

              <div className="flex min-w-0 flex-col items-start">
                <div className="flex flex-wrap items-center gap-2">
                  <Text
                    variant="body2"
                    className={cn(
                      "font-bold",
                      isWinner
                        ? "text-amber-700 dark:text-amber-100"
                        : "text-red-700 dark:text-red-100"
                    )}
                  >
                    {isWinner ? "VICTORIA" : "DERROTA"}
                  </Text>
                  <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] px-2 py-0.5 text-xs font-semibold text-[var(--tw-home-muted)]">
                    {opponent ? (
                      <UserAvatarImage
                        avatarUrl={opponent.avatarUrl}
                        avatarSeed={opponent.avatarSeed}
                        nickname={opponent.nickname}
                        className="size-4"
                        initialsClassName="text-[0.55rem]"
                        alt={`Avatar de ${opponent.nickname}`}
                      />
                    ) : (
                      <Swords className="size-3 shrink-0" />
                    )}
                    <span className="min-w-0 truncate">
                      {opponent?.nickname ?? "1v1"}
                    </span>
                  </span>
                </div>
                <Text variant="caption" className="mt-1 text-[var(--tw-home-muted)]">
                  {formatDate(game.createdAt ?? game._creationTime)}
                </Text>
                <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1 md:hidden">
                  <Text variant="caption" className="text-[var(--tw-home-muted)]">
                    Tiempo {formatHistoryTime(avgMetrics.timeMs)}
                  </Text>
                  <Text variant="caption" className="text-[var(--tw-home-muted)]">
                    Errores {avgMetrics.errors}
                  </Text>
                  <Text variant="caption" className="text-[var(--tw-home-muted)]">
                    Precisión {formatHistoryAccuracy(avgMetrics.accuracy)}
                  </Text>
                  <Text variant="caption" className="text-[var(--tw-home-muted)]">
                    WPM {formatHistoryWpm(avgMetrics.wpm)}
                  </Text>
                </div>
              </div>
            </div>

            {[
              { label: "Tiempo", value: formatHistoryTime(avgMetrics.timeMs) },
              { label: "Errores", value: avgMetrics.errors },
              {
                label: "Precisión",
                value: formatHistoryAccuracy(avgMetrics.accuracy),
              },
              { label: "WPM", value: formatHistoryWpm(avgMetrics.wpm) },
            ].map((metric) => (
              <div
                key={metric.label}
                className="hidden flex-col items-start md:flex"
              >
                <Text variant="caption" className="text-[var(--tw-home-muted)]">
                  {metric.label}
                </Text>
                <Text
                  variant="body2"
                  className="font-semibold text-[var(--tw-home-fg)]"
                >
                  {metric.value}
                </Text>
              </div>
            ))}

            <div className="hidden items-center justify-end gap-2 md:flex">
              <Coins
                className={cn(
                  "size-4",
                  isWinner
                    ? "text-amber-500 dark:text-amber-300"
                    : "text-[var(--tw-home-muted)]"
                )}
              />
              <Text
                variant="body2"
                className={cn(
                  "font-bold",
                  isWinner
                    ? "text-amber-700 dark:text-amber-200"
                    : "text-[var(--tw-home-muted)]"
                )}
              >
                {isWinner ? "+10 oro" : "0 oro"}
              </Text>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-4 pb-4">
          <div className="grid gap-3 border-t border-[var(--tw-home-border)] pt-4 md:grid-cols-4">
            {historyStageLabels.map((stage) => {
              const metrics = stageMetrics?.[stage.key] as
                | HistoryMetric
                | undefined;

              return (
                <div
                  key={stage.label}
                  className="rounded-lg border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-3"
                >
                  <Text variant="caption" className="text-[var(--tw-home-muted)]">
                    {stage.label}
                  </Text>
                  {metrics ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Text variant="caption" className="text-[var(--tw-home-fg)]">
                        {formatHistoryTime(metrics.timeMs)}
                      </Text>
                      <Text variant="caption" className="text-[var(--tw-home-fg)]">
                        {metrics.errors} err
                      </Text>
                      <Text variant="caption" className="text-[var(--tw-home-fg)]">
                        {formatHistoryAccuracy(metrics.accuracy)}
                      </Text>
                      <Text variant="caption" className="text-[var(--tw-home-fg)]">
                        {formatHistoryWpm(metrics.wpm)} WPM
                      </Text>
                    </div>
                  ) : (
                    <Text
                      variant="caption"
                      className="mt-3 block text-[var(--tw-home-muted)]"
                    >
                      Sin datos
                    </Text>
                  )}
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </motion.div>
  );
}
