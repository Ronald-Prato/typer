"use client";

import { useState } from "react";
import {
  dicebearAvatarDataUriFromSeed,
  resolveAvatarUrl,
} from "@/domain/avatar";

interface UserAvatarImageProps {
  avatarUrl?: string | null;
  avatarSeed?: string | null;
  nickname?: string | null;
  className?: string;
  initialsClassName?: string;
  alt?: string;
}

const getInitials = (nickname?: string | null) => {
  return (
    nickname
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
};

export function UserAvatarImage({
  avatarUrl,
  avatarSeed,
  nickname,
  className = "w-10 h-10",
  initialsClassName = "text-sm",
  alt,
}: UserAvatarImageProps) {
  const [didImageFail, setDidImageFail] = useState(false);
  const safeAvatarUrl = didImageFail
    ? null
    : dicebearAvatarDataUriFromSeed(avatarSeed) ??
      resolveAvatarUrl({ avatarSeed: null, avatarUrl });

  if (!safeAvatarUrl) {
    return (
      <div
        className={`${className} rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold ${initialsClassName}`}
      >
        {getInitials(nickname)}
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden flex items-center justify-center`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Dicebear SVG avatars are allowlisted and rendered unoptimized. */}
      <img
        alt={alt ?? nickname ?? "Avatar"}
        src={safeAvatarUrl}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setDidImageFail(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
