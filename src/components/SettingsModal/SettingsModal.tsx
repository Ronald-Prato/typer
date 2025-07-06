"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  content: React.ReactNode;
}

export function SettingsModal({
  children,
  isOpen,
  onOpenChange,
  content,
}: SettingsModalProps) {
  // Detect OS for keyboard shortcut display
  const isMacOS =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+I (macOS) or Ctrl+I (other systems)
      const isCmdOrCtrl = isMacOS ? event.metaKey : event.ctrlKey;

      if (isCmdOrCtrl && event.key === "i") {
        event.preventDefault();
        onOpenChange(!isOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isMacOS, onOpenChange]);

  return (
    <>
      <div onClick={() => onOpenChange(true)}>{children}</div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => onOpenChange(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-gray-900 border-l border-gray-700 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="border-b border-gray-700 bg-gray-900 p-6">
                <h2 className="text-white text-lg font-semibold">
                  Configuración
                </h2>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 space-y-6 bg-gray-900 overflow-y-auto">
                {content}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
