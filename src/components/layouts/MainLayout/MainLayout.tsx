"use client";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Avatar, Text } from "@/components";
import Link from "next/link";
import { MatchMakingComponent } from "@/components/MatchMakingComponent/MatchMakingComponent";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

export default function MainLayout({
  children,
  withOutImage = false,
}: {
  children: React.ReactNode;
  withOutImage?: boolean;
}) {
  const { isSignedIn } = useUser();
  const dbUser = useQuery(api.user.getOwnUser);
  const headerControls = useAnimation();
  const [currentAuraColor, setCurrentAuraColor] = useState<string>("none");

  // Detect OS for keyboard shortcut display
  const isMacOS =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const keyboardShortcut = isMacOS ? "⌘ I" : "Ctrl I";

  // Control header animations based on user state
  useEffect(() => {
    if (dbUser?.activeGame) {
      setCurrentAuraColor("green-blue");
      // Game found - gradual appearance with growth effect
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
    } else if (dbUser?.queueId) {
      setCurrentAuraColor("orange-red");
      // In queue - gradual appearance
      headerControls
        .start({
          y: 0,
          boxShadow: [
            "0 0 0px rgba(249, 115, 22, 0)",
            "0 0 10px rgba(249, 115, 22, 0.2)",
            "0 0 20px rgba(239, 68, 68, 0.3)",
            "0 0 30px rgba(249, 115, 22, 0.4)",
            "0 0 40px rgba(239, 68, 68, 0.5)",
            "0 0 50px rgba(249, 115, 22, 0.6)",
            "0 0 60px rgba(239, 68, 68, 0.7)",
          ],
          transition: {
            y: { duration: 0.8, ease: "easeOut" },
            boxShadow: { duration: 2.5, ease: "easeOut" },
          },
        })
        .then(() => {
          // Start pulsing animation after fade-in
          headerControls.start({
            boxShadow: [
              "0 0 60px rgba(249, 115, 22, 0.6)",
              "0 0 90px rgba(239, 68, 68, 0.7)",
              "0 0 60px rgba(249, 115, 22, 0.6)",
            ],
            transition: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          });
        });
    } else {
      // No state - gradual removal with current color preservation
      let fadeOutColor = "rgba(0, 0, 0, 0)";

      if (currentAuraColor === "green-blue") {
        fadeOutColor = "rgba(34, 197, 94, 0.6)";
      } else if (currentAuraColor === "orange-red") {
        fadeOutColor = "rgba(249, 115, 22, 0.6)";
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
          boxShadow: { duration: 2, ease: "easeOut" },
        },
      });

      setCurrentAuraColor("none");
    }
  }, [dbUser?.activeGame, dbUser?.queueId, headerControls, currentAuraColor]);

  return (
    <div className="min-h-screen bg-gray-950 text-white relative grid grid-rows-[80px_1fr_100px]">
      <motion.header
        className="bg-gray-950/95 backdrop-blur-sm border-b border-gray-800/50 relative z-20 h-20"
        initial={{
          y: -10,
          boxShadow: "0 0 0px rgba(0, 0, 0, 0)",
        }}
        animate={headerControls}
      >
        <div className="container mx-auto px-6 py-4 h-full">
          <div className="flex items-center justify-between h-full">
            <Link href="/home">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-white">typewars.io</h1>
              </div>
            </Link>

            {/* Fixed position for MatchMakingComponent */}
            {
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <MatchMakingComponent />
              </div>
            }

            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <Text variant="caption">{dbUser?.nickname}</Text>

              {isSignedIn && <Avatar size="sm" />}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Fixed centered isometric image - behind everything */}

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
    </div>
  );
}
