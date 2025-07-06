"use client";

import React, { useEffect, useState, Suspense } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const TABS = [
  { key: "home", label: "INICIO", shortcut: "1" },
  { key: "profile", label: "PERFIL", shortcut: "2" },
  { key: "history", label: "HISTORIAL", shortcut: "3" },
];

function MainTabsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get current tab from URL or default to "home"
  const currentTabFromURL = searchParams.get("tab") || "home";
  const [activeTab, setActiveTab] = useState(currentTabFromURL);

  // Sync activeTab with URL changes
  useEffect(() => {
    const currentTabFromURL = searchParams.get("tab") || "home";
    if (currentTabFromURL !== activeTab) {
      setActiveTab(currentTabFromURL);
    }
  }, [searchParams, activeTab]);

  // Internal function to handle tab changes and URL updates
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);

    if (tab === "home") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "1") {
        handleTabChange("home");
      } else if (event.key === "2") {
        handleTabChange("profile");
      } else if (event.key === "3") {
        handleTabChange("history");
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [searchParams, router, pathname]);

  return (
    <div className="w-full flex items-center justify-center bg-transparent py-2 space-x-8">
      {TABS.map((tab) => (
        <div
          key={tab.key}
          className={cn(
            "w-fit relative px-10  py-1 cursor-pointer text-lg font-extrabold tracking-wide text-center select-none border border-transparent transition-all",
            activeTab === tab.key
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow"
              : "bg-white text-blue-900 hover:bg-gray-100"
          )}
          onClick={() => handleTabChange(tab.key)}
        >
          {/* Keyboard shortcut indicator */}
          <div
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 backdrop-blur-sm text-xs font-medium rounded flex items-center justify-center border",
              activeTab === tab.key
                ? "bg-white/20 text-white border-white/30"
                : "bg-neutral-100 text-neutral-400 border-neutral-300"
            )}
            style={{
              boxShadow:
                "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            {tab.shortcut}
          </div>
          {tab.label}
        </div>
      ))}
    </div>
  );
}

export const MainTabs: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="w-full flex items-center justify-center bg-transparent py-2 space-x-8">
          {TABS.map((tab) => (
            <div
              key={tab.key}
              className="w-fit relative px-10 py-1 text-lg font-extrabold tracking-wide text-center select-none border border-transparent bg-gray-800 text-gray-400"
            >
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-700 text-xs font-medium rounded flex items-center justify-center border border-gray-600">
                {tab.shortcut}
              </div>
              {tab.label}
            </div>
          ))}
        </div>
      }
    >
      <MainTabsContent />
    </Suspense>
  );
};
