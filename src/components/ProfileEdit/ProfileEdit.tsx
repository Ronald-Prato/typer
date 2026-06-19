"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Text } from "../Typography";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal, type ModalRefProps } from "../Modal";
import { UserAvatarImage } from "../Avatar";

interface ProfileEditProps {
  currentNickname: string;
  currentAvatarSeed?: string | null;
  currentAvatarUrl?: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

const avatarUrlFromSeed = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

export function ProfileEdit({
  currentNickname,
  currentAvatarSeed,
  currentAvatarUrl,
  onClose,
  onUpdate,
}: ProfileEditProps) {
  const [nickname, setNickname] = useState(currentNickname);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarSeed, setAvatarSeed] = useState(currentAvatarSeed || "");
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || "");
  const modalRef = useRef<ModalRefProps>(null);

  const updateUser = useMutation(api.user.updateUser);

  const generateAvatar = (seed: string) => {
    setAvatarSeed(seed);
    setAvatarUrl(avatarUrlFromSeed(seed));
  };

  const randomizeAvatar = () => {
    const newSeed = Math.random().toString(36).substring(7);
    setAvatarSeed(newSeed);
    generateAvatar(newSeed);
  };

  useEffect(() => {
    if (!currentAvatarUrl) {
      const initialSeed = Math.random().toString(36).substring(7);
      generateAvatar(initialSeed);
    }
  }, [currentAvatarUrl]);

  useEffect(() => {
    // Open modal when component mounts
    modalRef.current?.openModal();
  }, []);

  const handleUpdateProfile = useCallback(async () => {
    if (!nickname.trim()) return;

    setIsLoading(true);
    try {
      await updateUser({
        avatarSeed,
        nickname: nickname.trim(),
      });

      onUpdate();
      modalRef.current?.closeModal();
    } catch (error) {
      console.error("Error updating user:", error);
      setIsLoading(false);
    }
  }, [nickname, avatarSeed, updateUser, onUpdate]);

  const handleClose = () => {
    modalRef.current?.closeModal();
  };

  // Listen for Enter key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && nickname.trim() && !isLoading) {
        event.preventDefault();
        event.stopPropagation();
        handleUpdateProfile();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [nickname, isLoading, handleUpdateProfile]);

  return (
    <Modal
      ref={modalRef}
      className="bg-gray-900 border border-gray-700 shadow-xl text-white max-h-[90vh]"
      withCloseButton={true}
      onCloseComplete={onClose}
    >
      <Modal.Content className="overflow-y-auto">
        <div className="">
          {/* Avatar Selector */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Tu Avatar
            </label>

            <div className="flex flex-col items-center space-y-4">
              {/* Avatar Display */}
              <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden flex items-center justify-center relative">
                {avatarUrl ? (
                  <UserAvatarImage
                    avatarUrl={avatarUrl}
                    avatarSeed={avatarSeed}
                    nickname={nickname}
                    className="w-20 h-20"
                    initialsClassName="text-lg"
                  />
                ) : (
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>

              {/* Randomize Button */}
              <Button
                onClick={randomizeAvatar}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1"
              >
                🎲 Randomizar
              </Button>
            </div>
          </div>

          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Nombre de usuario
            </label>
            <Input
              autoFocus
              id="nickname"
              type="text"
              placeholder="Ingresa tu nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full"
              disabled={isLoading}
            />
          </div>
        </div>
      </Modal.Content>

      <Modal.Bottom>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300 relative"
          >
            <div className="flex items-center space-x-4">
              <Text variant="subtitle1" className="text-gray-300 font-bold">
                Cancelar
              </Text>
              {/* ESC Key */}
              <div
                className="w-10 h-5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
                style={{
                  boxShadow:
                    "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                }}
              >
                <Text variant="caption">ESC</Text>
              </div>
            </div>
          </Button>
          <Button
            loading={isLoading}
            onClick={handleUpdateProfile}
            disabled={!nickname.trim() || isLoading}
            className="flex-1 relative"
          >
            <div className="flex items-center space-x-4">
              <Text variant="subtitle1" className="text-white font-bold">
                Guardar
              </Text>
              {/* Enter Key */}
              <div
                className="w-10 h-5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
                style={{
                  boxShadow:
                    "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                }}
              >
                <Text variant="caption">↵</Text>
              </div>
            </div>
          </Button>
        </div>
      </Modal.Bottom>
    </Modal>
  );
}
