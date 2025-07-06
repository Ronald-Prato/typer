"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/Drawer.tsx/Drawer";
import { Text } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import {
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { truncateEmail } from "@/lib/utils";
import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { ProfileEdit } from "@/components/ProfileEdit";
import { useOS } from "@/hooks";

interface GameDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameDrawer({ isOpen, onOpenChange }: GameDrawerProps) {
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const dbUser = useQuery(api.user.getOwnUser);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  const { isMacOS } = useOS();
  const keyboardShortcut = isMacOS ? "⌘ I" : "Ctrl I";

  const handleProfileEdit = () => {
    onOpenChange(false);
    setIsProfileEditOpen(true);
  };

  const handleProfileUpdate = () => {
    // This will trigger a re-render and update the user data
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Handle E key for profile edit when drawer is open
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "e" && isOpen) {
        event.preventDefault();
        handleProfileEdit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle keyboard shortcuts for opening drawer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+I (macOS) or Ctrl+I (other systems)
      const isCmdOrCtrl = isMacOS ? event.metaKey : event.ctrlKey;

      if (isCmdOrCtrl && event.key === "i") {
        event.preventDefault();
        onOpenChange(!isOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isMacOS, onOpenChange]);

  // Settings content component
  const SettingsContent = () => {
    if (!isSignedIn || !dbUser) return null;

    return (
      <div className="flex flex-col h-full">
        {/* Main Content - Takes up available space */}
        <div className="flex-1 space-y-6">
          {/* User Info Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden flex items-center justify-center relative">
                {dbUser.avatar ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: dbUser.avatar }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ transform: "scale(1)" }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                    {dbUser.nickname
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "?"}
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <Text className="text-lg font-semibold text-white">
                  {dbUser.nickname || "Usuario"}
                </Text>
                <Text className="text-sm text-gray-400">
                  {truncateEmail(dbUser.email)}
                </Text>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="space-y-3">
            {/* Edit Profile Button */}
            <Button
              onClick={handleProfileEdit}
              variant="outline"
              className="w-full justify-start bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <Cog6ToothIcon className="size-4" />
                  <Text variant="body2" className="text-gray-300">
                    Editar perfil
                  </Text>
                </div>
                <div
                  className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
                  style={{
                    boxShadow:
                      "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Text variant="caption" className="!text-xs">
                    E
                  </Text>
                </div>
              </div>
            </Button>
          </div>

          {/* Keyboard Shortcut Info */}
          {/* <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center justify-center space-x-2">
              <Text variant="caption" className="text-gray-400">
                Abrir configuración:
              </Text>
              <div
                className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
                style={{
                  boxShadow:
                    "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                }}
              >
                <Text variant="caption" className="!text-xs">
                  {keyboardShortcut}
                </Text>
              </div>
            </div>
          </div> */}
        </div>

        {/* Bottom Section - Sign Out Button */}
        <div className="mt-auto pt-6 border-t border-gray-700">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full justify-start bg-gray-800 border-gray-600 hover:bg-gray-700 text-red-400 hover:text-red-300"
          >
            <ArrowRightOnRectangleIcon className="size-4 mr-3" />
            <Text variant="body2" className="text-red-400">
              Cerrar sesión
            </Text>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onOpenChange} name="Game Settings">
        <div className="p-6 space-y-6 bg-gray-900 h-full overflow-y-auto">
          <SettingsContent />
        </div>
      </Drawer>

      {/* Profile Edit Modal */}
      {isProfileEditOpen && (
        <ProfileEdit
          currentNickname={dbUser?.nickname || ""}
          currentAvatar={dbUser?.avatar || null}
          onClose={() => setIsProfileEditOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
}
