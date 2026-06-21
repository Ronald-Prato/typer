"use client";

import { motion, motionTransitions, popIn } from "@/motion";
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
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={motionTransitions.base}
    >
      <motion.div
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={motionTransitions.base}
      />

      <motion.div
        className="relative w-full max-w-[25rem]"
        variants={popIn}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={motionTransitions.spring}
      >
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-green-400/55 via-cyan-300/45 to-blue-500/55 blur-xl" />

        <div
          className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-green-500 via-cyan-500 to-blue-600 px-7 py-7 shadow-2xl sm:px-9 sm:py-8"
          style={{
            boxShadow:
              "0 24px 60px rgba(15, 23, 42, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.24), inset 0 -1px 0 rgba(0, 0, 0, 0.18)",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.26),transparent_42%)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {!hasAccepted && (
              <div className="mb-7 flex flex-col items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/15 shadow-inner">
                  <span className="size-3 rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.9)]" />
                </div>
                <Text
                  variant="h5"
                  className="text-balance text-white font-extrabold leading-tight drop-shadow-sm"
                >
                  ¡Partida Encontrada!
                </Text>
                <Text variant="body2" className="text-white/80">
                  Preparando partida...
                </Text>
              </div>
            )}

            {hasAccepted ? (
              <motion.div
                className="flex flex-col items-center gap-3 py-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionTransitions.base}
              >
                <Loader2Icon className="size-6 animate-spin text-white" />
                <div className="flex flex-col items-center text-center">
                  <Text variant="h6" className="text-white font-bold">
                    Partida aceptada
                  </Text>
                  <Text variant="body2" className="text-white/80">
                    Esperando oponente
                  </Text>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="grid w-full grid-cols-2 gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionTransitions.base}
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
        </div>
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
      className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/20 px-3 py-3 text-white shadow-sm backdrop-blur-sm transition-colors duration-200 hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-70"
      style={{
        boxShadow:
          "inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
      }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={motionTransitions.fast}
    >
      <Text variant="body2" className="text-white font-bold">
        {label}
      </Text>
      <Text
        variant="caption"
        className="rounded-md border border-white/25 bg-white/15 px-1.5 py-0.5 text-white/90"
      >
        {children}
      </Text>
    </motion.button>
  );
}
