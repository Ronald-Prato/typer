"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Text } from "@/components/Typography";

interface PracticeOverlayProps {
  isVisible: boolean;
  onStart: () => void;
}

export function PracticeOverlay({ isVisible, onStart }: PracticeOverlayProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isVisible) return;

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  // Separate effect to handle when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isVisible) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        onStart();
      }, 0);
    }
  }, [countdown, isVisible, onStart]);

  useEffect(() => {
    if (!isVisible) return;

    // Listen for Enter key
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        onStart();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isVisible, onStart]);

  useEffect(() => {
    // Reset countdown when overlay becomes visible
    if (isVisible) {
      setCountdown(5);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-gray-950/30"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{
              duration: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="relative bg-gradient-to-br from-gray-800/40 via-gray-900/30 to-gray-800/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 shadow-2xl max-w-md w-full mx-4"
            style={{
              boxShadow: `
                0 32px 64px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2),
                0 0 0 1px rgba(255, 255, 255, 0.05)
              `,
            }}
          >
            {/* Gradient overlay for neomorphism effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-3xl pointer-events-none" />

            <div className="relative z-10 text-center space-y-8">
              {/* Title */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <Text
                  variant="h4"
                  className="font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
                >
                  Modo práctica
                </Text>
              </motion.div>

              {/* Start Button */}
              <button
                onClick={onStart}
                className="cursor-pointer group relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-200 flex items-center space-x-4 mx-auto"
                style={{
                  boxShadow: `
                    0 10px 25px rgba(234, 88, 12, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                  `,
                }}
              >
                <Text variant="h6" className="text-white font-bold">
                  Empezar
                </Text>

                {/* Enter Key Symbol */}
                <div className="bg-white/20 rounded-lg p-2 group-hover:bg-white/30 transition-colors">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7h-2z" />
                  </svg>
                </div>

                {/* Countdown Badge */}
                {countdown > 0 && (
                  <motion.div
                    key={countdown}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-3 -right-3 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border-2 border-orange-500"
                  >
                    {countdown}
                  </motion.div>
                )}
              </button>

              {/* Instructions */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="space-y-2 flex flex-col items-center"
              >
                <Text variant="body2" className="text-gray-400">
                  Presiona{" "}
                  <kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-sm">
                    Enter
                  </kbd>{" "}
                  o haz clic para comenzar
                </Text>
                <Text variant="body2" className="text-gray-500">
                  Inicio automático en {countdown} segundos
                </Text>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
