"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Text } from "../Typography";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal, type ModalRefProps } from "../Modal";
import { UserPlus, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface AddFriendsModalProps {
  onClose: () => void;
}

export function AddFriendsModal({ onClose }: AddFriendsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState<Set<string>>(
    new Set()
  );
  const modalRef = useRef<ModalRefProps>(null);

  // Get current user and friends
  const currentUser = useQuery(api.user.getOwnUser);
  const friends = useQuery(api.user.getFriends);
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

  // Listen for modal close events
  useEffect(() => {
    const checkModalState = setInterval(() => {
      if (modalRef.current && !modalRef.current.isOpen) {
        onClose();
        clearInterval(checkModalState);
      }
    }, 50);

    return () => clearInterval(checkModalState);
  }, [onClose]);

  const handleClose = () => {
    modalRef.current?.closeModal();
    setTimeout(() => onClose(), 200);
  };

  const handleSendFriendRequest = async (userId: any) => {
    try {
      console.log("Sending friend request to:", userId);
      setLoadingRequests((prev) => new Set(prev).add(userId));
      await sendFriendRequest({ userId: userId as any });
      console.log("Friend request sent successfully");

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
  const hasFriendRequest = (userId: string) => {
    return currentUser?.friendRequests?.includes(userId as any) || false;
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
          {searchResults.map((user: any, index: number) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                {user.avatar ? (
                  <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden flex items-center justify-center">
                    <div
                      dangerouslySetInnerHTML={{ __html: user.avatar }}
                      className="w-full h-full flex items-center justify-center"
                      style={{ transform: "scale(1)" }}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                    {user.nickname
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "?"}
                  </div>
                )}

                {/* User Info */}
                <div className="flex flex-col">
                  <Text variant="body1" className="text-white font-medium">
                    {user.nickname}
                  </Text>
                  <Text variant="caption" className="text-gray-400">
                    {user.games?.length || 0} juegos
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
                ) : hasFriendRequest(user._id) ? (
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
                    onClick={() => handleSendFriendRequest(user._id as any)}
                    variant="outline"
                    size="sm"
                    className="bg-green-500/20 border-green-500/30 hover:bg-green-500/30 text-green-400 hover:text-green-300"
                  >
                    <UserPlus className="w-4 h-4" />
                    <Text variant="caption">Agregar</Text>
                  </Button>
                )}
              </div>
            </motion.div>
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
