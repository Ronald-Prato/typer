"use client";

import { UserAvatarImage } from "@/components/Avatar";
import { Zap } from "lucide-react";

type HeaderUser = {
  avatarSeed?: string;
  avatarUrl?: string;
  nickname?: string;
};

type ProfileControlProps = {
  isSignedIn?: boolean;
  onOpenProfile: () => void;
  user?: HeaderUser | null;
};

export function SmallProfileAvatarButton({
  isSignedIn,
  onOpenProfile,
  user,
}: ProfileControlProps) {
  if (!isSignedIn || !user) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-600 bg-gray-800">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <button
      onClick={onOpenProfile}
      className="cursor-pointer transition-transform duration-200 hover:scale-105"
      aria-label="Abrir perfil"
      type="button"
    >
      <UserAvatarImage
        avatarUrl={user.avatarUrl}
        avatarSeed={user.avatarSeed}
        nickname={user.nickname}
        className="h-8 w-8"
      />
    </button>
  );
}

type HomeProfileButtonProps = ProfileControlProps & {
  highestPracticeWpm: number;
};

export function HomeProfileButton({
  highestPracticeWpm,
  isSignedIn,
  onOpenProfile,
  user,
}: HomeProfileButtonProps) {
  return (
    <button
      onClick={onOpenProfile}
      className="flex min-w-[11.75rem] items-center gap-3 rounded-full border border-white/45 bg-white/35 px-3 py-2 shadow-[0_10px_34px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl backdrop-saturate-150 transition-transform hover:scale-[1.02] dark:border-white/15 dark:bg-white/[0.09] dark:shadow-[0_14px_42px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.14)]"
      type="button"
      aria-label="Abrir perfil"
    >
      {isSignedIn && user ? (
        <span className="rounded-full border border-orange-500 p-1 shadow-[0_0_14px_rgba(249,115,22,0.26)]">
          <UserAvatarImage
            avatarUrl={user.avatarUrl}
            avatarSeed={user.avatarSeed}
            nickname={user.nickname}
            className="h-10 w-10"
          />
        </span>
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-orange-500 bg-gray-800 shadow-[0_0_14px_rgba(249,115,22,0.26)]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </span>
      )}
      <span className="flex flex-col items-start">
        <span className="max-w-32 truncate text-[0.95rem] font-extrabold leading-tight text-[var(--tw-home-fg)]">
          {user?.nickname || "Player"}
        </span>
        <span className="mt-1 flex items-center gap-1 text-xs font-extrabold leading-tight text-orange-500 dark:text-orange-300">
          <Zap className="size-3 fill-current" aria-hidden="true" />
          {highestPracticeWpm} WPM
        </span>
      </span>
    </button>
  );
}
