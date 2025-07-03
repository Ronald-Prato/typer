"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Text } from "../Typography";
import {
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { truncateEmail } from "@/lib/utils";
import { Button } from "../ui/button";
import { ProfileEdit } from "../ProfileEdit";

interface AvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ size = "md", className = "" }: AvatarProps) {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Query user data from Convex
  const dbUser = useQuery(api.user.getOwnUser);

  // Detect OS for keyboard shortcut display
  const isMacOS =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const keyboardShortcut = isMacOS ? "⌘ I" : "Ctrl I";

  const handleProfileEdit = () => {
    setIsDropdownOpen(false);
    setIsProfileEditOpen(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+I (macOS) or Ctrl+I (other systems)
      const isCmdOrCtrl = isMacOS ? event.metaKey : event.ctrlKey;

      if (isCmdOrCtrl && event.key === "i") {
        event.preventDefault();
        setIsDropdownOpen(!isDropdownOpen);
      }

      // Check for E key (only when dropdown is open)
      if (event.key === "e" && isDropdownOpen) {
        event.preventDefault();
        handleProfileEdit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDropdownOpen, isMacOS, handleProfileEdit]);

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

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  if (!clerkUser || !dbUser) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center ${className}`}
      >
        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const avatarContent = !dbUser.avatar ? (
    // Fallback to initials if no avatar
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-105 transition-transform duration-200 ${className}`}
      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
    >
      {dbUser.nickname
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ||
        clerkUser.emailAddresses[0]?.emailAddress[0].toUpperCase() ||
        "?"}
    </div>
  ) : (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden flex items-center justify-center relative cursor-pointer hover:scale-105 transition-transform duration-200 ${className}`}
      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
    >
      <div
        dangerouslySetInnerHTML={{ __html: dbUser.avatar }}
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: "scale(1)" }}
      />
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center space-x-2">
        {avatarContent}

        <div
          className="w-10 h-5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
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

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 overflow-hidden z-50"
            style={{
              boxShadow:
                "0 10px 25px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div className="p-3 border-b border-gray-700 flex flex-col gap-2 relative">
              <Text className="text-sm font-medium text-white">
                {dbUser.nickname || "Usuario"}
              </Text>
              <Text className="text-xs text-gray-400">
                {truncateEmail(clerkUser.emailAddresses[0]?.emailAddress)}
              </Text>
              {/* Gear icon in top right corner */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleProfileEdit}
                className="absolute top-2 right-6 w-6 h-6 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Cog6ToothIcon className="size-3" />

                <div
                  className="px-[10px] !h-[14px] bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
                  style={{
                    boxShadow:
                      "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Text variant="caption" className="!text-[8px]">
                    E
                  </Text>
                </div>
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors duration-150"
            >
              <ArrowRightOnRectangleIcon className="size-3 text-red-400" />
              <Text
                variant="caption"
                className="text-red-400
              "
              >
                Cerrar sesión
              </Text>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Edit Modal */}
      {isProfileEditOpen && (
        <ProfileEdit
          currentNickname={dbUser?.nickname || ""}
          currentAvatar={dbUser?.avatar || null}
          onClose={() => setIsProfileEditOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}
