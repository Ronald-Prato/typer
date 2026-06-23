"use client";

import { motion } from "@/motion";
import { CircleX, Swords, Trophy } from "lucide-react";
import { UserAvatarImage } from "@/components/Avatar";
import { TypocoinToken } from "@/components/Currency";
import { Text } from "@/components/Typography";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  getHistoryPrimaryStats,
  getHistoryStageStats,
  getHistoryOpponent,
  type HistoryGame,
} from "@/domain/historyPresentation";
import {
  TYPOCOIN_REWARD_FOR_1V1_WIN,
  formatTypocoinLabel,
} from "@/domain/currency";

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
  const opponent = getHistoryOpponent(game);
  const primaryStats = getHistoryPrimaryStats(game, userId);
  const stageStats = getHistoryStageStats(game, userId);
  const [heroStat, ...supportingStats] = primaryStats;

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
          <div className="flex w-full min-w-0 flex-col gap-4 pr-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
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
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3 lg:max-w-3xl lg:items-end">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
                {heroStat ? (
                  <div className="flex items-baseline gap-2 rounded-md border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-orange-600 dark:text-orange-200">
                    <Text variant="h6" className="font-bold">
                      {heroStat.value}
                    </Text>
                    <Text variant="caption" className="font-semibold uppercase">
                      {heroStat.label}
                    </Text>
                  </div>
                ) : null}

                <div className="flex items-center gap-2 sm:justify-end">
                  <TypocoinToken
                    size="md"
                    className={cn(
                      "size-5",
                      isWinner ? "opacity-100" : "opacity-50 grayscale"
                    )}
                  />
                  <Text
                    variant="body2"
                    className={cn(
                      "font-bold",
                      isWinner
                        ? "text-cyan-800 dark:text-cyan-100"
                        : "text-[var(--tw-home-muted)]"
                    )}
                  >
                    {formatTypocoinLabel(
                      isWinner ? TYPOCOIN_REWARD_FOR_1V1_WIN : 0,
                      { signed: isWinner }
                    )}
                  </Text>
                </div>
              </div>

              <div className="flex w-full flex-wrap gap-2 lg:justify-end">
                {supportingStats.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-md border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] px-3 py-1.5"
                  >
                    <Text
                      variant="caption"
                      className="block text-[var(--tw-home-muted)]"
                    >
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
              </div>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-4 pb-4">
          <div className="grid gap-3 border-t border-[var(--tw-home-border)] pt-4 md:grid-cols-2 xl:grid-cols-4">
            {stageStats.map((stage) => (
              <div
                key={stage.label}
                className="rounded-lg border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-3"
              >
                <Text variant="caption" className="text-[var(--tw-home-muted)]">
                  {stage.label}
                </Text>
                {stage.stats.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stage.stats.map((metric) => (
                      <div
                        key={`${stage.label}-${metric.label}`}
                        className={cn(
                          "rounded-md px-2 py-1",
                          metric.emphasis
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-200"
                            : "bg-[var(--tw-home-panel-strong)] text-[var(--tw-home-fg)]"
                        )}
                      >
                        <Text variant="caption" className="font-semibold">
                          {metric.value} {metric.label}
                        </Text>
                      </div>
                    ))}
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
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </motion.div>
  );
}
