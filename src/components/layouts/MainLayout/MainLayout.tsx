"use client";
import { useUser } from "@clerk/nextjs";
import { Text } from "@/components";
import Link from "next/link";
import { MatchMakingComponent } from "@/components/MatchMakingComponent/MatchMakingComponent";
import { motion, useAnimation } from "@/motion";
import { useEffect, useState } from "react";
import { MainTabs } from "@/components/MainTabs/MainTabs";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GameDrawer } from "@/components/GameDrawer";
import { useOS } from "@/hooks";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Notifications } from "@/components/Notifications";
import { UserAvatarImage } from "@/components/Avatar";
import { Zap } from "lucide-react";
import {
  HomeBackground,
  HomeBackgroundDashProvider,
} from "@/components/layouts/HomeBackground";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const dbUser = useCurrentUser();
  const headerControls = useAnimation();
  const [currentAuraColor, setCurrentAuraColor] = useState<string>("none");
  const [isGameDrawerOpen, setIsGameDrawerOpen] = useState(false);

  const { isMacOS } = useOS();
  const keyboardShortcut = isMacOS ? "⌘ I" : "Ctrl I";
  const isInQueue = dbUser?.status === "in_queue";
  const highestPracticeWpm = dbUser?.highestPracticeWpm ?? 0;

  // Control header animations based on user state
  useEffect(() => {
    if (isInQueue) {
      setCurrentAuraColor("green-blue");
      // In queue - gradual appearance with growth effect
      headerControls
        .start({
          y: 0,
          boxShadow: [
            "0 0 0px rgba(34, 197, 94, 0)",
            "0 0 10px rgba(34, 197, 94, 0.2)",
            "0 0 20px rgba(59, 130, 246, 0.3)",
            "0 0 30px rgba(34, 197, 94, 0.4)",
            "0 0 40px rgba(59, 130, 246, 0.5)",
            "0 0 50px rgba(34, 197, 94, 0.6)",
            "0 0 60px rgba(59, 130, 246, 0.7)",
          ],
          transition: {
            y: { duration: 0.8, ease: "easeOut" },
            boxShadow: { duration: 3, ease: "easeOut" },
          },
        })
        .then(() => {
          // Start pulsing animation after growth
          headerControls.start({
            boxShadow: [
              "0 0 60px rgba(34, 197, 94, 0.6)",
              "0 0 90px rgba(59, 130, 246, 0.7)",
              "0 0 60px rgba(34, 197, 94, 0.6)",
            ],
            transition: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          });
        });
    } else {
      // No queue - remove aura gradually
      let fadeOutColor = "rgba(0, 0, 0, 0)";

      if (currentAuraColor === "green-blue") {
        fadeOutColor = "rgba(34, 197, 94, 0.6)";
      }

      headerControls.start({
        y: 0,
        boxShadow: [
          `0 0 60px ${fadeOutColor}`,
          `0 0 50px ${fadeOutColor.replace("0.6", "0.5")}`,
          `0 0 40px ${fadeOutColor.replace("0.6", "0.4")}`,
          `0 0 30px ${fadeOutColor.replace("0.6", "0.3")}`,
          `0 0 20px ${fadeOutColor.replace("0.6", "0.2")}`,
          `0 0 10px ${fadeOutColor.replace("0.6", "0.1")}`,
          "0 0 0px rgba(0, 0, 0, 0)",
        ],
        transition: {
          y: { duration: 0.8, ease: "easeOut" },
          boxShadow: { duration: 3, ease: "easeOut" },
        },
      });

      setCurrentAuraColor("none");
    }
  }, [isInQueue, headerControls, currentAuraColor]);

  // Simple avatar component
  const AvatarDisplay = () => {
    if (!isSignedIn || !dbUser) {
      return (
        <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    return (
      <button
        onClick={() => setIsGameDrawerOpen(true)}
        className="cursor-pointer hover:scale-105 transition-transform duration-200"
        aria-label="Abrir perfil"
      >
        <UserAvatarImage
          avatarUrl={dbUser.avatarUrl}
          avatarSeed={dbUser.avatarSeed}
          nickname={dbUser.nickname}
          className="w-8 h-8"
        />
      </button>
    );
  };

  if (pathname === "/home") {
    return (
      <HomeBackgroundDashProvider>
        <div className="relative h-screen overflow-hidden bg-[var(--tw-home-bg)] text-[var(--tw-home-fg)]">
          <HomeBackground />

          {<MatchMakingComponent />}

          <header className="fixed left-0 right-0 top-0 z-30 grid h-24 grid-cols-[1fr_auto_1fr] items-center px-10">
          <Link href="/home" className="justify-self-start">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--tw-home-fg)]">
              typewars.io
            </h1>
          </Link>

          <div className="justify-self-center">
            <MainTabs variant="horizontal" />
          </div>

          <button
            onClick={() => setIsGameDrawerOpen(true)}
            className="flex min-w-[11.75rem] items-center gap-3 justify-self-end rounded-full border border-white/45 bg-white/35 px-3 py-2 shadow-[0_10px_34px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl backdrop-saturate-150 transition-transform hover:scale-[1.02] dark:border-white/15 dark:bg-white/[0.09] dark:shadow-[0_14px_42px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.14)]"
            type="button"
            aria-label="Abrir perfil"
          >
            <span className="rounded-full border border-orange-500 p-1 shadow-[0_0_14px_rgba(249,115,22,0.26)]">
              {isSignedIn && dbUser ? (
                <UserAvatarImage
                  avatarUrl={dbUser.avatarUrl}
                  avatarSeed={dbUser.avatarSeed}
                  nickname={dbUser.nickname}
                  className="w-10 h-10"
                />
              ) : (
                <span className="flex w-10 h-10 items-center justify-center rounded-full bg-gray-800">
                  <span className="w-5 h-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                </span>
              )}
            </span>
            <span className="flex flex-col items-start">
              <span className="max-w-32 truncate text-[0.95rem] font-extrabold leading-tight text-[var(--tw-home-fg)]">
                {dbUser?.nickname || "Player"}
              </span>
              <span className="mt-1 flex items-center gap-1 text-xs font-extrabold leading-tight text-orange-500 dark:text-orange-300">
                <Zap className="size-3 fill-current" aria-hidden="true" />
                {highestPracticeWpm} WPM
              </span>
            </span>
          </button>
          </header>

          <main className="relative z-10 h-screen overflow-hidden">
            <div className="flex h-full min-h-0 items-center justify-center px-10 pt-24">
              <div className="h-full min-h-0 w-full max-w-[72rem]">
                {children}
              </div>
            </div>
          </main>

          <GameDrawer
            isOpen={isGameDrawerOpen}
            onOpenChange={setIsGameDrawerOpen}
          />
        </div>
      </HomeBackgroundDashProvider>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-950 text-white relative grid",
        pathname === "/home"
          ? "grid-rows-[80px_1fr_100px]"
          : "grid-rows-[1fr_100px]"
      )}
    >
      {pathname === "/home" && (
        <motion.header
          className="bg-gray-950/95 backdrop-blur-sm  relative z-20 h-20"
          initial={{
            y: -10,
            boxShadow: "0 0 0px rgba(0, 0, 0, 0)",
          }}
          animate={headerControls}
        >
          <div className="container mx-auto px-6 py-4 h-full">
            <div className="grid grid-cols-[2fr_8fr_2fr] items-center h-full">
              <Link href="/home">
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-white">typewars.io</h1>
                </div>
              </Link>

              {
                <div className="w-full h-full">
                  <MainTabs />
                </div>
              }

              <div className="flex items-center justify-end space-x-4">
                {/* <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> */}

                <Notifications />

                <AvatarDisplay />
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
            </div>
          </div>
        </motion.header>
      )}

      {<MatchMakingComponent />}

      {/* Page content - above the background image */}
      <div
        className={cn(
          "relative z-10 flex h-full flex-col items-center justify-center",
          pathname === "/practice" ? "px-0 py-0" : "px-12 py-8"
        )}
      >
        <div
          className={cn(
            "h-full w-full",
            pathname === "/practice" ? "max-w-none" : "mx-auto max-w-[60rem]"
          )}
        >
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-20 border-t border-[var(--tw-home-border)] bg-[var(--tw-home-panel-strong)] backdrop-blur-sm dark:bg-gray-950/95">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center text-sm text-[var(--tw-home-muted)]">
            <p>© 2025 typewars.io</p>
            <p className="mt-2">
              made with ❤️ by{" "}
              <a
                href="https://github.com/Ronald-Prato"
                target="_blank"
                className="text-orange-500"
              >
                Ronald Prato
              </a>
            </p>
          </div>
        </div>
      </footer>

      <GameDrawer
        isOpen={isGameDrawerOpen}
        onOpenChange={setIsGameDrawerOpen}
      />
    </div>
  );
}
