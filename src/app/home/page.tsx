"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Text } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";

export default function HomePage() {
  const [selectedMode, setSelectedMode] = useState("");
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // const createGame = useMutation(api.game.createGame);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleStart = useCallback(() => {
    if (selectedMode === "practice") {
      router.push("/practice");
    } else if (selectedMode === "1v1") {
      router.push("/1v1");
    } else if (selectedMode === "tournament") {
      router.push("/tournament");
    }
  }, [selectedMode, router]);

  // Listen for number keys and space
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "1") {
        setSelectedMode("practice");
      } else if (event.key === "2") {
        setSelectedMode("1v1");
      } else if (event.key === "3") {
        setSelectedMode("tournament");
      } else if (event.key === " " && selectedMode) {
        event.preventDefault(); // Prevent page scroll
        handleStart();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [selectedMode, handleStart]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Will redirect to login
  }

  return (
    <div className="h-full text-white relative flex flex-col items-center">
      {/* Keyboard Hint */}
      <div className="text-center mb-6">
        <Text variant="body2" className="text-gray-500">
          Usa las teclas{" "}
          <kbd className="px-2 py-1 bg-gray-700/50 text-gray-200 rounded text-sm mx-1">
            1
          </kbd>
          <kbd className="px-2 py-1 bg-gray-700/50 text-gray-200 rounded text-sm mx-1">
            2
          </kbd>
          <kbd className="px-2 py-1 bg-gray-700/50 text-gray-200 rounded text-sm mx-1">
            3
          </kbd>
          para seleccionar y{" "}
          <kbd className="px-3 py-1 bg-gray-700/50 text-gray-200 rounded text-sm mx-1">
            Space
          </kbd>
          para empezar
        </Text>
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Practice Modes */}
        <div className="grid grid-cols-3 gap-6">
          <button
            className={`relative max-w-[20rem] w-full flex flex-col items-start justify-center bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border cursor-pointer transition-all duration-100 hover:scale-105 hover:bg-gray-900 ${
              selectedMode === "practice"
                ? "border-orange-500 bg-gray-800/90"
                : "border-gray-700 hover:border-gray-600"
            }`}
            onClick={() => {
              setSelectedMode("practice");
            }}
          >
            {/* Keyboard Key */}
            <div
              className="absolute top-2 right-2 w-6 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
              style={{
                boxShadow:
                  "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              1
            </div>
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2 text-white">Práctica</h3>
            <p className="text-gray-400 text-sm mb-3 text-left">
              Mejora tus habilidades de escritura practicando solo
            </p>
          </button>

          <button
            className={`relative max-w-[20rem] flex flex-col items-start justify-center bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border cursor-pointer transition-all duration-100 hover:scale-105 hover:bg-gray-900 ${
              selectedMode === "1v1"
                ? "border-orange-500 bg-gray-800/90"
                : "border-gray-700 hover:border-gray-600"
            }`}
            onClick={() => {
              setSelectedMode("1v1");
            }}
          >
            {/* Keyboard Key */}
            <div
              className="absolute top-2 right-2 w-6 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
              style={{
                boxShadow:
                  "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              2
            </div>
            <div className="text-4xl mb-4">⚔️</div>
            <h3 className="text-xl font-bold mb-2 text-white">1v1</h3>
            <p className="text-gray-400 text-sm mb-3 text-left">
              Reta a otro jugador en una batalla de velocidad
            </p>
          </button>

          <button
            className={`relative max-w-[20rem] flex flex-col items-start justify-center bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border cursor-pointer transition-all duration-100 hover:scale-105 hover:bg-gray-900 ${
              selectedMode === "tournament"
                ? "border-orange-500 bg-gray-800/90"
                : "border-gray-700 hover:border-gray-600"
            }`}
            onClick={() => {
              setSelectedMode("tournament");
            }}
          >
            {/* Keyboard Key */}
            <div
              className="absolute top-2 right-2 w-6 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
              style={{
                boxShadow:
                  "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              3
            </div>
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2 text-white">Torneo</h3>
            <p className="text-gray-400 text-sm mb-3 text-left">
              Compite contra múltiples jugadores en un torneo
            </p>
          </button>
        </div>
      </main>

      <div className="absolute bottom-0  w-full flex justify-center">
        <Button
          onClick={handleStart}
          className="w-full py-8 relative"
          disabled={!selectedMode}
        >
          <div className="flex items-center space-x-4">
            <Text variant="h6" className="text-white font-bold">
              {selectedMode === "practice"
                ? "Empezar Práctica"
                : "Buscar Partida"}
            </Text>
            {/* Space Key */}
            <div
              className="w-12 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
              style={{
                boxShadow:
                  "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              SPACE
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}
