"use client";

interface UserAvatarImageProps {
  avatarUrl?: string | null;
  avatarSeed?: string | null;
  nickname?: string | null;
  className?: string;
  initialsClassName?: string;
  alt?: string;
}

const DICEBEAR_AVATAR_BASE = "https://api.dicebear.com/7.x/avataaars/svg";
const DICEBEAR_URL_PREFIX = "https://api.dicebear.com/";

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
  const generatedAvatarUrl =
    typeof avatarSeed === "string" && avatarSeed.trim()
      ? `${DICEBEAR_AVATAR_BASE}?seed=${encodeURIComponent(avatarSeed.trim())}`
      : null;
  const safeAvatarUrl =
    typeof avatarUrl === "string" && avatarUrl.startsWith(DICEBEAR_URL_PREFIX)
      ? avatarUrl
      : generatedAvatarUrl;

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
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
