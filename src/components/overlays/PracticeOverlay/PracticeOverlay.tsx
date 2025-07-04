"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Text } from "@/components/Typography";
import { Button } from "@/components/ui/button";

interface PracticeOverlayProps {
  isVisible: boolean;
  onStart: () => void;
}

export function PracticeOverlay({ isVisible, onStart }: PracticeOverlayProps) {
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center backdrop-blur-[3px] bg-gray-900/5 rounded-lg z-10"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="flex flex-col items-center space-y-4"
          >
            <Button
              onClick={onStart}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-8 px-6 rounded-md shadow-lg transition-all duration-200 flex items-center space-x-4"
              style={{
                boxShadow: `
                  0 10px 25px rgba(234, 88, 12, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `,
              }}
            >
              <Text variant="h6" className="text-white font-bold">
                Empezar Práctica
              </Text>
              {/* Enter Key */}
              <div
                className="w-12 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
                style={{
                  boxShadow:
                    "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                }}
              >
                ENTER
              </div>
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
