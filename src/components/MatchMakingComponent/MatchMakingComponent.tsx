"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { Text } from "../Typography";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

export function MatchMakingComponent() {
  const router = useRouter();
  const ownUser = useQuery(api.user.getOwnUser);
  const exitQueue = useMutation(api.queue.exitQueue);
  const rejectGame = useMutation(api.game.rejectGame);
  const acceptGame = useMutation(api.game.acceptGame);

  // Get current game data
  const currentGame = useQuery(api.game.getGameData);

  const [seconds, setSeconds] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!ownUser?.queuedAt) return;

    // Calculate initial seconds from queuedAt
    const initialSeconds = Math.max(
      0,
      Math.floor((Date.now() - ownUser.queuedAt) / 1000)
    );
    setSeconds(initialSeconds);

    const interval = setInterval(() => {
      setSeconds((prev) => Math.max(0, prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [ownUser?.queuedAt]);

  const formatTime = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleAcceptGame = () => {
    if (ownUser?.activeGame) {
      setIsAccepting(true);
      startTransition(async () => {
        try {
          await acceptGame({});
        } catch (error) {
          console.error("Error accepting game:", error);
          alert("Error al aceptar la partida");
        } finally {
          setIsAccepting(false);
        }
      });
    }
  };

  const handleRejectGame = () => {
    if (ownUser?.activeGame) {
      startTransition(async () => {
        try {
          await rejectGame();
        } catch (error) {
          console.error("Error rejecting game:", error);
          alert("Error al rechazar la partida");
        }
      });
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detect OS more reliably
      const isMacOS =
        typeof window !== "undefined" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmdOrCtrl = isMacOS ? event.metaKey : event.ctrlKey;

      // Handle Cmd+X for queue exit
      if (event.key.toLowerCase() === "x" && isCmdOrCtrl && ownUser?.queueId) {
        console.log("Cmd/Ctrl+X detected - exiting queue");
        event.preventDefault();
        event.stopPropagation();

        ownUser?.status !== "in_game" &&
          startTransition(async () => {
            await exitQueue();
          });
      }

      // Handle Cmd+Enter for accepting game
      if (event.key === "Enter" && isCmdOrCtrl && ownUser?.activeGame) {
        console.log("Cmd/Ctrl+Enter detected - accepting game");
        event.preventDefault();
        event.stopPropagation();

        setIsAccepting(true);
        ownUser?.status !== "in_game" &&
          startTransition(async () => {
            try {
              await acceptGame({});
            } catch (error) {
              console.error("Error accepting game:", error);
              alert("Error al aceptar la partida");
            } finally {
              setIsAccepting(false);
            }
          });
      }

      // Handle Cmd+X for rejecting game
      if (
        event.key.toLowerCase() === "x" &&
        isCmdOrCtrl &&
        ownUser?.activeGame
      ) {
        console.log("Cmd/Ctrl+X detected - rejecting game");
        event.preventDefault();
        event.stopPropagation();

        ownUser?.status !== "in_game" &&
          startTransition(async () => {
            try {
              await rejectGame();
            } catch (error) {
              console.error("Error rejecting game:", error);
              alert("Error al rechazar la partida");
            }
          });
      }
    };

    // Use capture phase to ensure we catch the event first
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [
    ownUser?.queueId,
    ownUser?.activeGame,
    exitQueue,
    rejectGame,
    ownUser?.status,
  ]);

  // Check if user has already accepted the game
  const hasAccepted = currentGame?.game?.playersAccepted?.includes(
    ownUser?._id as any
  );

  // Effect to redirect when both players accept
  useEffect(() => {
    if (
      currentGame?.game?.playersAccepted &&
      currentGame.game.playersAccepted.length >= 2
    ) {
      router.push("/1v1");
    }
  }, [currentGame?.game?.playersAccepted, router]);

  return !ownUser ? null : ownUser.activeGame &&
    ownUser.status === "game_found" ? (
    // Game Found Component
    <motion.div
      className="fixed top-0 left-0 inset-0 flex items-center justify-center z-50"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        duration: 0.3,
      }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        transition={{
          duration: 0.3,
        }}
      />

      {/* Game Found Card */}
      <motion.div
        className="relative"
        initial={{
          y: -100,
          opacity: 0,
          filter: "blur(20px)",
          scale: 0.5,
          rotateX: -15,
        }}
        animate={{
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          scale: 1,
          rotateX: 0,
        }}
        exit={{
          y: -100,
          opacity: 0,
          filter: "blur(20px)",
          scale: 0.5,
          rotateX: -15,
        }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuart
          scale: {
            duration: 0.4,
            ease: [0.68, -0.55, 0.265, 1.55], // easeOutBack for bounce
          },
        }}
      >
        {/* Animated Aura */}
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={{
            boxShadow: [
              "0 0 30px rgba(34, 197, 94, 0.6)",
              "0 0 40px rgba(59, 130, 246, 0.8)",
              "0 0 30px rgba(34, 197, 94, 0.6)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg px-6 py-4 shadow-lg w-[18rem] relative overflow-hidden"
          style={{
            boxShadow:
              "0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
          animate={{
            scale: [1, 1.02, 1],
            boxShadow: [
              "0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.2)",
              "0 12px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.2)",
              "0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.2)",
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* 3D Relief Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-t-lg" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-b-lg" />

          <div className="relative z-10 flex flex-col items-center space-y-4">
            {/* Title */}
            <motion.div
              className="text-center"
              animate={{
                scale: [1, 1.05, 1],
                textShadow: [
                  "0 0 10px rgba(255, 255, 255, 0.3)",
                  "0 0 20px rgba(255, 255, 255, 0.6)",
                  "0 0 10px rgba(255, 255, 255, 0.3)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {!hasAccepted && (
                <Text variant="subtitle2" className="text-white font-bold">
                  ¡Partida Encontrada!
                </Text>
              )}
            </motion.div>

            {/* Content based on acceptance status */}
            {hasAccepted ? (
              // Accepted state
              <motion.div
                className="flex flex-col items-center space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Loader2Icon className="size-4 text-white animate-spin" />
                <div className="text-center flex flex-col items-center">
                  <Text variant="subtitle2" className="text-white font-bold">
                    Partida aceptada
                  </Text>
                  <Text variant="caption" className="text-white/80">
                    Esperando oponente
                  </Text>
                </div>
              </motion.div>
            ) : (
              // Buttons for accepting/rejecting
              <motion.div
                className="flex space-x-3 w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {/* Reject Button */}
                <motion.button
                  onClick={handleRejectGame}
                  className="flex-1 bg-black/20 backdrop-blur-sm text-white font-medium rounded-lg border border-white/30 hover:bg-black/30 transition-all duration-200 cursor-pointer px-2 flex items-center justify-center space-x-2"
                  style={{
                    boxShadow:
                      "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                      "0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                      "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                    ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <Text
                    variant="caption"
                    className="text-white font-bold scale-95"
                  >
                    Rechazar
                  </Text>
                  <Text variant="caption" className="text-white font-bold">
                    {typeof window !== "undefined" &&
                    navigator.platform.toUpperCase().indexOf("MAC") >= 0
                      ? "⌘X"
                      : "Ctrl X"}
                  </Text>
                </motion.button>
                {/* Accept Button */}
                <motion.button
                  onClick={handleAcceptGame}
                  disabled={isAccepting}
                  className="py-2 flex-1 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-200 cursor-pointer px-2 flex items-center justify-center space-x-2"
                  style={{
                    boxShadow:
                      "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                  }}
                  whileHover={{ scale: isAccepting ? 1 : 1.05 }}
                  whileTap={{ scale: isAccepting ? 1 : 0.95 }}
                  animate={{
                    boxShadow: [
                      "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                      "0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                      "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                    ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  {isAccepting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <Text
                        variant="caption"
                        className="text-white font-bold scale-95"
                      >
                        Aceptar
                      </Text>
                      <Text variant="caption" className="text-white font-bold">
                        {typeof window !== "undefined" &&
                        navigator.platform.toUpperCase().indexOf("MAC") >= 0
                          ? "⌘ ↵"
                          : "Ctrl ↵"}
                      </Text>
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  ) : null;
}
