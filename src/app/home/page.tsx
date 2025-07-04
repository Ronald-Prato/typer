"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Text } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MatchHistory } from "@/components/domains/MatchHistory";

export default function HomePage() {
  const ownUser = useQuery(api.user.getOwnUser);

  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [selectedMode, setSelectedMode] = useState("");
  const [activeTab, setActiveTab] = useState("partida");
  const [isPending, startTransition] = useTransition();

  const getInQueue = useMutation(api.queue.getInQueue);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleStart = useCallback(async () => {
    if (selectedMode === "practice") {
      router.push("/practice");
    } else if (selectedMode === "1v1") {
      startTransition(async () => {
        await getInQueue({
          queueId: Math.random().toString(36).substring(2, 15),
        });
      });
      // router.push("/1v1");
    }
    // Tournament mode is disabled - do nothing
  }, [selectedMode, router]);

  // Listen for number keys, space, and tab shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "1") {
        setSelectedMode("practice");
      } else if (event.key === "2") {
        setSelectedMode("1v1");
      } else if (event.key === "3") {
        // Tournament mode is disabled - do nothing
        return;
      } else if (event.key === "q" || event.key === "Q") {
        setActiveTab("partida");
      } else if (event.key === "e" || event.key === "E") {
        setActiveTab("historial");
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
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-6xl"
      >
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="partida" shortcut="Q">
            Partida
          </TabsTrigger>
          <TabsTrigger value="historial" shortcut="E">
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partida" className="space-y-8 flex flex-col">
          {/* Main Content */}
          <main className="relative z-10 flex-1 mt-4">
            {/* Practice Modes */}
            <div className="grid grid-cols-3 gap-6">
              <motion.button
                animate={{
                  y: selectedMode === "practice" ? -8 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 800,
                  damping: 25,
                  duration: 0.15,
                }}
                className={`relative max-w-[20rem] w-full flex flex-col items-start justify-center rounded-2xl p-6 border cursor-pointer ${
                  selectedMode === "practice"
                    ? "border-orange-500 bg-gradient-to-br from-orange-500/20 to-red-500/20 shadow-lg shadow-orange-500/25"
                    : "border-gray-700 hover:border-gray-600 bg-gray-900/90 hover:bg-gray-900"
                }`}
                onClick={() => {
                  setSelectedMode("practice");
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
                <h3
                  className={`text-xl font-bold mb-2 ${
                    selectedMode === "practice" ? "text-white" : "text-white"
                  }`}
                >
                  Práctica
                </h3>
                <p
                  className={`text-sm mb-3 text-left ${
                    selectedMode === "practice"
                      ? "text-white/80"
                      : "text-gray-400"
                  }`}
                >
                  Mejora tus habilidades de escritura practicando solo
                </p>
              </motion.button>

              <motion.button
                animate={{
                  y: selectedMode === "1v1" ? -8 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 800,
                  damping: 25,
                  duration: 0.15,
                }}
                className={`relative max-w-[20rem] flex flex-col items-start justify-center rounded-2xl p-6 border cursor-pointer ${
                  selectedMode === "1v1"
                    ? "border-orange-500 bg-gradient-to-br from-orange-500/20 to-red-500/20 shadow-lg shadow-orange-500/25"
                    : "border-gray-700 hover:border-gray-600 bg-gray-900/90 hover:bg-gray-900"
                } ${ownUser?.queueId ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => {
                  if (!ownUser?.queueId) {
                    setSelectedMode("1v1");
                  }
                }}
                disabled={!!ownUser?.queueId}
                whileHover={{ scale: ownUser?.queueId ? 1 : 1.02 }}
                whileTap={{ scale: ownUser?.queueId ? 1 : 0.98 }}
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
                <h3
                  className={`text-xl font-bold mb-2 ${
                    selectedMode === "1v1" ? "text-white" : "text-white"
                  }`}
                >
                  1v1
                </h3>
                <p
                  className={`text-sm mb-3 text-left ${
                    selectedMode === "1v1" ? "text-white/80" : "text-gray-400"
                  }`}
                >
                  Reta a otro jugador en una batalla de velocidad
                </p>
              </motion.button>

              <motion.button
                className="relative max-w-[20rem] flex flex-col items-start justify-center bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 cursor-not-allowed opacity-60"
                disabled={true}
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
                <h3 className="text-xl font-bold mb-2 text-gray-400">Torneo</h3>
                <p className="text-gray-500 text-sm mb-3 text-left">
                  Compite contra múltiples jugadores en un torneo
                </p>
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm rounded-2xl">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🛠️</div>
                    <Text variant="body2" className="text-gray-300 font-medium">
                      En desarrollo
                    </Text>
                  </div>
                </div>
              </motion.button>
            </div>
          </main>

          {/* Keyboard Hint */}
          <div className="text-center">
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
              para seleccionar,{" "}
              <kbd className="px-2 py-1 bg-gray-700/50 text-gray-200 rounded text-sm mx-1">
                Q
              </kbd>
              <kbd className="px-2 py-1 bg-gray-700/50 text-gray-200 rounded text-sm mx-1">
                E
              </kbd>
              para cambiar tabs, y{" "}
              <kbd className="px-3 py-1 bg-gray-700/50 text-gray-200 rounded text-sm mx-1">
                Space
              </kbd>
              para empezar
            </Text>
          </div>

          <div className="w-full absolute bottom-0 flex justify-center">
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
                    !selectedMode ||
                    (selectedMode === "1v1" && !!ownUser?.queueId)
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
        </TabsContent>

        <TabsContent value="historial" className="space-y-6">
          <MatchHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
