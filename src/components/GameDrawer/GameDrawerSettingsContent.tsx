"use client";

import type { ChangeEvent } from "react";
import {
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { TypocoinBalance } from "@/components/Currency";
import { Text } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { FriendList } from "@/components/FriendList/FriendList";
import { UserAvatarImage } from "@/components/Avatar";
import { ThemeModeControl } from "@/components/ThemeModeControl/ThemeModeControl";
import { getTypocoinBalanceFromUser } from "@/domain/currency";
import { truncateEmail } from "@/lib/utils";
import { HUD_SCALE_STEPS, type HudScale } from "@/hooks";

interface DrawerUser {
  avatarSeed?: string | null;
  avatarUrl?: string | null;
  email: string;
  gold?: number;
  nickname?: string;
}

interface GameDrawerSettingsContentProps {
  dbUser: DrawerUser | null | undefined;
  areAudioNotificationsEnabled: boolean;
  hudScale: HudScale;
  theme?: string;
  onAddFriend: () => void;
  onAudioNotificationsChange: (enabled: boolean) => void;
  onHudScaleChange: (scale: HudScale) => void;
  onProfileEdit: () => void;
  onSignOut: () => void;
  onThemeChange: (theme: "system" | "light" | "dark") => void;
}

export function GameDrawerSettingsContent({
  dbUser,
  areAudioNotificationsEnabled,
  hudScale,
  theme,
  onAddFriend,
  onAudioNotificationsChange,
  onHudScaleChange,
  onProfileEdit,
  onSignOut,
  onThemeChange,
}: GameDrawerSettingsContentProps) {
  if (!dbUser) return null;

  const hudScaleIndex = HUD_SCALE_STEPS.indexOf(hudScale);
  const hudScalePercent = Math.round(hudScale * 100);
  const typocoinBalance = getTypocoinBalanceFromUser(dbUser);
  const handleHudScaleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextScale = HUD_SCALE_STEPS[Number(event.target.value)];

    if (nextScale) {
      onHudScaleChange(nextScale);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <UserAvatarImage
              avatarUrl={dbUser.avatarUrl}
              avatarSeed={dbUser.avatarSeed}
              nickname={dbUser.nickname}
              className="w-16 h-16"
              initialsClassName="text-lg"
            />

            <div className="flex-1 flex flex-col justify-center">
              <Text className="text-lg font-semibold text-[var(--tw-home-fg)]">
                {dbUser.nickname || "Usuario"}
              </Text>
              <Text className="text-sm text-[var(--tw-home-muted)]">
                {truncateEmail(dbUser.email)}
              </Text>
              <TypocoinBalance
                amount={typocoinBalance}
                className="mt-2 w-fit gap-1.5"
                showLabel={false}
                size="drawer"
              />
            </div>

            <button
              onClick={onProfileEdit}
              className="flex items-center space-x-3 rounded-md p-2 text-[var(--tw-home-muted)] cursor-pointer hover:bg-[var(--tw-home-panel-strong)] hover:text-[var(--tw-home-fg)]"
            >
              <Cog6ToothIcon className="size-4" />
              <Text variant="body2" className="text-current">
                Editar perfil
              </Text>
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
            </button>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] text-orange-500">
                {areAudioNotificationsEnabled ? (
                  <SpeakerWaveIcon className="size-5" aria-hidden="true" />
                ) : (
                  <SpeakerXMarkIcon className="size-5" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 space-y-1.5">
                <Text
                  as="p"
                  variant="h6"
                  className="font-extrabold text-[var(--tw-home-fg)]"
                >
                  Audio
                </Text>
                <Text
                  as="p"
                  variant="body2"
                  className="max-w-[16rem] text-[var(--tw-home-muted)]"
                >
                  Reproduce un aviso cuando aparece una partida nueva.
                </Text>
              </div>
            </div>
            <label className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] p-1">
              <input
                checked={areAudioNotificationsEnabled}
                onChange={(event) =>
                  onAudioNotificationsChange(event.target.checked)
                }
                className="peer sr-only"
                type="checkbox"
                aria-label="Notificaciones de audio"
              />
              <span className="size-5 rounded-full bg-[var(--tw-home-muted)] transition-transform peer-checked:translate-x-5 peer-checked:bg-orange-500" />
            </label>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <Text
                as="p"
                variant="h6"
                className="font-extrabold text-[var(--tw-home-fg)]"
              >
                Tamaño del HUD
              </Text>
              <Text
                as="p"
                variant="body2"
                className="max-w-[15rem] text-[var(--tw-home-muted)]"
              >
                Ajusta botones, paneles y textos de la interfaz.
              </Text>
            </div>
            <Text
              as="span"
              variant="body2"
              className="shrink-0 rounded-md border border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] px-2.5 py-1 font-bold text-[var(--tw-home-fg)]"
            >
              {hudScalePercent}%
            </Text>
          </div>

          <input
            type="range"
            min={0}
            max={HUD_SCALE_STEPS.length - 1}
            step={1}
            value={hudScaleIndex}
            onChange={handleHudScaleChange}
            aria-label="Tamaño del HUD"
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--tw-home-panel-strong)] accent-orange-500"
          />

          <div className="grid grid-cols-5 text-center text-xs font-semibold text-[var(--tw-home-muted)]">
            {HUD_SCALE_STEPS.map((scale) => (
              <span key={scale}>{Math.round(scale * 100)}%</span>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-4">
          <div className="flex items-center justify-between gap-4">
            <Text variant="h6" className="font-extrabold text-[var(--tw-home-fg)]">
              Tema
            </Text>
            <ThemeModeControl theme={theme} onThemeChange={onThemeChange} />
          </div>
        </div>

        <div className="space-y-3 mt-10 ">
          <div className="w-full flex items-center justify-between">
            <Text variant="h6" className="font-extrabold text-[var(--tw-home-fg)]">
              Amigos
            </Text>

            <Button
              variant="ghost"
              onClick={onAddFriend}
              className="text-[var(--tw-home-muted)] hover:bg-[var(--tw-home-panel-strong)] hover:text-[var(--tw-home-fg)]"
            >
              <UserPlusIcon className="size-4 mr-2" />
              Agregar amigo
            </Button>
          </div>
          <FriendList onAddFriend={onAddFriend} />
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-[var(--tw-home-border)]">
        <Button
          onClick={onSignOut}
          variant="outline"
          className="w-full justify-start border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] text-red-400 hover:bg-[var(--tw-home-panel-strong)] hover:text-red-500"
        >
          <ArrowRightOnRectangleIcon className="size-4 mr-3" />
          <Text variant="body2" className="text-red-400">
            Cerrar sesión
          </Text>
        </Button>
      </div>
    </div>
  );
}
