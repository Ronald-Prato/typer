"use client";
import { useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { Text } from "@/components";
import Link from "next/link";
import { MatchMakingComponent } from "@/components/MatchMakingComponent/MatchMakingComponent";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import { MainTabs } from "@/components/MainTabs/MainTabs";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GameDrawer } from "@/components/GameDrawer";
import { useRouter } from "next/navigation";
import { useOS } from "@/hooks";
import { Bell } from "lucide-react";
import { Notifications } from "@/components/Notifications";

export default function MainLayout({
  children,
  withOutImage = false,
}: {
  children: React.ReactNode;
  withOutImage?: boolean;
}) {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const dbUser = useQuery(api.user.getOwnUser);
  const headerControls = useAnimation();
  const [currentAuraColor, setCurrentAuraColor] = useState<string>("none");
  const [isGameDrawerOpen, setIsGameDrawerOpen] = useState(false);

  const { isMacOS } = useOS();
  const keyboardShortcut = isMacOS ? "⌘ I" : "Ctrl I";

  // Control header animations based on user state
  useEffect(() => {
    if (dbUser?.queueId) {
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
  }, [dbUser?.queueId, headerControls, currentAuraColor]);

  // Simple avatar component
  const AvatarDisplay = () => {
    if (!isSignedIn || !dbUser) {
      return (
        <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!dbUser.avatar) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-105 transition-transform duration-200">
          {dbUser.nickname
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?"}
        </div>
      );
    }

    return (
      <button
        onClick={() => setIsGameDrawerOpen(true)}
        className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden flex items-center justify-center relative cursor-pointer hover:scale-105 transition-transform duration-200"
      >
        <div
          dangerouslySetInnerHTML={{ __html: dbUser.avatar }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: "scale(1)" }}
        />
      </button>
    );
  };

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
      <div className="relative h-full z-10 px-12 py-8 flex flex-col items-center justify-center">
        <div className="w-full h-full max-w-[60rem] mx-auto">{children}</div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950/95 backdrop-blur-sm border-t border-gray-800/50  relative z-20">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center text-gray-400 text-sm">
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
