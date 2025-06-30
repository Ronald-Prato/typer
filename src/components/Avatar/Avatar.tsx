"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface AvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ size = "md", className = "" }: AvatarProps) {
  const { user: clerkUser } = useUser();

  // Query user data from Convex
  const dbUser = useQuery(
    api.user.getUser,
    clerkUser ? { authId: clerkUser.id } : "skip"
  );

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

  if (!dbUser.avatar) {
    // Fallback to initials if no avatar
    const initials =
      dbUser.nickname
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ||
      clerkUser.emailAddresses[0]?.emailAddress[0].toUpperCase() ||
      "?";

    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden flex items-center justify-center relative ${className}`}
    >
      <div
        dangerouslySetInnerHTML={{ __html: dbUser.avatar }}
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: "scale(1)" }}
      />
    </div>
  );
}
