"use client";

import { motion } from "@/motion";
import { Loader2, Loader2Icon } from "lucide-react";
import { Text } from "../Typography";
import { isMacPlatform } from "@/domain/shortcuts";

interface MatchFoundOverlayProps {
  hasAccepted: boolean;
  isAccepting: boolean;
  onAcceptGame: () => void;
  onRejectGame: () => void;
}

const shortcutPlatform = () =>
  typeof navigator === "undefined" ? "" : navigator.platform;

export function MatchFoundOverlay({
  hasAccepted,
  isAccepting,
  onAcceptGame,
  onRejectGame,
}: MatchFoundOverlayProps) {
  const isMac = isMacPlatform(shortcutPlatform());

  return (
    <motion.div
      className="fixed top-0 left-0 inset-0 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

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
          ease: [0.25, 0.46, 0.45, 0.94],
          scale: { duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] },
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={{
            boxShadow: [
              "0 0 30px rgba(34, 197, 94, 0.6)",
              "0 0 40px rgba(59, 130, 246, 0.8)",
              "0 0 30px rgba(34, 197, 94, 0.6)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-t-lg" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-b-lg" />

          <div className="relative z-10 flex flex-col items-center space-y-4">
            {!hasAccepted && (
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
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Text variant="subtitle2" className="text-white font-bold">
                  ¡Partida Encontrada!
                </Text>
              </motion.div>
            )}

            {hasAccepted ? (
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
              <motion.div
                className="flex space-x-3 w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <MatchActionButton onClick={onRejectGame} label="Rechazar">
                  {isMac ? "⌘X" : "Ctrl X"}
                </MatchActionButton>
                <MatchActionButton
                  onClick={onAcceptGame}
                  label="Aceptar"
                  disabled={isAccepting}
                >
                  {isAccepting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isMac ? (
                    "⌘ ↵"
                  ) : (
                    "Ctrl ↵"
                  )}
                </MatchActionButton>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function MatchActionButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className="py-2 flex-1 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-200 cursor-pointer px-2 flex items-center justify-center space-x-2 disabled:cursor-not-allowed disabled:opacity-70"
      style={{
        boxShadow:
          "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
      }}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      animate={{
        boxShadow: [
          "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
          "0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
          "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
        ],
      }}
      transition={{
        boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <Text variant="caption" className="text-white font-bold scale-95">
        {label}
      </Text>
      <Text variant="caption" className="text-white font-bold">
        {children}
      </Text>
    </motion.button>
  );
}
