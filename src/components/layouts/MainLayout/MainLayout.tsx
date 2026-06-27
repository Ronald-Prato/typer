"use client";
import { useUser } from "@clerk/nextjs";
import { Text } from "@/components";
import Link from "next/link";
import { MatchMakingComponent } from "@/components/MatchMakingComponent/MatchMakingComponent";
import { motion, useAnimation } from "@/motion";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { MainTabs } from "@/components/MainTabs/MainTabs";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { GameDrawer } from "@/components/GameDrawer";
import { ThemeModeControl } from "@/components/ThemeModeControl/ThemeModeControl";
import { useOS } from "@/hooks";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Notifications } from "@/components/Notifications";
import { TypocoinBalance } from "@/components/Currency";
import {
  HomeBackground,
  HomeBackgroundDashProvider,
} from "@/components/layouts/HomeBackground";
import { MainLayoutChromeContext } from "./MainLayoutChromeContext";
import { getTypocoinBalanceFromUser } from "@/domain/currency";
import { getQueuedHomeGameModeTitle } from "@/domain/homeGameMode";
import { useAnimatedThemeChange } from "@/hooks/useAnimatedThemeChange";
import { useThemeKeyboardShortcuts } from "@/hooks/useThemeKeyboardShortcuts";
import { CompactQueueIndicator } from "./CompactQueueIndicator";
import {
  HomeProfileButton,
  SmallProfileAvatarButton,
} from "./MainLayoutProfileControls";

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
  const { theme, setTheme } = useTheme();
  const setThemeWithAnimation = useAnimatedThemeChange(setTheme);
  const headerControls = useAnimation();
  const [currentAuraColor, setCurrentAuraColor] = useState<string>("none");
  const [isEmbeddedGameChromeHidden, setIsEmbeddedGameChromeHidden] =
    useState(false);
  const [isGameDrawerOpen, setIsGameDrawerOpen] = useState(false);
  const [queueSeconds, setQueueSeconds] = useState(0);

  const { isMacOS } = useOS();
  const keyboardShortcut = isMacOS ? "⌘ I" : "Ctrl I";
  const exitQueueShortcut = isMacOS ? "⌘ X" : "Ctrl+X";
  const isInQueue = dbUser?.status === "in_queue";
  const queuedModeTitle = getQueuedHomeGameModeTitle(dbUser?.queuedMode);
  const currentHomeTab = searchParams.get("tab") || "home";
  const highestPracticeWpm = dbUser?.highestPracticeWpm ?? 0;
  const typocoinBalance = getTypocoinBalanceFromUser(dbUser);
  const isPracticeSurface =
    pathname === "/practice" ||
    (pathname === "/home" && searchParams.get("tab") === "practice");
  const isClassicSurface = pathname === "/1v1";
  const isScrollSurface = pathname === "/scroll";
  const isShopSurface = pathname === "/shop";
  const isDedicatedGameSurface = pathname === "/1v1" || pathname === "/scroll";
  const isHomeGameSurface = isClassicSurface || isScrollSurface;
  const isHomeSystemSurface =
    isPracticeSurface || isHomeGameSurface || isShopSurface;
  const isGameChromeHidden =
    isDedicatedGameSurface || isEmbeddedGameChromeHidden;
  const shouldShowHomeHeaderControls = !isGameChromeHidden;
  const showCompactQueueIndicator =
    (pathname === "/home" && currentHomeTab !== "home" && isInQueue) ||
    (isGameChromeHidden && isInQueue);
  const layoutChromeContextValue = useMemo(
    () => ({
      setIsGameChromeHidden: setIsEmbeddedGameChromeHidden,
    }),
    []
  );

  useThemeKeyboardShortcuts({
    enabled: pathname === "/home",
    onThemeChange: setThemeWithAnimation,
  });

  useEffect(() => {
    setIsEmbeddedGameChromeHidden(false);
  }, [currentHomeTab, pathname]);

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

  if (pathname === "/home" || isShopSurface) {
    return (
      <MainLayoutChromeContext.Provider value={layoutChromeContextValue}>
        <HomeBackgroundDashProvider>
          <div className="relative h-screen overflow-hidden bg-[var(--tw-home-bg)] text-[var(--tw-home-fg)]">
            <HomeBackground />

            {<MatchMakingComponent />}

            <header className="fixed left-0 right-0 top-0 z-30 grid h-24 grid-cols-[minmax(0,1fr)_auto] items-center gap-6 px-10">
              <div className="flex min-w-0 items-center gap-5 justify-self-start">
                <Link href="/home" className="shrink-0">
                  <h1 className="text-2xl font-extrabold tracking-tight text-[var(--tw-home-fg)]">
                    typewars.io
                  </h1>
                </Link>
                {shouldShowHomeHeaderControls && (
                  <>
                    <ThemeModeControl
                      theme={theme}
                      onThemeChange={setThemeWithAnimation}
                    />
                    <div className="h-full w-fit shrink-0">
                      <MainTabs variant="horizontal" />
                    </div>
                  </>
                )}
              </div>

              {isGameChromeHidden && isInQueue && (
                <div className="justify-self-end">
                  <CompactQueueIndicator
                    exitQueueShortcut={exitQueueShortcut}
                    isVisible={showCompactQueueIndicator}
                    queueSeconds={queueSeconds}
                    queuedModeTitle={queuedModeTitle}
                  />
                </div>
              )}

              {shouldShowHomeHeaderControls && (
                <div className="flex items-center gap-3 justify-self-end">
                  <CompactQueueIndicator
                    exitQueueShortcut={exitQueueShortcut}
                    isVisible={showCompactQueueIndicator}
                    queueSeconds={queueSeconds}
                    queuedModeTitle={queuedModeTitle}
                  />
                  <TypocoinBalance amount={typocoinBalance} showLabel={false} />
                  <HomeProfileButton
                    highestPracticeWpm={highestPracticeWpm}
                    isSignedIn={isSignedIn}
                    onOpenProfile={() => setIsGameDrawerOpen(true)}
                    user={dbUser}
                  />
                </div>
              )}
            </header>

            <main className="relative z-10 h-screen overflow-hidden">
              <div
                className={cn(
                  "flex h-full min-h-0 items-center justify-center px-10",
                  isGameChromeHidden ? "pt-0" : "pt-24"
                )}
              >
                <div
                  className={cn(
                    "h-full min-h-0 w-full",
                    isShopSurface ? "max-w-[92rem]" : "max-w-[72rem]"
                  )}
                >
                  {children}
                </div>
              </div>
            </main>

            {shouldShowHomeHeaderControls && (
              <GameDrawer
                isOpen={isGameDrawerOpen}
                onOpenChange={setIsGameDrawerOpen}
              />
            )}
          </div>
        </HomeBackgroundDashProvider>
      </MainLayoutChromeContext.Provider>
    );
  }

  return (
    <MainLayoutChromeContext.Provider value={layoutChromeContextValue}>
      <div
        className={cn(
          "relative",
          isGameChromeHidden
            ? "h-screen overflow-hidden"
            : "grid min-h-screen",
          isHomeSystemSurface
            ? "bg-[var(--tw-home-bg)] text-[var(--tw-home-fg)]"
            : "bg-gray-950 text-white",
          !isGameChromeHidden &&
            (pathname === "/home"
              ? "grid-rows-[80px_1fr_100px]"
              : "grid-rows-[1fr_100px]")
        )}
      >
        {isHomeGameSurface && <HomeBackground variant="practice" />}

        {isGameChromeHidden && (
          <header className="fixed left-0 right-0 top-0 z-30 flex h-24 items-center justify-between px-10">
            <Link href="/home" className="shrink-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--tw-home-fg)]">
                typewars.io
              </h1>
            </Link>
            {isInQueue && (
              <CompactQueueIndicator
                exitQueueShortcut={exitQueueShortcut}
                isVisible={showCompactQueueIndicator}
                queueSeconds={queueSeconds}
                queuedModeTitle={queuedModeTitle}
              />
            )}
          </header>
        )}

        {!isGameChromeHidden && pathname === "/home" && (
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

                  <SmallProfileAvatarButton
                    isSignedIn={isSignedIn}
                    onOpenProfile={() => setIsGameDrawerOpen(true)}
                    user={dbUser}
                  />
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
            isGameChromeHidden
              ? "px-0 py-0"
              : isHomeSystemSurface
                ? "px-0 py-0"
                : "px-12 py-8"
          )}
        >
          <div
            className={cn(
              "h-full w-full",
              isHomeSystemSurface || isGameChromeHidden
                ? "max-w-none"
                : "mx-auto max-w-[60rem]"
            )}
          >
            {children}
          </div>
        </div>

        {!isGameChromeHidden && (
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
        )}

        {!isGameChromeHidden && (
          <GameDrawer
            isOpen={isGameDrawerOpen}
            onOpenChange={setIsGameDrawerOpen}
          />
        )}
      </div>
    </MainLayoutChromeContext.Provider>
  );
}
