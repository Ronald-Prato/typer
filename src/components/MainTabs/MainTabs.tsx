"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { BarChart3, Dumbbell, Home as HomeIcon } from "lucide-react";

const TABS = [
  { key: "home", label: "INICIO", shortcut: "1", href: "/home", icon: HomeIcon },
  {
    key: "practice",
    label: "PRÁCTICA",
    shortcut: "2",
    href: "/home?tab=practice",
    icon: Dumbbell,
  },
  {
    key: "history",
    label: "HISTORIAL",
    shortcut: "3",
    href: "/home?tab=history",
    icon: BarChart3,
  },
] as const;

type MainTabKey = (typeof TABS)[number]["key"];

type MainTabsVariant = "vertical" | "horizontal";

function getMainTabKey(tab: string | null): MainTabKey {
  return TABS.some((item) => item.key === tab) ? (tab as MainTabKey) : "home";
}

function MainTabsContent({ variant = "vertical" }: { variant?: MainTabsVariant }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get current tab from URL or default to "home"
  const currentTabFromURL = getMainTabKey(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState(currentTabFromURL);

  useEffect(() => {
    setActiveTab(currentTabFromURL);
  }, [currentTabFromURL]);

  useEffect(() => {
    TABS.forEach((tab) => {
      router.prefetch(tab.href);
    });
  }, [router]);

  // Internal function to handle tab changes and URL updates
  const handleTabChange = useCallback(
    (tabKey: MainTabKey) => {
      const tab = TABS.find((item) => item.key === tabKey);
      if (!tab) {
        return;
      }

      setActiveTab(tabKey);
      router.replace(tab.href);
    },
    [router]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "1") {
        handleTabChange("home");
      } else if (event.key === "2") {
        handleTabChange("practice");
      } else if (event.key === "3") {
        handleTabChange("history");
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [handleTabChange]);

  const isHorizontal = variant === "horizontal";

  return (
    <nav
      className={cn(
        "flex h-full w-full items-center justify-center",
        isHorizontal ? "flex-row gap-3" : "flex-col gap-10"
      )}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            className={cn(
              "group relative flex cursor-pointer items-center text-center transition-colors",
              isHorizontal
                ? "min-w-28 flex-row justify-center gap-2 rounded-full border px-4 py-3"
                : "w-full flex-col gap-4 py-2",
              isActive
                ? isHorizontal
                  ? "border-orange-500/35 bg-orange-500/10 text-orange-500 shadow-[0_0_24px_rgba(249,115,22,0.12)]"
                  : "text-orange-500"
                : isHorizontal
                  ? "border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] text-[var(--tw-home-fg)] hover:border-blue-400/40 hover:text-blue-400"
                  : "text-[var(--tw-home-fg)] hover:text-blue-400"
            )}
            onClick={() => handleTabChange(tab.key)}
            type="button"
          >
            <Icon
              className={cn(
                "stroke-[1.8] transition-colors",
                isHorizontal ? "size-5" : "size-10",
                isActive
                  ? "text-orange-500 drop-shadow-[0_0_14px_rgba(249,115,22,0.55)]"
                  : "text-blue-400/90 group-hover:text-blue-500"
              )}
            />
            <span
              className={cn(
                "font-extrabold tracking-wide",
                isHorizontal ? "text-xs" : "text-sm",
                isActive ? "text-orange-500" : "text-[var(--tw-home-fg)]"
              )}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export const MainTabs: React.FC<{ variant?: MainTabsVariant }> = ({
  variant = "vertical",
}) => {
  const isHorizontal = variant === "horizontal";

  return (
    <Suspense
      fallback={
        <div
          className={cn(
            "flex h-full w-full items-center justify-center",
            isHorizontal ? "flex-row gap-3" : "flex-col gap-10"
          )}
        >
          {TABS.map((tab) => (
            <div
              key={tab.key}
              className={cn(
                "animate-pulse rounded bg-white/5",
                isHorizontal ? "h-11 w-28 rounded-full" : "h-20 w-full"
              )}
            >
              <span className="sr-only">{tab.label}</span>
            </div>
          ))}
        </div>
      }
    >
      <MainTabsContent variant={variant} />
    </Suspense>
  );
};
