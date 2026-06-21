"use client";
import { useUser } from "@clerk/nextjs";
import { Text } from "@/components";
import Link from "next/link";
import { MatchMakingComponent } from "@/components/MatchMakingComponent/MatchMakingComponent";
import {
  AnimatePresence,
  fadeIn,
  m,
  motion,
  motionTransitions,
  useAnimation,
} from "@/motion";
import { Suspense, useEffect, useState } from "react";
import { MainTabs } from "@/components/MainTabs/MainTabs";
import { usePathname, useSearchParams } from "next/navigation";
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
import { getQueuedHomeGameModeTitle } from "@/domain/homeGameMode";

type MainLayoutProps = {
  children: React.ReactNode;
};

function MainLayoutFallback() {
  return <div className="min-h-screen bg-gray-950 text-white" />;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <Suspense fallback={<MainLayoutFallback />}>
      <MainLayoutContent>{children}</MainLayoutContent>
    </Suspense>
  );
}

function MainLayoutContent({
  children,
}: MainLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();
  const dbUser = useCurrentUser();
  const headerControls = useAnimation();
  const [currentAuraColor, setCurrentAuraColor] = useState<string>("none");
  const [isGameDrawerOpen, setIsGameDrawerOpen] = useState(false);
  const [queueSeconds, setQueueSeconds] = useState(0);

  const { isMacOS } = useOS();
  const keyboardShortcut = isMacOS ? "⌘ I" : "Ctrl I";
  const exitQueueShortcut = isMacOS ? "⌘ X" : "Ctrl+X";
  const isInQueue = dbUser?.status === "in_queue";
  const queuedModeTitle = getQueuedHomeGameModeTitle(dbUser?.queuedMode);
  const currentHomeTab = searchParams.get("tab") || "home";
  const showCompactQueueIndicator =
    pathname === "/home" && currentHomeTab !== "home" && isInQueue;
  const highestPracticeWpm = dbUser?.highestPracticeWpm ?? 0;
  const isPracticeSurface =
    pathname === "/practice" ||
    (pathname === "/home" && searchParams.get("tab") === "practice");
  const isScrollSurface = pathname === "/scroll";
  const isHomeSystemSurface = isPracticeSurface || isScrollSurface;

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

  useEffect(() => {
    if (!dbUser?.queuedAt || !isInQueue) {
      setQueueSeconds(0);
      return;
    }

    const queuedAt = dbUser.queuedAt;
    const getElapsedSeconds = () =>
      Math.max(0, Math.floor((Date.now() - queuedAt) / 1000));

    setQueueSeconds(getElapsedSeconds());

    const interval = window.setInterval(() => {
      setQueueSeconds(getElapsedSeconds());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [dbUser?.queuedAt, isInQueue]);

  const formatQueueTime = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

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

  const CompactQueueIndicator = () => (
    <AnimatePresence initial={false}>
      {showCompactQueueIndicator ? (
        <m.div
          animate="animate"
          aria-label={`Sigues en cola en modo ${queuedModeTitle}`}
          className="flex items-center gap-3 rounded-full border border-emerald-300/45 bg-gradient-to-r from-emerald-400/22 to-blue-500/18 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-emerald-700 shadow-[0_0_28px_rgba(16,185,129,0.2),0_0_26px_rgba(59,130,246,0.12)] backdrop-blur-xl dark:text-emerald-100"
          exit="exit"
          initial="initial"
          role="status"
          transition={motionTransitions.base}
          variants={fadeIn}
        >
          <span
            className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]"
            aria-hidden="true"
          />
          <span>En cola</span>
          <span className="rounded-md border border-emerald-300/30 bg-white/25 px-1.5 py-0.5 text-[0.65rem] font-black leading-none text-emerald-800 dark:border-white/10 dark:bg-white/10 dark:text-emerald-100">
            {queuedModeTitle}
          </span>
          <span className="font-black text-blue-700 tabular-nums dark:text-blue-100">
            {formatQueueTime(queueSeconds)}
          </span>
          <span className="rounded-md border border-emerald-300/40 bg-white/35 px-1.5 py-0.5 text-[0.65rem] font-black leading-none text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] dark:border-white/15 dark:bg-white/10 dark:text-emerald-100">
            {exitQueueShortcut}
          </span>
          <span className="sr-only">para salir de la cola</span>
        </m.div>
      ) : null}
    </AnimatePresence>
  );

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

            <div className="flex items-center gap-3 justify-self-end">
              <CompactQueueIndicator />
              <button
                onClick={() => setIsGameDrawerOpen(true)}
                className="flex min-w-[11.75rem] items-center gap-3 rounded-full border border-white/45 bg-white/35 px-3 py-2 shadow-[0_10px_34px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl backdrop-saturate-150 transition-transform hover:scale-[1.02] dark:border-white/15 dark:bg-white/[0.09] dark:shadow-[0_14px_42px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.14)]"
                type="button"
                aria-label="Abrir perfil"
              >
                {isSignedIn && dbUser ? (
                  <span className="rounded-full border border-orange-500 p-1 shadow-[0_0_14px_rgba(249,115,22,0.26)]">
                    <UserAvatarImage
                      avatarUrl={dbUser.avatarUrl}
                      avatarSeed={dbUser.avatarSeed}
                      nickname={dbUser.nickname}
                      className="w-10 h-10"
                    />
                  </span>
                ) : (
                  <span className="flex w-12 h-12 items-center justify-center rounded-full border border-orange-500 bg-gray-800 shadow-[0_0_14px_rgba(249,115,22,0.26)]">
                    <span className="w-5 h-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  </span>
                )}
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
            </div>
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
        "min-h-screen relative grid",
        isHomeSystemSurface
          ? "bg-[var(--tw-home-bg)] text-[var(--tw-home-fg)]"
          : "bg-gray-950 text-white",
        pathname === "/home"
          ? "grid-rows-[80px_1fr_100px]"
          : "grid-rows-[1fr_100px]"
      )}
    >
      {isScrollSurface && <HomeBackground variant="practice" />}

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
          isHomeSystemSurface ? "px-0 py-0" : "px-12 py-8"
        )}
      >
        <div
          className={cn(
            "h-full w-full",
            isHomeSystemSurface ? "max-w-none" : "mx-auto max-w-[60rem]"
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
