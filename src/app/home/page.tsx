"use client";
import { useUser } from "@clerk/nextjs";
import { useSetAtom } from "jotai/react";
import { useResetAtom } from "jotai/utils";
import { useRouter } from "next/navigation";
import { practicePhrases } from "@/constants";
import { Text } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback, useTransition } from "react";
import { practiceAtom } from "@/states/practice.states";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function HomePage() {
  const ownUser = useQuery(api.user.getOwnUser);

  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [selectedMode, setSelectedMode] = useState("");
  const [isPending, startTransition] = useTransition();

  const setPractice = useSetAtom(practiceAtom);
  const resetPractice = useResetAtom(practiceAtom);
  const getInQueue = useMutation(api.queue.getInQueue);

  const phrases = practicePhrases;

  const getShuffledPhrases = useCallback(() => {
    return phrases.sort(() => Math.random() - 0.5).slice(0, 5);
  }, [phrases]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleStart = useCallback(async () => {
    if (selectedMode === "practice") {
      resetPractice();
      setPractice({
        phrases: getShuffledPhrases().map((phrase) => phrase) as string[],
      });
      router.push("/practice");
    } else if (selectedMode === "1v1") {
      startTransition(async () => {
        await getInQueue({
          queueId: Math.random().toString(36).substring(2, 15),
        });
      });
      // router.push("/1v1");
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
      } else if (
        event.key === " " &&
        selectedMode &&
        (selectedMode !== "1v1" || !ownUser?.queueId)
      ) {
        event.preventDefault(); // Prevent page scroll
        handleStart();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [selectedMode, handleStart, ownUser?.queueId]);

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
            } ${ownUser?.queueId ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => {
              if (!ownUser?.queueId) {
                setSelectedMode("1v1");
              }
            }}
            disabled={!!ownUser?.queueId}
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
          loading={isPending}
          onClick={handleStart}
          disabled={
            !selectedMode || (selectedMode === "1v1" && !!ownUser?.queueId)
          }
          className="w-full py-8 relative"
        >
          <div className="flex items-center space-x-4">
            <Text variant="h6" className="text-white font-bold">
              {selectedMode === "practice"
                ? "Empezar Práctica"
                : "Buscar Partida"}
            </Text>
            {/* Space Key */}
            <div
              className={`w-12 h-6 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30 ${
                !selectedMode || (selectedMode === "1v1" && !!ownUser?.queueId)
                  ? "bg-white/10 opacity-50"
                  : "bg-white/20"
              }`}
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
