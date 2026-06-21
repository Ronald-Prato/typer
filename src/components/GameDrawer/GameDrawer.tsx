"use client";

import { useCallback, useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Drawer } from "@/components/Drawer/Drawer";
import { ProfileEdit } from "@/components/ProfileEdit";
import { AddFriendsModal } from "../AddFriendsModal";
import { useHudScale, useLowPerformanceMode, useOS } from "@/hooks";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  isGameDrawerProfileEditShortcut,
  isGameDrawerToggleShortcut,
} from "@/domain/gameDrawer";
import { GameDrawerSettingsContent } from "./GameDrawerSettingsContent";

interface GameDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameDrawer({ isOpen, onOpenChange }: GameDrawerProps) {
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();
  const dbUser = useCurrentUser();
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const { isMacOS } = useOS();
  const { scale: hudScale, setScale: setHudScale } = useHudScale();
  const { isLowPerformanceMode, setLowPerformanceMode } =
    useLowPerformanceMode();
  const { theme, setTheme } = useTheme();

  const handleProfileEdit = useCallback(() => {
    onOpenChange(false);
    setIsProfileEditOpen(true);
  }, [onOpenChange]);

  const handleAddFriend = useCallback(() => {
    setIsAddFriendModalOpen(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [signOut]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGameDrawerProfileEditShortcut(event, isOpen)) {
        event.preventDefault();
        handleProfileEdit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleProfileEdit, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGameDrawerToggleShortcut(event, isMacOS)) {
        event.preventDefault();
        onOpenChange(!isOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMacOS, isOpen, onOpenChange]);

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onOpenChange} name="Game Settings">
        <div className="p-6 space-y-6 bg-[var(--tw-home-bg)] h-full overflow-y-auto">
          {isSignedIn && (
            <GameDrawerSettingsContent
              dbUser={dbUser}
              hudScale={hudScale}
              isLowPerformanceMode={isLowPerformanceMode}
              theme={theme}
              onAddFriend={handleAddFriend}
              onHudScaleChange={setHudScale}
              onLowPerformanceModeChange={setLowPerformanceMode}
              onProfileEdit={handleProfileEdit}
              onSignOut={handleSignOut}
              onThemeChange={setTheme}
            />
          )}
        </div>
      </Drawer>

      {isProfileEditOpen && (
        <ProfileEdit
          currentNickname={dbUser?.nickname || ""}
          currentAvatarSeed={dbUser?.avatarSeed || null}
          currentAvatarUrl={dbUser?.avatarUrl || null}
          onClose={() => setIsProfileEditOpen(false)}
          onUpdate={() => undefined}
        />
      )}

      {isAddFriendModalOpen && (
        <AddFriendsModal onClose={() => setIsAddFriendModalOpen(false)} />
      )}
    </>
  );
}
