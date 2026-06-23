"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeModeControlProps {
  className?: string;
  theme?: string;
  onThemeChange: (theme: ThemeMode) => void;
}

const themeOptions = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
] as const;

export function ThemeModeControl({
  className,
  theme,
  onThemeChange,
}: ThemeModeControlProps) {
  const selectedTheme = theme ?? "dark";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--tw-home-border)] bg-[var(--tw-home-panel)] p-1 shadow-[var(--tw-home-shadow)] backdrop-blur-xl",
        className
      )}
      role="group"
      aria-label="Tema de color"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedTheme === option.value;

        return (
          <button
            key={option.value}
            aria-label={`Tema ${option.label.toLowerCase()}`}
            aria-pressed={isSelected}
            className={cn(
              "flex size-9 items-center justify-center rounded-full text-[var(--tw-home-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tw-home-bg)]",
              isSelected
                ? "bg-orange-500 text-white shadow-[0_8px_22px_rgba(249,115,22,0.28)]"
                : "hover:bg-[var(--tw-home-panel-strong)] hover:text-[var(--tw-home-fg)]"
            )}
            title={`Tema ${option.label.toLowerCase()}`}
            type="button"
            onClick={() => onThemeChange(option.value)}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
