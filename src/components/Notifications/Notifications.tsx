import { Bell, Check, X, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, m } from "@/motion";
import { Text } from "@/components";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserAvatarImage } from "../Avatar";
import type { Id } from "../../../convex/_generated/dataModel";

const REQUESTS_PAGE_SIZE = 25;

type FriendRequestSummary = {
  requestId: Id<"friendRequests">;
  createdAt: number;
  fromUser: {
    nickname?: string;
    avatarSeed?: string;
    avatarUrl?: string;
  };
};

type LoadedRequestPage = {
  cursorCreatedAt?: number;
  page: FriendRequestSummary[];
};

export const Notifications = () => {
  const { isAuthenticated } = useConvexAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [cursorCreatedAt, setCursorCreatedAt] = useState<number | undefined>();
  const [isAcceptPending, startAcceptTransition] = useTransition();
  const [isRejectPending, startRejectTransition] = useTransition();
  const [removingRequests, setRemovingRequests] = useState<Set<string>>(
    new Set()
  );

  const friendRequestsPage = useQuery(
    api.user.getFriendRequestsPage,
    isAuthenticated ? { limit: REQUESTS_PAGE_SIZE, cursorCreatedAt } : "skip"
  );
  const [loadedPages, setLoadedPages] = useState<LoadedRequestPage[]>([]);

  useEffect(() => {
    if (!friendRequestsPage) {
      if (!isAuthenticated) setLoadedPages([]);
      return;
    }

    setLoadedPages((pages) => {
      const nextPage = { cursorCreatedAt, page: friendRequestsPage.page };

      if (cursorCreatedAt === undefined) return [nextPage];

      const existingIndex = pages.findIndex(
        (page) => page.cursorCreatedAt === cursorCreatedAt
      );

      if (existingIndex === -1) return [...pages, nextPage];

      return pages.map((page, index) =>
        index === existingIndex ? nextPage : page
      );
    });
  }, [cursorCreatedAt, friendRequestsPage, isAuthenticated]);

  const friendRequests = useMemo(
    () => loadedPages.flatMap((loadedPage) => loadedPage.page),
    [loadedPages]
  );

  // Mutations for accepting/rejecting friend requests
  const acceptFriendRequest = useMutation(api.user.acceptFriendRequest);
  const rejectFriendRequest = useMutation(api.user.rejectFriendRequest);

  const handleAcceptRequest = async (requestId: Id<"friendRequests">) => {
    setRemovingRequests((prev) => new Set(prev).add(requestId));

    startAcceptTransition(async () => {
      try {
        await acceptFriendRequest({ friendRequestId: requestId });
        // Remove from removing set after a short delay to allow animation
        setTimeout(() => {
          setRemovingRequests((prev) => {
            const newSet = new Set(prev);
            newSet.delete(requestId);
            return newSet;
          });
        }, 300);
      } catch (error) {
        console.error("Error accepting friend request:", error);
        // Remove from removing set on error
        setRemovingRequests((prev) => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
      }
    });
  };

  const handleRejectRequest = async (requestId: Id<"friendRequests">) => {
    setRemovingRequests((prev) => new Set(prev).add(requestId));

    startRejectTransition(async () => {
      try {
        await rejectFriendRequest({ friendRequestId: requestId });
        // Remove from removing set after a short delay to allow animation
        setTimeout(() => {
          setRemovingRequests((prev) => {
            const newSet = new Set(prev);
            newSet.delete(requestId);
            return newSet;
          });
        }, 300);
      } catch (error) {
        console.error("Error rejecting friend request:", error);
        // Remove from removing set on error
        setRemovingRequests((prev) => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
      }
    });
  };

  return (
    <>
      {/* Global Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/20"
          />
        )}
      </AnimatePresence>

      <div className="relative h-full flex flex-col justify-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer relative text-gray-400 hover:text-white transition-colors"
        >
          <Bell className="size-5" />
          {friendRequests.length > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
              <Text
                variant="caption"
                className="!text-xs !text-white font-bold"
              >
                {friendRequests.length > 9 ? "9+" : friendRequests.length}
              </Text>
            </div>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-12 right-0 w-[24rem] bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl z-50 overflow-hidden"
              style={{
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
              }}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-700/50 bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <Text variant="subtitle1" className="text-white">
                    Notificaciones
                  </Text>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {friendRequests.length === 0 ? (
                  <div className="p-6 text-center">
                    <Text variant="body1" className="text-gray-400">
                      No hay solicitudes de amistad
                    </Text>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700/30">
                    <AnimatePresence>
                      {friendRequests.map((friendRequest) => (
                        <m.div
                          key={friendRequest.requestId}
                          initial={{ opacity: 1, height: "auto" }}
                          animate={{
                            opacity: removingRequests.has(friendRequest.requestId)
                              ? 0
                              : 1,
                            height: removingRequests.has(friendRequest.requestId)
                              ? 0
                              : "auto",
                          }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                            opacity: { duration: 0.2 },
                          }}
                          className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer bg-blue-500/5 overflow-hidden"
                        >
                          <div className="flex items-start space-x-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              <UserAvatarImage
                                avatarUrl={friendRequest.fromUser.avatarUrl}
                                avatarSeed={friendRequest.fromUser.avatarSeed}
                                nickname={friendRequest.fromUser.nickname}
                                className="w-8 h-8"
                                initialsClassName="text-sm"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <Text
                                  variant="body1"
                                  className="font-medium text-white"
                                >
                                  Solicitud
                                </Text>
                              </div>
                              <Text
                                variant="caption"
                                className="text-gray-400 line-clamp-2"
                              >
                                <b>{friendRequest.fromUser.nickname}</b> quiere
                                agregarte
                              </Text>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {/* Reject Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectRequest(friendRequest.requestId);
                                }}
                                disabled={
                                  isRejectPending ||
                                  removingRequests.has(friendRequest.requestId)
                                }
                                className="cursor-pointer w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isRejectPending &&
                                removingRequests.has(friendRequest.requestId) ? (
                                  <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                                )}
                              </button>

                              {/* Accept Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptRequest(friendRequest.requestId);
                                }}
                                disabled={
                                  isAcceptPending ||
                                  removingRequests.has(friendRequest.requestId)
                                }
                                className="cursor-pointer w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center hover:bg-green-500/30 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isAcceptPending &&
                                removingRequests.has(friendRequest.requestId) ? (
                                  <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4 text-green-400 group-hover:text-green-300" />
                                )}
                              </button>
                            </div>
                          </div>
                        </m.div>
                      ))}
                    </AnimatePresence>
                    {friendRequestsPage?.nextCursorCreatedAt != null && (
                      <div className="p-3">
                        <button
                          type="button"
                          onClick={() =>
                            setCursorCreatedAt(
                              friendRequestsPage?.nextCursorCreatedAt ??
                                undefined
                            )
                          }
                          className="w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                        >
                          Cargar mas solicitudes
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
