"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Text } from "../Typography";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal, type ModalRefProps } from "../Modal";
import { UserPlus, Loader2, Check } from "lucide-react";
import { AnimatePresence, m } from "@/motion";
import { toast } from "sonner";
import { UserAvatarImage } from "../Avatar";

interface AddFriendsModalProps {
  onClose: () => void;
}

const FRIENDS_LOOKUP_LIMIT = 50;

export function AddFriendsModal({ onClose }: AddFriendsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState<Set<string>>(
    new Set()
  );
  const modalRef = useRef<ModalRefProps>(null);

  const friendsPage = useQuery(api.user.getFriendsPage, {
    limit: FRIENDS_LOOKUP_LIMIT,
  });
  const friends = friendsPage?.page ?? [];
  const sendFriendRequest = useMutation(api.user.sendFriendRequest);

  // Search users by nickname
  const searchResults = useQuery(
    api.user.searchUsersByNickname,
    debouncedSearchTerm ? { nickname: debouncedSearchTerm } : "skip"
  );

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Show searching state when typing
  useEffect(() => {
    if (searchTerm && searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }
  }, [searchTerm, debouncedSearchTerm]);

  // Open modal when component mounts
  useEffect(() => {
    modalRef.current?.openModal();
  }, []);

  const handleClose = () => {
    modalRef.current?.closeModal();
  };

  const handleSendFriendRequest = async (userId: Id<"user">) => {
    try {
      setLoadingRequests((prev) => new Set(prev).add(userId));
      await sendFriendRequest({ userId });

      // Force a re-render by updating state
      // The queries will automatically refetch when the component re-renders

      // Add a small delay to show the loading state
      setTimeout(() => {
        setLoadingRequests((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });

        toast.success("Solicitud de amistad enviada");
      }, 1000);
    } catch (error) {
      console.error("Error sending friend request:", error);
      setLoadingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Check if user is already a friend
  const isAlreadyFriend = (userId: string) => {
    return friends?.some((friend) => friend._id === userId) || false;
  };

  // Check if friend request was already sent
  const hasFriendRequest = (user: {
    friendshipStatus?: "none" | "friends" | "request_sent" | "request_received";
  }) => {
    return (
      user.friendshipStatus === "request_sent" ||
      user.friendshipStatus === "request_received"
    );
  };

  const renderSearchResults = () => {
    if (!debouncedSearchTerm) {
      return (
        <div className="text-center py-8">
          <Text variant="body1" className="text-gray-400">
            Escribe el nombre de usuario para buscar
          </Text>
        </div>
      );
    }

    if (isSearching) {
      return (
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
          <Text variant="body1" className="text-gray-400">
            Buscando resultados...
          </Text>
        </div>
      );
    }

    if (!searchResults || searchResults.length === 0) {
      return (
        <div className="text-center py-8">
          <Text variant="body1" className="text-gray-400">
            No se encontraron usuarios con ese nombre
          </Text>
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {searchResults.map((user, index) => (
            <m.div
              key={user._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <UserAvatarImage
                  avatarUrl={user.avatarUrl}
                  avatarSeed={user.avatarSeed}
                  nickname={user.nickname}
                  className="w-10 h-10"
                  initialsClassName="text-sm"
                />

                {/* User Info */}
                <div className="flex flex-col">
                  <Text variant="body1" className="text-white font-medium">
                    {user.nickname}
                  </Text>
                  <Text variant="caption" className="text-gray-400">
                    {user.gamesCount || 0} juegos
                  </Text>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                {isAlreadyFriend(user._id) ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check className="w-4 h-4" />
                    <Text variant="caption" className="text-green-400">
                      Agregado
                    </Text>
                  </div>
                ) : hasFriendRequest(user) ? (
                  <div className="flex items-center space-x-2 text-orange-400">
                    <Text variant="caption" className="text-orange-400">
                      Pendiente
                    </Text>
                  </div>
                ) : loadingRequests.has(user._id) ? (
                  <div className="flex items-center space-x-2 text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <Text variant="caption" className="text-blue-400">
                      Enviando...
                    </Text>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleSendFriendRequest(user._id)}
                    variant="outline"
                    size="sm"
                    className="bg-green-500/20 border-green-500/30 hover:bg-green-500/30 text-green-400 hover:text-green-300"
                  >
                    <UserPlus className="w-4 h-4" />
                    <Text variant="caption">Agregar</Text>
                  </Button>
                )}
              </div>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <Modal
      ref={modalRef}
      className="bg-gray-900 border border-gray-700 shadow-xl text-white max-h-[90vh]"
      withCloseButton={true}
      onCloseComplete={onClose}
    >
      <Modal.Content className="overflow-y-auto">
        <div className="space-y-6">
          {/* Search Input */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Buscar por nombre de usuario
            </label>
            <Input
              autoFocus
              id="search"
              type="text"
              placeholder="Escribe el nombre de usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
            />
          </div>

          {/* Search Results */}
          <div className="flex flex-col gap-2">
            <Text variant="h6" className="text-white font-semibold mb-3">
              Resultados
            </Text>
            {renderSearchResults()}
          </div>
        </div>
      </Modal.Content>

      <Modal.Bottom>
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300"
          >
            <Text variant="subtitle1" className="text-gray-300 font-bold">
              Cerrar
            </Text>
          </Button>
        </div>
      </Modal.Bottom>
    </Modal>
  );
}
