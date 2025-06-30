"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Exercise {
  code: string;
  language: string;
  difficulty: "easy" | "medium" | "hard";
}

interface FindTheBugProps {
  exercise?: Exercise;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function FindTheBug({
  exercise = {
    code: `function calculateTotal(items) {
  let total = 0;
  
  for (let i = 0; i <= items.length; i++) {
    total += items[i].price;
  }
  
  return total;
}

// Test the function
const items = [
  { name: "Apple", price: 1.50 },
  { name: "Banana", price: 0.75 },
  { name: "Orange", price: 2.00 }
];

console.log("Total:", calculateTotal(items));`,
    language: "javascript",
    difficulty: "easy",
  },
  onSuccess,
  onError,
}: FindTheBugProps) {
  const [code, setCode] = useState(exercise.code);
  const [isChecking, setIsChecking] = useState(false);
  const [currentError, setCurrentError] = useState<string>("");
  const [isMac, setIsMac] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  // Get initial error on component mount and detect platform
  useEffect(() => {
    // Detect if user is on Mac
    setIsMac(navigator.platform?.includes("Mac") || false);

    try {
      const wrappedCode = `
        (function() {
          const console = {
            log: function(...args) {
              return args.join(' ');
            }
          };
          
          ${exercise.code}
          
          return true;
        })();
      `;

      eval(wrappedCode);
    } catch (error: any) {
      setCurrentError(error.message);
    }
  }, [exercise.code]);

  const checkCode = useCallback(async () => {
    setIsChecking(true);

    try {
      // Create a new function with the user's code
      const wrappedCode = `
        (function() {
          const console = {
            log: function(...args) {
              // Capture console.log output
              return args.join(' ');
            }
          };
          
          ${code}
          
          return true; // If we reach here, code executed successfully
        })();
      `;

      // Execute the code
      const result = eval(wrappedCode);

      if (result) {
        setCurrentError(""); // Clear error if code runs successfully
        setShowSuccess(true); // Show success animation

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 1000);

        // Call success callback
        onSuccess?.();
      }
    } catch (error: any) {
      setCurrentError(error.message); // Update current error
      setShowSuccess(false); // Hide success if there's an error
      setShowError(true); // Show error animation

      setTimeout(() => {
        setShowError(false);
      }, 500);

      // Call error callback
      onError?.(error.message);
    } finally {
      setIsChecking(false);
    }
  }, [code, onSuccess, onError]);

  // Add keyboard shortcut for verification (Ctrl/Cmd + O + K)
  useEffect(() => {
    let keySequence: string[] = [];
    let isModifierPressed = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl or Cmd is pressed
      if (event.ctrlKey || event.metaKey) {
        isModifierPressed = true;

        // Add the key to sequence if modifier is pressed
        if (
          event.key.toLowerCase() === "o" ||
          event.key.toLowerCase() === "k"
        ) {
          event.preventDefault();
          keySequence.push(event.key.toLowerCase());

          // Check if we have the complete sequence: o, k
          if (
            keySequence.length === 2 &&
            keySequence[0] === "o" &&
            keySequence[1] === "k"
          ) {
            if (!isChecking) {
              checkCode();
            }
            keySequence = []; // Reset sequence
          }

          // Reset sequence if it gets too long or wrong
          if (
            keySequence.length > 2 ||
            (keySequence.length === 1 && keySequence[0] !== "o")
          ) {
            keySequence = [];
          }
        }
      } else {
        // Reset when modifier is released
        isModifierPressed = false;
        keySequence = [];
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Reset when modifier keys are released
      if (!event.ctrlKey && !event.metaKey) {
        isModifierPressed = false;
        keySequence = [];
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isChecking, checkCode]);

  const resetCode = () => {
    setCode(exercise.code);
    setShowSuccess(false); // Hide success message
    setShowError(false); // Hide error message

    // Reset to initial error
    try {
      const wrappedCode = `
        (function() {
          const console = {
            log: function(...args) {
              return args.join(' ');
            }
          };
          
          ${exercise.code}
          
          return true;
        })();
      `;

      eval(wrappedCode);
      setCurrentError(""); // Clear if no error
    } catch (error: any) {
      setCurrentError(error.message);
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-orange-400">
            Código {exercise.language}
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              exercise.difficulty === "easy"
                ? "bg-green-900/30 text-green-400 border border-green-800"
                : exercise.difficulty === "medium"
                  ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                  : "bg-red-900/30 text-red-400 border border-red-800"
            }`}
          >
            {exercise.difficulty === "easy"
              ? "Fácil"
              : exercise.difficulty === "medium"
                ? "Medio"
                : "Difícil"}
          </span>
        </div>
        <div className="text-sm">
          <p className="text-gray-400 mb-2">
            {currentError
              ? "Error detectado en el código:"
              : "Estado del código:"}
          </p>
          <p
            className={`font-mono p-2 rounded border ${
              currentError
                ? "text-red-400 bg-red-900/20 border-red-800"
                : "text-green-400 bg-green-900/20 border-green-800"
            }`}
          >
            {currentError || "✅ Código sin errores detectados"}
          </p>
        </div>
      </div>

      <div className="border border-gray-700 rounded-md overflow-hidden relative">
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-[300px] absolute top-0 left-0 z-50 bg-gray-700/5 backdrop-blur-md flex items-center justify-center"
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  duration: 0.3,
                }}
                className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-4 rounded-xl shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                    }}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                      delay: 0.2,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <div className="text-xl font-bold">¡Correcto!</div>
                    <div className="text-sm opacity-90">Código sin errores</div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-[300px] absolute top-0 left-0 z-50 bg-gray-700/5 backdrop-blur-md flex items-center justify-center"
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 25,
                  duration: 0.1, // Más rápido que success
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-xl shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.05, // Más rápido
                      type: "spring",
                      stiffness: 600,
                      damping: 20,
                    }}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                      delay: 0.1, // Más rápido
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                    }}
                  >
                    <div className="text-xl font-bold">Error</div>
                    <div className="text-sm opacity-90">Código con errores</div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <CodeMirror
          autoFocus
          value={code}
          height="300px"
          theme={oneDark}
          extensions={[
            javascript({ jsx: false }),
            // Custom keymap to prevent Ctrl+O+K/Cmd+O+K from default behavior
            keymap.of([
              {
                key: "Ctrl-o",
                preventDefault: true,
                run: () => true, // Return true to prevent default behavior
              },
              {
                key: "Cmd-o",
                preventDefault: true,
                run: () => true, // Return true to prevent default behavior
              },
              {
                key: "Ctrl-k",
                preventDefault: true,
                run: () => true, // Return true to prevent default behavior
              },
              {
                key: "Cmd-k",
                preventDefault: true,
                run: () => true, // Return true to prevent default behavior
              },
            ]),
          ]}
          onChange={(value) => setCode(value)}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: false,
          }}
        />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex gap-4">
          <Button
            onClick={checkCode}
            loading={isChecking}
            className="px-6 flex items-center gap-2"
          >
            <span>Compilar</span>
            <span className="text-xs opacity-70 flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-black/30 border border-white/20 rounded text-xs">
                {isMac ? "⌘" : "Ctrl"}
              </kbd>
              <span>+</span>
              <kbd className="px-1 py-0.5 bg-black/30 border border-white/20 rounded text-xs">
                "OK"
              </kbd>
            </span>
          </Button>
          <Button variant="outline" onClick={resetCode} className="px-6">
            Reiniciar Código
          </Button>
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <span>💡</span>
          <span>
            Tip: También puedes usar el shortcut{" "}
            <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs">
              {isMac ? "⌘" : "Ctrl"}
            </kbd>{" "}
            +{" "}
            <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs">
              "OK"
            </kbd>{" "}
            para compilar desde cualquier parte
          </span>
        </p>
      </div>
    </div>
  );
}
