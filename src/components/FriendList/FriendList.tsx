import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Text } from "../Typography";
import { AnimatePresence, m } from "@/motion";
import { User, Trophy } from "lucide-react";
import { Button } from "../ui/button";
import { UserAvatarImage } from "../Avatar";
import type { Id } from "../../../convex/_generated/dataModel";

interface FriendListProps {
  onAddFriend: () => void;
}

// Skeleton component for loading state
const FRIENDS_PAGE_SIZE = 25;

type FriendSummary = {
  _id: Id<"user">;
  nickname?: string;
  avatarSeed?: string;
  avatarUrl?: string;
  status?: string;
  gamesCount?: number;
};

type LoadedFriendsPage = {
  cursorCreatedAt?: number;
  page: FriendSummary[];
};

const FriendSkeleton = () => (
  <m.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center space-x-3 rounded-lg border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-3"
  >
    <div className="w-10 h-10 animate-pulse rounded-full bg-[var(--tw-home-border)]"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 w-24 animate-pulse rounded bg-[var(--tw-home-border)]"></div>
      <div className="h-3 w-16 animate-pulse rounded bg-[var(--tw-home-border)]"></div>
    </div>
    <div className="w-3 h-3 animate-pulse rounded-full bg-[var(--tw-home-border)]"></div>
  </m.div>
);

// Status indicator component
const StatusIndicator = ({ status }: { status?: string }) => {
  const getStatusText = (status?: string) => {
    switch (status) {
      case "online":
        return "En línea";
      case "in_queue":
        return "En cola";
      case "game_found":
        return "En partida";
      case "in_game":
        return "En partida";
      default:
        return "Desconocido";
    }
  };

  return (
    <Text
      variant="caption"
      className="flex items-center gap-2 text-[var(--tw-home-muted)]"
    >
      {getStatusText(status)}
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    </Text>
  );
};

export function FriendList({ onAddFriend }: FriendListProps) {
  const [cursorCreatedAt, setCursorCreatedAt] = useState<number | undefined>();
  const [loadedPages, setLoadedPages] = useState<LoadedFriendsPage[]>([]);
  const friendsPage = useQuery(api.user.getFriendsPage, {
    limit: FRIENDS_PAGE_SIZE,
    cursorCreatedAt,
  });
  useEffect(() => {
    if (!friendsPage) return;

    setLoadedPages((pages) => {
      const nextPage = { cursorCreatedAt, page: friendsPage.page };

      if (cursorCreatedAt === undefined) return [nextPage];

      const existingIndex = pages.findIndex(
        (page) => page.cursorCreatedAt === cursorCreatedAt
      );

      if (existingIndex === -1) return [...pages, nextPage];

      return pages.map((page, index) =>
        index === existingIndex ? nextPage : page
      );
    });
  }, [cursorCreatedAt, friendsPage]);

  const friends = useMemo(
    () => loadedPages.flatMap((loadedPage) => loadedPage.page),
    [loadedPages]
  );

  if (friendsPage === undefined && loadedPages.length === 0) {
    // Loading state with skeleton animations
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <m.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <FriendSkeleton />
          </m.div>
        ))}
      </div>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex h-full flex-col items-center justify-center space-y-4"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] text-[var(--tw-home-muted)] shadow-[var(--tw-home-shadow)]">
          <User className="h-8 w-8" />
        </div>
        <div className="flex flex-col items-center space-y-2 text-center">
          <Text variant="body1" className="font-semibold text-[var(--tw-home-fg)]">
            No has agregado a ningún amigo
          </Text>
          <Text variant="caption" className="text-[var(--tw-home-muted)]">
            Agrega amigos para ver sus estadísticas y estado
          </Text>
        </div>
        <Button
          variant="outline"
          className="mt-4 w-full border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-[var(--tw-home-fg)] hover:bg-[var(--tw-home-panel-strong)] hover:text-[var(--tw-home-fg)]"
          onClick={onAddFriend}
        >
          Agregar amigo
        </Button>
      </m.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {friends.map((friend, index) => (
          <m.div
            key={friend._id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: "easeOut",
            }}
            className="group mt-4 cursor-pointer rounded-lg border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-4 transition-all duration-200 hover:bg-[var(--tw-home-panel-strong)]"
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <UserAvatarImage
                  avatarUrl={friend.avatarUrl}
                  avatarSeed={friend.avatarSeed}
                  nickname={friend.nickname}
                  className="w-10 h-10"
                  initialsClassName="text-sm"
                />
              </div>

              {/* Friend Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Text
                    variant="body1"
                    className="truncate font-semibold text-[var(--tw-home-fg)]"
                  >
                    {friend.nickname}
                  </Text>

                  <StatusIndicator status={friend.status} />
                </div>

                <div className="flex items-center space-x-4 text-xs text-[var(--tw-home-muted)]">
                  {/* Games Count */}
                  <div className="flex items-center space-x-1">
                    <Trophy className="w-3 h-3" />
                    <span>{friend.gamesCount || 0} juegos</span>
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        ))}
      </AnimatePresence>
      {friendsPage?.nextCursorCreatedAt != null && (
        <Button
          variant="outline"
          className="w-full border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-[var(--tw-home-fg)] hover:bg-[var(--tw-home-panel-strong)] hover:text-[var(--tw-home-fg)]"
          onClick={() =>
            setCursorCreatedAt(friendsPage?.nextCursorCreatedAt ?? undefined)
          }
        >
          Cargar mas amigos
        </Button>
      )}
    </div>
  );
}
